import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/popup/App';
import '@/assets/globals.css';
import { initI18n } from '@/services/i18n';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/shared/constants';

// Initialize i18n synchronously with default language before React renders.
// Language will be updated once settings load.
chrome.storage.local.get(STORAGE_KEYS.SETTINGS).then((result) => {
  const lang = result[STORAGE_KEYS.SETTINGS]?.language ?? DEFAULT_SETTINGS.language;
  initI18n(lang);
}).catch(() => {
  initI18n(DEFAULT_SETTINGS.language);
});
initI18n(DEFAULT_SETTINGS.language); // immediate sync init with default

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
