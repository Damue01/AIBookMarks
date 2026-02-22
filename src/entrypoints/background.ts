import { handleBookmarkMessages } from '@/background/bookmarks';
import { startAutoClassifyListener, moveToFolder } from '@/background/auto-classify';
import {
  startAnalysis,
  stopAnalysis,
  getAnalysisState,
  resetAnalysis,
  planCategories,
} from '@/background/analysis';
import type {
  ExtensionMessage,
  ExtensionResponse,
  StartAnalysisPayload,
  PlanCategoriesPayload,
  AcceptClassifyPayload,
} from '@/shared/types';

export default defineBackground(() => {
  startAutoClassifyListener();

  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender,
      sendResponse: (r: ExtensionResponse) => void,
    ) => {
      handleMessage(message, sendResponse);
      return true;
    },
  );

  chrome.runtime.onStartup.addListener(async () => {
    const stored = await chrome.storage.local.get('aibm_pending_organize');
    if (stored['aibm_pending_organize']) {
      await chrome.storage.local.remove('aibm_pending_organize');
    }
  });
});

async function handleMessage(
  message: ExtensionMessage,
  sendResponse: (r: ExtensionResponse) => void,
) {
  try {
    // Handle analysis messages separately (they run in background)
    switch (message.type) {
      case 'START_ANALYSIS': {
        const payload = message.payload as StartAnalysisPayload;
        // Fire-and-forget: analysis runs in background, broadcasts progress
        startAnalysis(payload);
        sendResponse({ success: true, data: 'Analysis started' });
        return;
      }
      case 'STOP_ANALYSIS': {
        stopAnalysis();
        sendResponse({ success: true, data: 'Analysis stopped' });
        return;
      }
      case 'GET_ANALYSIS_STATE': {
        const state = getAnalysisState();
        sendResponse({ success: true, data: state });
        return;
      }
      case 'RESET_ANALYSIS': {
        resetAnalysis();
        sendResponse({ success: true, data: 'Analysis reset' });
        return;
      }
      case 'PLAN_CATEGORIES': {
        const payload = message.payload as PlanCategoriesPayload;
        planCategories(payload)
          .then((plan) => sendResponse({ success: true, data: plan }))
          .catch((e) =>
            sendResponse({
              success: false,
              error: e instanceof Error ? e.message : 'Failed to plan categories',
            }),
          );
        return;
      }
      case 'ACCEPT_CLASSIFY': {
        const payload = message.payload as AcceptClassifyPayload;
        moveToFolder(payload.bookmarkId, payload.suggestedFolder)
          .then(() => sendResponse({ success: true }))
          .catch((e) =>
            sendResponse({
              success: false,
              error: e instanceof Error ? e.message : 'Failed to move bookmark',
            }),
          );
        return;
      }
    }

    // All other messages go through the bookmark handler
    const result = await handleBookmarkMessages(message);
    sendResponse({ success: true, data: result });
  } catch (e) {
    sendResponse({
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    });
  }
}
