import './browser-demo';
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/popup/App';
import { initI18n } from '@/services/i18n';
import '@/assets/globals.css';
import './preview.css';

initI18n('zh');
const options = new URLSearchParams(location.search).has('options');
const OptionsApp = lazy(() => import('@/options/App'));
document.body.classList.toggle('options-preview', options);
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Suspense fallback={<p className="p-6 text-sm text-muted-foreground">加载中…</p>}>
    {options ? <OptionsApp /> : <App />}
  </Suspense></React.StrictMode>,
);
document.getElementById('reset-demo')!.addEventListener('click', () => {
  localStorage.removeItem('aibm-demo-tree');
  localStorage.removeItem('aibm-demo-storage');
  location.href = '/';
});
