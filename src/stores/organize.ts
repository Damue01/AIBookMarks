import { create } from 'zustand';
import type {
  BookmarkSuggestion,
  AnalysisProgress,
  OrganizeOptions,
  BookmarkFlat,
  FolderNode,
  ChangeType,
  AnalysisState,
  ExtensionMessage,
} from '@/shared/types';

type FilterType = 'all' | ChangeType | 'pending';

interface OrganizeState {
  suggestions: BookmarkSuggestion[];
  progress: AnalysisProgress;
  filter: FilterType;
  searchQuery: string;
  /** Whether we've set up the background message listener */
  _listening: boolean;

  // Actions
  startAnalysis: (bookmarks: BookmarkFlat[], folders: FolderNode[], options: OrganizeOptions & { confirmedCategories?: string[] }) => Promise<void>;
  stopAnalysis: () => void;
  syncFromBackground: () => Promise<void>;
  setSuggestionStatus: (bookmarkId: string, status: BookmarkSuggestion['status']) => void;
  setSuggestionFolder: (bookmarkId: string, folderPath: string, folderId?: string) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  setFilter: (f: FilterType) => void;
  setSearchQuery: (q: string) => void;
  getFiltered: () => BookmarkSuggestion[];
  reset: () => void;
  _startListening: () => void;
}

const INITIAL_PROGRESS: AnalysisProgress = {
  phase: 'idle',
  processed: 0,
  total: 0,
  currentBatch: 0,
  totalBatches: 0,
  currentItems: [],
};

export const useOrganizeStore = create<OrganizeState>((set, get) => ({
  suggestions: [],
  progress: INITIAL_PROGRESS,
  filter: 'all',
  searchQuery: '',
  _listening: false,

  /** Start listening for ANALYSIS_PROGRESS broadcasts from background */
  _startListening() {
    if (get()._listening) return;
    set({ _listening: true });

    chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
      if (message.type === 'ANALYSIS_PROGRESS') {
        const state = message.payload as AnalysisState;
        set({
          progress: state.progress,
          suggestions: state.suggestions,
        });
      }
    });
  },

  /** Send START_ANALYSIS to background — analysis runs there, not here */
  async startAnalysis(bookmarks, folders, options) {
    // Ensure we're listening for progress broadcasts
    get()._startListening();

    set({
      suggestions: [],
      progress: {
        phase: 'scanning',
        processed: 0,
        total: bookmarks.length,
        currentBatch: 0,
        totalBatches: 0,
        currentItems: [],
      },
    });

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'START_ANALYSIS',
        payload: {
          bookmarks,
          folders,
          scope: options.scope,
          batchSize: options.batchSize,
          confirmedCategories: options.confirmedCategories,
        },
      });
      if (!response?.success) {
        set({
          progress: {
            ...INITIAL_PROGRESS,
            phase: 'error',
            error: response?.error || 'Failed to start analysis',
          },
        });
      }
    } catch (e) {
      set({
        progress: {
          ...INITIAL_PROGRESS,
          phase: 'error',
          error: e instanceof Error ? e.message : 'Failed to start analysis',
        },
      });
    }
  },

  /** Tell background to stop current analysis */
  stopAnalysis() {
    chrome.runtime.sendMessage({ type: 'STOP_ANALYSIS' }).catch(() => {});
  },

  /** Re-sync state from background (used when popup re-opens) */
  async syncFromBackground() {
    get()._startListening();
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ANALYSIS_STATE',
      });
      if (response?.success && response.data) {
        const state = response.data as AnalysisState;
        set({
          progress: state.progress,
          suggestions: state.suggestions,
        });
      }
    } catch {
      // background not available — keep local state
    }
  },

  setSuggestionStatus(bookmarkId, status) {
    set((s) => ({
      suggestions: s.suggestions.map((sg) =>
        sg.bookmarkId === bookmarkId ? { ...sg, status } : sg,
      ),
    }));
  },

  setSuggestionFolder(bookmarkId, folderPath, folderId) {
    set((s) => ({
      suggestions: s.suggestions.map((sg) =>
        sg.bookmarkId === bookmarkId
          ? {
              ...sg,
              suggestedFolderPath: folderPath,
              suggestedFolderId: folderId,
              status: 'modified',
            }
          : sg,
      ),
    }));
  },

  acceptAll() {
    set((s) => ({
      suggestions: s.suggestions.map((sg) =>
        sg.changeType !== 'no-change' ? { ...sg, status: 'accepted' } : sg,
      ),
    }));
  },

  rejectAll() {
    set((s) => ({
      suggestions: s.suggestions.map((sg) => ({ ...sg, status: 'rejected' })),
    }));
  },

  setFilter(f) {
    set({ filter: f });
  },

  setSearchQuery(q) {
    set({ searchQuery: q });
  },

  getFiltered() {
    const { suggestions, filter, searchQuery } = get();
    let filtered = suggestions;

    if (filter !== 'all') {
      if (filter === 'pending') {
        filtered = filtered.filter((s) => s.status === 'pending');
      } else {
        filtered = filtered.filter((s) => s.changeType === filter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          s.suggestedFolderPath.toLowerCase().includes(q),
      );
    }

    return filtered;
  },

  reset() {
    chrome.runtime.sendMessage({ type: 'RESET_ANALYSIS' }).catch(() => {});
    set({
      suggestions: [],
      progress: INITIAL_PROGRESS,
      filter: 'all',
      searchQuery: '',
    });
  },
}));
