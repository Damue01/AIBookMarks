import React from 'react';
import ReactDOM from 'react-dom/client';
import OptionsApp from '@/options/App';
import '@/assets/globals.css';
import { initI18n } from '@/services/i18n';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/shared/constants';

initI18n(DEFAULT_SETTINGS.language);
chrome.storage.local.get(STORAGE_KEYS.SETTINGS).then((result) => {
  const lang = result[STORAGE_KEYS.SETTINGS]?.language ?? DEFAULT_SETTINGS.language;
  initI18n(lang);
}).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptionsApp />
  </React.StrictMode>,
);
