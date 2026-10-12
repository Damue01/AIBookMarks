import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, Compass, Wand2, Settings } from 'lucide-react';
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
      <div className="popup-shell flex items-center justify-center">
        <span className="text-muted-foreground text-sm">{t('common.loading')}</span>
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
    <div className="popup-shell flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top Header */}
      <header className="flex shrink-0 h-14 items-center justify-between px-[18px] bg-background">
        <div className="flex items-center gap-2.5">
          <Bookmark className="h-5 w-5 text-primary" strokeWidth={2} />
          <span className="font-semibold text-base tracking-tight">{t('app.name')}</span>
        </div>
        <button
          onClick={openSettings}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          title={t('app.settings')}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
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
      </main>

      {/* Bottom Tab Bar */}
      <nav aria-label={t('app.navigation')} className="flex shrink-0 items-center justify-center gap-20 border-t h-14 bg-background">
        <button
          onClick={() => handleTabChange('browse')}
          aria-current={activeTab === 'browse' ? 'page' : undefined}
          className={`relative flex flex-col items-center gap-0.5 py-2 px-5 transition-colors after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full ${
            activeTab === 'browse'
              ? 'text-primary after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Compass className="w-[18px] h-[18px]" />
          <span className="text-[11px] font-medium">{t('tabs.browse')}</span>
        </button>
        <button
          onClick={() => handleTabChange('organize')}
          aria-current={activeTab === 'organize' ? 'page' : undefined}
          className={`relative flex flex-col items-center gap-0.5 py-2 px-5 transition-colors after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full ${
            activeTab === 'organize'
              ? 'text-primary after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wand2 className="w-[18px] h-[18px]" />
          <span className="text-[11px] font-medium">{t('tabs.organize')}</span>
          {analyzing && (
            <span className="absolute top-1.5 right-[calc(50%-16px)] w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      </nav>
    </div>
  );
}
