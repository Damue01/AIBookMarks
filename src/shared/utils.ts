import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BookmarkNode, BookmarkFlat, FolderNode, AppSettings, AIProviderConfig } from './types';
import { DEFAULT_PROVIDER_CONFIGS } from './constants';

// ─── Tailwind utility ─────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Bookmark tree utilities ──────────────────────────────────────────────────

/** Flatten the bookmark tree into a list of bookmark (leaf) nodes */
export function flattenBookmarks(
  nodes: BookmarkNode[],
  folderPath = '',
  folderId?: string,
): BookmarkFlat[] {
  const result: BookmarkFlat[] = [];
  for (const node of nodes) {
    if (node.url) {
      result.push({
        id: node.id,
        parentId: node.parentId,
        title: node.title,
        url: node.url,
        currentFolderPath: folderPath || '/',
        currentFolderId: folderId,
      });
    } else if (node.children) {
      const childPath = folderPath ? `${folderPath}/${node.title}` : node.title;
      result.push(...flattenBookmarks(node.children, childPath, node.id));
    }
  }
  return result;
}

/** Extract all folders as a flat list with full path */
export function extractFolders(
  nodes: BookmarkNode[],
  parentPath = '',
): FolderNode[] {
  const result: FolderNode[] = [];
  for (const node of nodes) {
    if (!node.url) {
      const path = parentPath ? `${parentPath}/${node.title}` : node.title;
      const folder: FolderNode = {
        id: node.id,
        parentId: node.parentId,
        title: node.title,
        path,
        children: [],
      };
      if (node.children) {
        folder.children = extractFolders(node.children, path) as FolderNode[];
        result.push(folder);
        result.push(...folder.children);
      } else {
        result.push(folder);
      }
    }
  }
  return result;
}

/** Count bookmarks and folders */
export function countBookmarkTree(nodes: BookmarkNode[]): {
  bookmarks: number;
  folders: number;
} {
  let bookmarks = 0;
  let folders = 0;
  for (const node of nodes) {
    if (node.url) {
      bookmarks++;
    } else {
      folders++;
      if (node.children) {
        const child = countBookmarkTree(node.children);
        bookmarks += child.bookmarks;
        folders += child.folders;
      }
    }
  }
  return { bookmarks, folders };
}

/** IDs of Chrome's root-level system folders */
export const ROOT_FOLDER_IDS = new Set(['0', '1', '2']);

/** Count unclassified bookmarks (direct children of root system folders) */
export function countUnclassified(nodes: BookmarkNode[]): number {
  let count = 0;
  function walk(node: BookmarkNode) {
    if (!node.url && node.children) {
      if (ROOT_FOLDER_IDS.has(node.id)) {
        for (const child of node.children) {
          if (child.url) count++;
        }
        for (const child of node.children) {
          if (!child.url) walk(child);
        }
      }
    }
  }
  for (const node of nodes) {
    walk(node);
  }
  return count;
}

/** Check if a bookmark is "unclassified" — sits directly under a root system folder */
export function isUnclassified(bookmark: BookmarkFlat): boolean {
  return ROOT_FOLDER_IDS.has(bookmark.parentId ?? '');
}

// ─── Batch utilities ──────────────────────────────────────────────────────────

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── String utilities ─────────────────────────────────────────────────────────

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

// ─── Date utilities ───────────────────────────────────────────────────────────

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

// ─── ID generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── AI config helpers ────────────────────────────────────────────────────────

/** Resolve the active AI provider config from AppSettings (handles both legacy & new format) */
export function getActiveAIConfig(settings: AppSettings): AIProviderConfig {
  const ap = settings.aiProvider as any;
  // Legacy format: { provider, apiKey, baseUrl, model, ... }
  if (ap && typeof ap.provider === 'string' && !ap.configs) {
    return ap as AIProviderConfig;
  }
  // New format: { activeProvider, configs: { ... } }
  const active = ap.activeProvider ?? 'openai';
  const cfg = ap.configs?.[active];
  if (cfg) return cfg;
  return DEFAULT_PROVIDER_CONFIGS[active as keyof typeof DEFAULT_PROVIDER_CONFIGS];
}
