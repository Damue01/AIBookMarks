import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Wand2, Settings } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings';
import { initI18n } from '@/services/i18n';
import { useBookmarksStore } from '@/stores/bookmarks';
import BrowsePage from './pages/BrowsePage';
import OrganizePage from './pages/OrganizePage';
import PreviewPage from './pages/PreviewPage';
import CategoryPlanPage from './pages/CategoryPlanPage';
import { useOrganizeStore } from '@/stores/organize';
import type { BookmarkFlat } from '@/shared/types';

export type PopupTab = 'browse' | 'organize';
export type OrganizeSubPage = 'main' | 'category-plan' | 'preview';

// Backward-compatible type for sub-pages that still call onNavigate('home')
export type PopupPage = 'home' | 'category-plan' | 'preview';

interface PlanContext {
  bookmarks: BookmarkFlat[];
  scope: 'all' | 'unclassified';
}

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PopupTab>('browse');
  const [organizeSubPage, setOrganizeSubPage] = useState<OrganizeSubPage>('main');
  const [planContext, setPlanContext] = useState<PlanContext | null>(null);
  const { settings, loaded, load } = useSettingsStore();
  const fetchAll = useBookmarksStore((s) => s.fetchAll);
  const folders = useBookmarksStore((s) => s.folders);
  const stats = useBookmarksStore((s) => s.stats);
  const resetOrganize = useOrganizeStore((s) => s.reset);
  const syncFromBackground = useOrganizeStore((s) => s.syncFromBackground);
  const startAnalysis = useOrganizeStore((s) => s.startAnalysis);
  const progress = useOrganizeStore((s) => s.progress);

  useEffect(() => {
    load().then(() => fetchAll());
  }, [load, fetchAll]);

  // On mount, sync background analysis state (in case it's still running)
  useEffect(() => {
    syncFromBackground();
  }, [syncFromBackground]);

  // Auto-navigate to preview if analysis finished or is running
  useEffect(() => {
    if (progress.phase === 'done' || progress.phase === 'analyzing' || progress.phase === 'scanning') {
      if (organizeSubPage === 'main' && (progress.phase === 'done' || progress.processed > 0)) {
        setActiveTab('organize');
        setOrganizeSubPage('preview');
      }
    }
  }, [progress.phase, progress.processed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (loaded) {
      initI18n(settings.language);
    }
  }, [settings.language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) {
    return (
      <div className="w-[560px] h-[500px] flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  const navigateOrganize = (sub: OrganizeSubPage) => {
    if (sub === 'main') {
      resetOrganize();
      setPlanContext(null);
    }
    setOrganizeSubPage(sub);
  };

  /** Called from OrganizePage — go to category plan first */
  const handleStartPlan = (bookmarks: BookmarkFlat[], scope: 'all' | 'unclassified') => {
    setPlanContext({ bookmarks, scope });
    setOrganizeSubPage('category-plan');
  };

  /** Called from CategoryPlanPage — user confirmed categories, start analysis */
  const handleConfirmCategories = async (categories: string[]) => {
    if (!planContext) return;
    setOrganizeSubPage('preview');
    await startAnalysis(planContext.bookmarks, folders, {
      scope: planContext.scope,
      batchSize: settings.organize.batchSize,
      confirmedCategories: categories,
    });
  };

  const handleTabChange = (tab: PopupTab) => {
    setActiveTab(tab);
    if (tab === 'organize' && organizeSubPage !== 'preview') {
      // Reset to main when switching tabs, unless we're previewing results
      if (progress.phase !== 'analyzing' && progress.phase !== 'scanning' && progress.phase !== 'done') {
        setOrganizeSubPage('main');
      }
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const analyzing = progress.phase === 'analyzing' || progress.phase === 'scanning';

  return (
    <div className="w-[560px] h-[520px] flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
        <span className="font-semibold text-sm tracking-tight">{t('app.name')}</span>
        <button
          onClick={openSettings}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          title={t('app.settings')}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'browse' && <BrowsePage />}
        {activeTab === 'organize' && organizeSubPage === 'main' && (
          <OrganizePage onStartPlan={handleStartPlan} />
        )}
        {activeTab === 'organize' && organizeSubPage === 'category-plan' && planContext && (
          <CategoryPlanPage
            bookmarks={planContext.bookmarks}
            folders={folders}
            scope={planContext.scope}
            onNavigate={(p) => navigateOrganize(p === 'home' ? 'main' : p as OrganizeSubPage)}
            onConfirm={handleConfirmCategories}
          />
        )}
        {activeTab === 'organize' && organizeSubPage === 'preview' && (
          <PreviewPage onNavigate={(p) => navigateOrganize(p === 'home' ? 'main' : p as OrganizeSubPage)} />
        )}
      </div>

      {/* Bottom Tab Bar */}
      <div className="flex items-center border-t bg-background/80 backdrop-blur-sm">
        <button
          onClick={() => handleTabChange('browse')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
            activeTab === 'browse'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Compass className="w-4.5 h-4.5" />
          <span className="text-[11px] font-medium">{t('tabs.browse')}</span>
        </button>
        <button
          onClick={() => handleTabChange('organize')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors relative ${
            activeTab === 'organize'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wand2 className="w-4.5 h-4.5" />
          <span className="text-[11px] font-medium">{t('tabs.organize')}</span>
          {analyzing && (
            <span className="absolute top-1.5 right-[calc(50%-16px)] w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
          {!analyzing && stats.unclassified > 0 && (
            <span className="absolute top-1 right-[calc(50%-20px)] min-w-[16px] h-[14px] flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold px-1 leading-none">
              {stats.unclassified > 99 ? '99+' : stats.unclassified}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
