import { createRoot } from 'react-dom/client';
import React, { useState, useCallback, useEffect } from 'react';
import ClassifyToast from './ClassifyToast';
import type { ClassifyToastPayload } from '@/shared/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    let currentToast: ClassifyToastPayload | null = null;
    let rerender: (() => void) | null = null;

    // Create Shadow DOM UI
    // Use a neutral element name to avoid ad-blocker cosmetic filters
    // (words like 'overlay', 'popup', 'toast', 'notification' trigger blockers)
    const ui = await createShadowRootUi(ctx, {
      name: 'bkmk-ext',
      position: 'overlay',
      zIndex: 2147483546,
      // @ts-ignore - Vite inline CSS import
      css: (await import('./style.css?inline')).default,
      onMount(container) {
        const wrapper = document.createElement('div');
        wrapper.id = 'bk-root';
        container.append(wrapper);

        const root = createRoot(wrapper);

        function App() {
          const [toast, setToast] = useState<ClassifyToastPayload | null>(currentToast);

          // Expose rerender so external listeners can trigger updates
          useEffect(() => {
            rerender = () => setToast(currentToast ? { ...currentToast } : null);
            return () => { rerender = null; };
          }, []);

          const handleDismiss = useCallback(() => {
            currentToast = null;
            setToast(null);
          }, []);

          if (!toast) return null;

          return <ClassifyToast initial={toast} onDismiss={handleDismiss} />;
        }

        root.render(<App />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });

    ui.mount();

    // Listen for messages from background
    chrome.runtime.onMessage.addListener((message: any) => {
      if (message.type === 'SHOW_CLASSIFY_TOAST') {
        currentToast = message.payload as ClassifyToastPayload;
        rerender?.();
      }
      // CLASSIFY_RESULT and DISMISS_CLASSIFY are handled inside ClassifyToast component
    });
  },
});
