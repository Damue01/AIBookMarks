import type { ExtensionMessage, ExtensionResponse } from '@/shared/types';
import { handleBookmarkMessages } from './bookmarks';
import { startAutoClassifyListener } from './auto-classify';

// Initialize auto-classify listener on startup
startAutoClassifyListener();

// Message handler for popup / options page
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (r: ExtensionResponse) => void,
  ) => {
    // All async handlers must return true to keep the port open
    handleMessage(message, sendResponse);
    return true;
  },
);

async function handleMessage(
  message: ExtensionMessage,
  sendResponse: (r: ExtensionResponse) => void,
) {
  try {
    const result = await handleBookmarkMessages(message);
    sendResponse({ success: true, data: result });
  } catch (e) {
    sendResponse({
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    });
  }
}

// Handle incomplete organizes on extension startup
chrome.runtime.onStartup.addListener(async () => {
  const stored = await chrome.storage.local.get('aibm_pending_organize');
  if (stored['aibm_pending_organize']) {
    // Notify popup that there's a pending task to resume
    await chrome.storage.local.remove('aibm_pending_organize');
  }
});
