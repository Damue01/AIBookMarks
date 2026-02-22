import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, BookMarked, FolderOpen } from 'lucide-react';
import { useBookmarksStore } from '@/stores/bookmarks';
import { useOrganizeStore } from '@/stores/organize';
import { useSettingsStore } from '@/stores/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BackupService } from '@/services/backup';
import { formatDate, isUnclassified } from '@/shared/utils';
import type { PopupPage } from '../App';
import type { BookmarkFlat } from '@/shared/types';

interface HomePageProps {
  onNavigate: (page: PopupPage) => void;
  onStartPlan: (bookmarks: BookmarkFlat[], scope: 'all' | 'unclassified') => void;
}

export default function HomePage({ onNavigate, onStartPlan }: HomePageProps) {
  const { t } = useTranslation();
  const { stats, flat, folders, loading } = useBookmarksStore();
  const { settings } = useSettingsStore();
  const { progress } = useOrganizeStore();
  const [lastBackupTime, setLastBackupTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    BackupService.list().then((list) => {
      if (list.length > 0) setLastBackupTime(list[0].timestamp);
    });
  }, []);

  const handleStartAnalysis = (scope: 'all' | 'unclassified') => {
    const bookmarks =
      scope === 'unclassified'
        ? flat.filter((b) => isUnclassified(b))
        : flat;

    // Go to category plan page first (user confirms categories before analysis)
    onStartPlan(bookmarks, scope);
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const analyzing = progress.phase === 'analyzing' || progress.phase === 'scanning';
  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{t('app.name')}</span>
        </div>
        <button
          onClick={openSettings}
          className="p-1 rounded hover:bg-accent transition-colors"
          title={t('app.settings')}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground mb-2">{t('overview.title')}</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t('overview.total'), value: stats.total },
            { label: t('overview.folders'), value: stats.folders },
            { label: t('overview.unclassified'), value: stats.unclassified },
          ].map(({ label, value }) => (
            <Card key={label} className="text-center">
              <CardContent className="p-2">
                <div className="text-lg font-bold text-primary">{loading ? '…' : value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analyze Progress */}
      {analyzing && (
        <div className="px-4 py-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('organize.analyzing')}</span>
            <span>{t('organize.batch', { current: progress.currentBatch, total: progress.totalBatches })}</span>
          </div>
          <Progress value={pct} />
          <div className="text-xs text-muted-foreground text-right">
            {t('organize.processed', { count: progress.processed })} / {progress.total}
          </div>

          {/* Live scrolling list of current batch */}
          {progress.currentItems.length > 0 && (
            <div className="mt-1 max-h-28 overflow-y-auto rounded border bg-muted/30 px-2 py-1 space-y-0.5 scroll-smooth">
              {progress.currentItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px] leading-tight animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="truncate font-medium text-foreground" title={item.title}>{item.title}</span>
                  <span className="truncate text-muted-foreground ml-auto text-[10px]" title={item.url}>
                    {(() => { try { return new URL(item.url).hostname; } catch { return item.url; } })()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Primary Actions */}
      <div className="px-4 py-2 space-y-2">
        <Button
          className="w-full"
          onClick={() => handleStartAnalysis('all')}
          disabled={analyzing || loading}
        >
          <FolderOpen className="h-4 w-4" />
          {t('organize.startAll')}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleStartAnalysis('unclassified')}
          disabled={analyzing || loading || stats.unclassified === 0}
        >
          {t('organize.startUnclassified')} ({stats.unclassified})
        </Button>
      </div>

      {/* Error */}
      {progress.phase === 'error' && (
        <div className="mx-4 mb-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
          {progress.error}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 py-2 border-t flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {lastBackupTime
            ? `${t('overview.lastBackup')}: ${formatDate(lastBackupTime)}`
            : t('overview.never')}
        </span>
      </div>
    </div>
  );
}
