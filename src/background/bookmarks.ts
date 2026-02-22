import type {
  ExtensionMessage,
  BookmarkNode,
  BookmarkSuggestion,
} from '@/shared/types';
import { flattenBookmarks, extractFolders } from '@/shared/utils';

export async function handleBookmarkMessages(
  message: ExtensionMessage,
): Promise<unknown> {
  switch (message.type) {
    case 'GET_BOOKMARK_TREE': {
      const tree = await chrome.bookmarks.getTree();
      return tree;
    }

    case 'GET_FLAT_BOOKMARKS': {
      const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];
      return flattenBookmarks(tree);
    }

    case 'GET_FOLDERS': {
      const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];
      return extractFolders(tree);
    }

    case 'EXECUTE_ORGANIZE': {
      const suggestions = message.payload as BookmarkSuggestion[];
      return executeOrganize(suggestions);
    }

    case 'DEDUPLICATE_FOLDERS': {
      return deduplicateFolders();
    }

    case 'CLEANUP_EMPTY_FOLDERS': {
      return cleanupEmptyFolders();
    }

    default:
      throw new Error(`Unhandled message type: ${message.type}`);
  }
}

interface OrganizeResult {
  succeeded: number;
  failed: number;
  errors: string[];
  merged?: number;
  cleaned?: number;
}

// ─── Normalize path for matching ──────────────────────────────────────────────
/** Normalize a folder path: trim, collapse slashes, lowercase for comparison */
function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('/')
    .trim();
}

/** Strip root folder names that Chrome uses (Bookmarks Bar, Other bookmarks, etc.) */
function stripRootPrefix(path: string): string {
  const normalized = normalizePath(path);
  // Common root folder names in different languages
  const rootPrefixes = [
    'bookmarks bar', 'other bookmarks', 'mobile bookmarks',
    '书签栏', '其他书签', '移动设备书签',
  ];
  const parts = normalized.split('/');
  if (parts.length > 0 && rootPrefixes.includes(parts[0].toLowerCase())) {
    return parts.slice(1).join('/');
  }
  return normalized;
}

// ─── Build a comprehensive folder cache ───────────────────────────────────────
/** Pre-populate cache with ALL existing folders from the bookmark tree */
async function buildFolderCache(): Promise<Map<string, string>> {
  const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];
  const cache = new Map<string, string>();
  const folders = extractFolders(tree);
  for (const f of folders) {
    const stripped = stripRootPrefix(f.path);
    if (stripped) {
      cache.set(stripped, f.id);
      // Also store lowercase version for case-insensitive matching
      cache.set(stripped.toLowerCase(), f.id);
    }
  }
  return cache;
}

async function executeOrganize(
  suggestions: BookmarkSuggestion[],
): Promise<OrganizeResult> {
  const accepted = suggestions.filter(
    (s) => s.status === 'accepted' || s.status === 'modified',
  );

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  // Pre-populate cache with ALL existing folders to avoid duplicates
  const folderCache = await buildFolderCache();

  // First pass: ensure all target folders exist (reusing existing ones)
  for (const s of accepted) {
    if (s.changeType === 'no-change') continue;
    const targetPath = normalizePath(s.suggestedFolderPath);
    const strippedPath = stripRootPrefix(targetPath);
    if (!strippedPath) continue;

    if (!folderCache.has(strippedPath) && !folderCache.has(strippedPath.toLowerCase())) {
      try {
        const folderId = await ensureFolderPath(strippedPath, folderCache);
        folderCache.set(strippedPath, folderId);
      } catch (e) {
        errors.push(
          `Failed to create folder "${s.suggestedFolderPath}": ${e instanceof Error ? e.message : e}`,
        );
      }
    }
  }

  // Second pass: move bookmarks
  for (const s of accepted) {
    if (s.changeType === 'no-change') continue;
    try {
      const targetPath = normalizePath(s.suggestedFolderPath);
      const strippedPath = stripRootPrefix(targetPath);

      const targetId =
        s.suggestedFolderId ||
        folderCache.get(strippedPath) ||
        folderCache.get(strippedPath.toLowerCase()) ||
        (await resolveFolderPath(targetPath));

      if (!targetId) throw new Error(`Could not resolve target folder: ${s.suggestedFolderPath}`);

      // Verify bookmark still exists before moving
      try {
        await chrome.bookmarks.get(s.bookmarkId);
      } catch {
        throw new Error('Bookmark no longer exists');
      }

      await chrome.bookmarks.move(s.bookmarkId, { parentId: targetId });
      succeeded++;
    } catch (e) {
      failed++;
      errors.push(
        `Failed to move "${s.title}": ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  // Third pass: clean up empty folders and merge duplicates
  let merged = 0;
  let cleaned = 0;
  try {
    const mergeResult = await deduplicateFolders();
    merged = mergeResult.merged;
    const cleanResult = await cleanupEmptyFolders();
    cleaned = cleanResult.removed;
  } catch {
    // Best-effort cleanup
  }

  return { succeeded, failed, errors, merged, cleaned };
}

// ─── Folder deduplication ─────────────────────────────────────────────────────
/** Find and merge duplicate folders (same name under the same parent) */
async function deduplicateFolders(): Promise<{ merged: number; errors: string[] }> {
  const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];
  let merged = 0;
  const errors: string[] = [];

  async function dedupeChildren(node: BookmarkNode) {
    if (!node.children) return;

    // Group folder children by normalized title
    const folderGroups = new Map<string, BookmarkNode[]>();
    for (const child of node.children) {
      if (!child.url) {
        const key = child.title.trim().toLowerCase();
        if (!folderGroups.has(key)) folderGroups.set(key, []);
        folderGroups.get(key)!.push(child);
      }
    }

    // Merge duplicates
    for (const [, group] of folderGroups) {
      if (group.length <= 1) continue;

      // Keep the first folder, merge everything from others into it
      const primary = group[0];
      for (let i = 1; i < group.length; i++) {
        const duplicate = group[i];
        try {
          // Move all children from duplicate into primary
          const dupChildren = await chrome.bookmarks.getChildren(duplicate.id);
          for (const child of dupChildren) {
            await chrome.bookmarks.move(child.id, { parentId: primary.id });
          }
          // Remove the now-empty duplicate folder
          await chrome.bookmarks.remove(duplicate.id);
          merged++;
        } catch (e) {
          errors.push(
            `Failed to merge folder "${duplicate.title}": ${e instanceof Error ? e.message : e}`,
          );
        }
      }
    }

    // Recurse into remaining children
    // Re-fetch children since we may have moved things
    try {
      const refreshed = await chrome.bookmarks.getChildren(node.id);
      for (const child of refreshed) {
        if (!child.url) {
          // Fetch full subtree for this child
          const subtree = await chrome.bookmarks.getSubTree(child.id);
          if (subtree[0]) {
            await dedupeChildren(subtree[0] as BookmarkNode);
          }
        }
      }
    } catch {
      // folder may have been removed
    }
  }

  // Process root nodes
  for (const root of tree) {
    await dedupeChildren(root);
  }

  return { merged, errors };
}

// ─── Empty folder cleanup ─────────────────────────────────────────────────────
/** Remove empty folders (except system root folders) */
async function cleanupEmptyFolders(): Promise<{ removed: number }> {
  const SYSTEM_IDS = new Set(['0', '1', '2']); // root, bookmarks bar, other
  let removed = 0;

  async function cleanNode(nodeId: string): Promise<boolean> {
    if (SYSTEM_IDS.has(nodeId)) {
      // Don't remove system folders, but still recurse
      try {
        const children = await chrome.bookmarks.getChildren(nodeId);
        for (const child of children) {
          if (!child.url) {
            await cleanNode(child.id);
          }
        }
      } catch { /* ok */ }
      return false;
    }

    try {
      const children = await chrome.bookmarks.getChildren(nodeId);

      // Recurse into child folders first (bottom-up)
      for (const child of children) {
        if (!child.url) {
          await cleanNode(child.id);
        }
      }

      // Re-check after recursion
      const remaining = await chrome.bookmarks.getChildren(nodeId);
      if (remaining.length === 0) {
        await chrome.bookmarks.remove(nodeId);
        removed++;
        return true;
      }
    } catch {
      // Node may already be removed
    }
    return false;
  }

  const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];
  for (const root of tree) {
    if (root.children) {
      for (const child of root.children) {
        if (!child.url) {
          await cleanNode(child.id);
        }
      }
    }
  }

  return { removed };
}

/** Find a folder by its path (slash-separated titles), with fuzzy matching */
async function resolveFolderPath(path: string): Promise<string | null> {
  const stripped = stripRootPrefix(path);
  const parts = stripped.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];

  // Try to resolve from each root folder (Bookmarks Bar, Other Bookmarks)
  for (const root of tree) {
    if (!root.children) continue;
    for (const rootChild of root.children) {
      if (rootChild.url) continue;

      // Check if first part matches this root folder
      if (rootChild.title.toLowerCase() === parts[0].toLowerCase()) {
        const result = resolveFromNode(rootChild, parts.slice(1));
        if (result) return result;
      }

      // Try to resolve the full path under this root folder
      const result = resolveFromNode(rootChild, parts);
      if (result) return result;
    }
  }

  // Also try from tree top-level directly
  for (const root of tree) {
    const result = resolveFromNode(root, parts);
    if (result) return result;
  }

  return null;
}

/** Recursively step through path parts starting from a given node */
function resolveFromNode(node: BookmarkNode, parts: string[]): string | null {
  if (parts.length === 0) return node.id;
  if (!node.children) return null;

  const [next, ...rest] = parts;
  const match = node.children.find(
    (n) => !n.url && n.title.toLowerCase() === next.toLowerCase(),
  );
  if (match) return resolveFromNode(match, rest);
  return null;
}

/** Create folder path recursively, returning leaf folder id */
async function ensureFolderPath(
  path: string,
  cache: Map<string, string>,
): Promise<string> {
  const parts = normalizePath(path).split('/').filter(Boolean);
  // Default to "Other Bookmarks" (id=2) to avoid cluttering the bookmarks bar
  let parentId = '2';
  let currentPath = '';

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const cachedId = cache.get(currentPath) || cache.get(currentPath.toLowerCase());
    if (cachedId) {
      parentId = cachedId;
      continue;
    }
    // Try to find existing folder (case-insensitive)
    const existing = await findChildFolder(parentId, part);
    if (existing) {
      cache.set(currentPath, existing);
      cache.set(currentPath.toLowerCase(), existing);
      parentId = existing;
    } else {
      // Create it
      const created = await chrome.bookmarks.create({ parentId, title: part });
      cache.set(currentPath, created.id);
      cache.set(currentPath.toLowerCase(), created.id);
      parentId = created.id;
    }
  }
  return parentId;
}

/** Find a child folder by title (case-insensitive) */
async function findChildFolder(
  parentId: string,
  title: string,
): Promise<string | null> {
  const children = await chrome.bookmarks.getChildren(parentId);
  const titleLower = title.toLowerCase();
  const match = children.find((c) => !c.url && c.title.toLowerCase() === titleLower);
  return match?.id ?? null;
}
