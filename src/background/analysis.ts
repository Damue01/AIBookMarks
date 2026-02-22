/**
 * Background Analysis Module
 *
 * Runs AI bookmark analysis entirely in the background service worker
 * so it survives popup close / tab switching. Broadcasts progress
 * to any listening popup via chrome.runtime.sendMessage.
 */
import type {
  AnalysisProgress,
  AnalysisState,
  BookmarkFlat,
  BookmarkSuggestion,
  FolderNode,
  StartAnalysisPayload,
  PlanCategoriesPayload,
  CategoryPlanItem,
  AppSettings,
  ChangeType,
} from '@/shared/types';
import { createAIService } from '@/services/ai';
import { applyRulesToSuggestions } from '@/services/rules';
import { chunkArray, getActiveAIConfig } from '@/shared/utils';
import { STORAGE_KEYS } from '@/shared/constants';

// ─── Singleton state kept in the service worker ──────────────────────────────

let analysisProgress: AnalysisProgress = {
  phase: 'idle',
  processed: 0,
  total: 0,
  currentBatch: 0,
  totalBatches: 0,
  currentItems: [],
};

let analysisSuggestions: BookmarkSuggestion[] = [];
let abortFlag = false;

// ─── Broadcast helpers ────────────────────────────────────────────────────────

function broadcast(type: 'ANALYSIS_PROGRESS' | 'ANALYSIS_RESULT', payload: unknown) {
  // Best-effort: if no popup is listening, this silently fails
  try {
    chrome.runtime.sendMessage({ type, payload }).catch(() => {});
  } catch {
    // popup closed — ignore
  }
}

function broadcastState() {
  const state: AnalysisState = {
    progress: { ...analysisProgress },
    suggestions: [...analysisSuggestions],
  };
  broadcast('ANALYSIS_PROGRESS', state);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Return current snapshot so a newly-opened popup can sync immediately */
export function getAnalysisState(): AnalysisState {
  return {
    progress: { ...analysisProgress },
    suggestions: [...analysisSuggestions],
  };
}

/** Start the analysis loop (fire-and-forget from the message handler) */
export async function startAnalysis(payload: StartAnalysisPayload): Promise<void> {
  // If already running, stop the previous run first
  if (analysisProgress.phase === 'analyzing' || analysisProgress.phase === 'scanning') {
    abortFlag = true;
    // Give it a tick to settle
    await new Promise((r) => setTimeout(r, 50));
  }

  abortFlag = false;
  analysisSuggestions = [];

  const { bookmarks, folders, batchSize, confirmedCategories } = payload;
  const batches = chunkArray(bookmarks, batchSize);

  // Load settings to get AI config & rules
  const stored = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const settings: AppSettings | undefined = stored[STORAGE_KEYS.SETTINGS];
  if (!settings) {
    analysisProgress = {
      phase: 'error',
      processed: 0,
      total: 0,
      currentBatch: 0,
      totalBatches: 0,
      currentItems: [],
      error: 'Settings not found. Please configure your AI provider first.',
    };
    broadcastState();
    return;
  }

  const aiService = createAIService(getActiveAIConfig(settings));

  analysisProgress = {
    phase: 'scanning',
    processed: 0,
    total: bookmarks.length,
    currentBatch: 0,
    totalBatches: batches.length,
    currentItems: [],
  };
  broadcastState();

  try {
    for (let i = 0; i < batches.length; i++) {
      if (abortFlag) {
        analysisProgress = { ...analysisProgress, phase: 'idle', currentItems: [] };
        broadcastState();
        return;
      }

      const batch = batches[i];

      analysisProgress = {
        ...analysisProgress,
        phase: 'analyzing',
        currentBatch: i + 1,
        currentItems: batch.map((b) => ({ title: b.title, url: b.url })),
      };
      broadcastState();

      const results = await aiService.analyzeBatch(batch, folders, confirmedCategories);

      // Map results to suggestions
      const batchSuggestions: BookmarkSuggestion[] = results.map((r) => {
        const bm = batch.find((b) => b.id === r.bookmarkId);
        const sameFolder =
          bm?.currentFolderPath === r.suggestedFolder || r.suggestedFolder === '';
        const changeType: ChangeType = sameFolder
          ? 'no-change'
          : r.isNewFolder
            ? 'new-folder'
            : 'move';
        return {
          bookmarkId: r.bookmarkId,
          title: bm?.title ?? '',
          url: bm?.url ?? '',
          currentFolderPath: bm?.currentFolderPath ?? '',
          suggestedFolderPath: r.suggestedFolder,
          isNewFolder: r.isNewFolder,
          changeType,
          reason: r.reason,
          status: 'pending',
        };
      });

      // Apply user rules (override AI suggestions)
      const withRules = applyRulesToSuggestions(batchSuggestions, settings.rules);
      analysisSuggestions.push(...withRules);

      analysisProgress = {
        ...analysisProgress,
        processed: analysisProgress.processed + batch.length,
      };
      broadcastState();
    }

    analysisProgress = { ...analysisProgress, phase: 'done', currentItems: [] };
    broadcastState();
  } catch (e) {
    analysisProgress = {
      ...analysisProgress,
      phase: 'error',
      currentItems: [],
      error: e instanceof Error ? e.message : 'Analysis failed',
    };
    broadcastState();
  }
}

/** Abort a running analysis */
export function stopAnalysis(): void {
  abortFlag = true;
}

/** Reset analysis state (called when popup explicitly resets) */
export function resetAnalysis(): void {
  abortFlag = true;
  analysisProgress = {
    phase: 'idle',
    processed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    currentItems: [],
  };
  analysisSuggestions = [];
}

/** Ask AI to propose a category plan based on all bookmarks */
export async function planCategories(
  payload: PlanCategoriesPayload,
): Promise<CategoryPlanItem[]> {
  const { bookmarks, folders } = payload;

  // Load settings
  const stored = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const settings: AppSettings | undefined = stored[STORAGE_KEYS.SETTINGS];
  if (!settings) {
    throw new Error('Settings not found. Please configure your AI provider first.');
  }

  const aiService = createAIService(getActiveAIConfig(settings));
  return aiService.planCategories(bookmarks, folders);
}
