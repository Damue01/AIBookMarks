import { create } from 'zustand';
import type { BookmarkFlat, BookmarkNode, FolderNode } from '@/shared/types';
import {
  flattenBookmarks,
  extractFolders,
  countBookmarkTree,
  countUnclassified,
} from '@/shared/utils';

interface BookmarkStats {
  total: number;
  folders: number;
  unclassified: number;
}

interface BookmarksState {
  tree: BookmarkNode[];
  flat: BookmarkFlat[];
  folders: FolderNode[];
  stats: BookmarkStats;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useBookmarksStore = create<BookmarksState>((set, get) => {
  // Listen for chrome.bookmarks changes and auto-refresh
  // (Safe to call multiple times — Chrome deduplicates the same function ref)
  let listenersBound = false;
  function ensureListeners() {
    if (listenersBound) return;
    listenersBound = true;
    const handler = () => { get().refresh(); };
    chrome.bookmarks.onCreated.addListener(handler);
    chrome.bookmarks.onRemoved.addListener(handler);
    chrome.bookmarks.onMoved.addListener(handler);
    chrome.bookmarks.onChanged.addListener(handler);
  }

  return {
    tree: [],
    flat: [],
    folders: [],
    stats: { total: 0, folders: 0, unclassified: 0 },
    loading: false,
    error: null,

    async fetchAll() {
      set({ loading: true, error: null });
      ensureListeners();
      try {
        const tree = await chrome.bookmarks.getTree() as BookmarkNode[];
        const flat = flattenBookmarks(tree);
        const folders = extractFolders(tree);
        const { bookmarks, folders: folderCount } = countBookmarkTree(tree);
        const unclassified = countUnclassified(tree);
        set({
          tree,
          flat,
          folders,
          stats: { total: bookmarks, folders: folderCount, unclassified },
          loading: false,
        });
      } catch (e) {
        set({
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load bookmarks',
        });
      }
    },

    async refresh() {
      await get().fetchAll();
    },
  };
});
