import React, { useEffect } from 'react';
import { useSettingsStore } from '@/stores/settings';
import { initI18n } from '@/services/i18n';
import { useTranslation } from 'react-i18next';
import { BookMarked, Bot, ListFilter, Archive, Sliders } from 'lucide-react';
import AIConfigPage from './pages/AIConfig';
import RulesManagerPage from './pages/RulesManager';
import BackupManagerPage from './pages/BackupManager';
import GeneralSettingsPage from './pages/GeneralSettings';
import { cn } from '@/shared/utils';

type Tab = 'general' | 'ai' | 'rules' | 'backup';

export default function OptionsApp() {
  const { settings, loaded, load } = useSettingsStore();
  const [tab, setTab] = React.useState<Tab>('ai');
  const { t } = useTranslation();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loaded) initI18n(settings.language);
  }, [settings.language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'general', label: t('settings.general.title'), icon: <Sliders className="h-4 w-4" /> },
    { key: 'ai', label: t('settings.ai.title'), icon: <Bot className="h-4 w-4" /> },
    { key: 'rules', label: t('rules.title'), icon: <ListFilter className="h-4 w-4" /> },
    { key: 'backup', label: t('backup.title'), icon: <Archive className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <BookMarked className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">{t('app.name')} — {t('settings.title')}</h1>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-56 border-r min-h-[calc(100vh-65px)] p-3 space-y-1 shrink-0">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors',
                tab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-6 max-w-4xl min-w-0">
          {tab === 'general' && <GeneralSettingsPage />}
          {tab === 'ai' && <AIConfigPage />}
          {tab === 'rules' && <RulesManagerPage />}
          {tab === 'backup' && <BackupManagerPage />}
        </main>
      </div>
    </div>
  );
}
