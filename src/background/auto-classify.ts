import type { BookmarkFlat, BookmarkNode, ClassifyToastPayload, ClassifyResultPayload } from '@/shared/types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@/shared/constants';
import { createAIService } from '@/services/ai';
import { findMatchingRule } from '@/services/rules';
import { flattenBookmarks, extractFolders, getActiveAIConfig } from '@/shared/utils';
import { getI18n } from '@/services/i18n';

export function startAutoClassifyListener() {
  chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
    if (!bookmark.url) return; // It's a folder, not a bookmark

    const stored = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = stored[STORAGE_KEYS.SETTINGS] ?? DEFAULT_SETTINGS;

    if (!settings.autoClassify?.enabled) return;

    const url = bookmark.url;
    const title = bookmark.title || url;

    // Pre-translate UI strings for content script
    const t = getI18n(settings.language ?? 'en');
    const strings: ClassifyToastPayload['strings'] = {
      analyzing: t('classify.analyzing'),
      accept: t('classify.accept'),
      ignore: t('classify.ignore'),
      suggestion: t('classify.suggestion'),
      ruleMatch: t('classify.ruleMatch'),
      aiSuggestion: t('classify.aiSuggestion'),
      moved: t('classify.moved'),
      error: t('classify.error'),
    };

    // Check user rules first
    const matchedRule = findMatchingRule(url, settings.rules ?? []);
    if (matchedRule) {
      if (settings.autoClassify.silentMode) {
        await moveToFolder(id, matchedRule.targetFolderPath);
      } else {
        // Show toast immediately with result (rule match is instant)
        await sendToActiveTab('SHOW_CLASSIFY_TOAST', {
          bookmarkId: id, title, url, strings,
        } satisfies ClassifyToastPayload);
        // Send result immediately after
        await sendToActiveTab('CLASSIFY_RESULT', {
          bookmarkId: id,
          suggestedFolder: matchedRule.targetFolderPath,
          source: 'rule',
        } satisfies ClassifyResultPayload);
      }
      return;
    }

    // Otherwise ask AI
    // Show loading toast immediately
    if (!settings.autoClassify.silentMode) {
      await sendToActiveTab('SHOW_CLASSIFY_TOAST', {
        bookmarkId: id, title, url, strings,
      } satisfies ClassifyToastPayload);
    }

    try {
      const ai = createAIService(getActiveAIConfig(settings));
      const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];
      const folders = extractFolders(tree);
      const flat = flattenBookmarks(tree);
      const bm = flat.find((b) => b.id === id);
      if (!bm) {
        if (!settings.autoClassify.silentMode) {
          await sendToActiveTab('DISMISS_CLASSIFY', { bookmarkId: id });
        }
        return;
      }

      const results = await ai.analyzeBatch([bm], folders);
      const suggestion = results[0];
      if (!suggestion) {
        if (!settings.autoClassify.silentMode) {
          await sendToActiveTab('DISMISS_CLASSIFY', { bookmarkId: id, error: strings.error });
        }
        return;
      }

      if (settings.autoClassify.silentMode) {
        await moveToFolder(id, suggestion.suggestedFolder);
      } else {
        await sendToActiveTab('CLASSIFY_RESULT', {
          bookmarkId: id,
          suggestedFolder: suggestion.suggestedFolder,
          source: 'ai',
        } satisfies ClassifyResultPayload);
      }
    } catch (err) {
      // AI call failed — dismiss toast with error
      if (!settings.autoClassify.silentMode) {
        const errorMsg = err instanceof Error ? err.message : strings.error;
        await sendToActiveTab('DISMISS_CLASSIFY', { bookmarkId: id, error: errorMsg });
      }
    }
  });
}

/** Send a message to the active tab's content script */
async function sendToActiveTab(type: string, payload: unknown) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, { type, payload });
    }
  } catch {
    // Content script may not be injected yet — best-effort
  }
}

/** Normalize a folder path for comparison */
function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').split('/').filter(Boolean).join('/').toLowerCase();
}

/** Strip known root folder names from path */
function stripRoot(path: string): string {
  const parts = normalizePath(path).split('/');
  const roots = ['bookmarks bar', 'other bookmarks', 'mobile bookmarks', '书签栏', '其他书签', '移动设备书签'];
  if (parts.length > 0 && roots.includes(parts[0])) return parts.slice(1).join('/');
  return parts.join('/');
}

export async function moveToFolder(bookmarkId: string, folderPath: string) {
  try {
    const tree = (await chrome.bookmarks.getTree()) as BookmarkNode[];
    const folders = extractFolders(tree);
    const target = stripRoot(folderPath);
    // Match by normalized path (case-insensitive, root stripped)
    const folder = folders.find((f) => stripRoot(f.path) === target);
    if (folder) {
      await chrome.bookmarks.move(bookmarkId, { parentId: folder.id });
    }
  } catch {
    // best-effort
  }
}
