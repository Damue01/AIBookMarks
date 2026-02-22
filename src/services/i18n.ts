import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from '@/locales/zh';
import en from '@/locales/en';

export function initI18n(language: 'zh' | 'en' = 'zh') {
  if (i18n.isInitialized) {
    i18n.changeLanguage(language);
    return i18n;
  }

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        zh: { translation: zh },
        en: { translation: en },
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      initImmediate: false, // ensure synchronous initialization
    });

  return i18n;
}

/**
 * Lightweight translation getter for background service worker.
 * Supports dot-separated keys, e.g. `getI18n('zh')('classify.analyzing')`.
 */
const locales: Record<string, Record<string, unknown>> = { zh, en };

export function getI18n(lang: string): (key: string) => string {
  const dict = locales[lang] ?? locales['en'];
  return (key: string) => {
    const parts = key.split('.');
    let cur: unknown = dict;
    for (const p of parts) {
      if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[p];
      else return key;
    }
    return typeof cur === 'string' ? cur : key;
  };
}

export default i18n;
