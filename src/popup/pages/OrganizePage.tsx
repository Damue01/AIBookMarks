import React from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Sparkles, BookMarked, FolderTree, AlertCircle, ExternalLink } from 'lucide-react';
import { useBookmarksStore } from '@/stores/bookmarks';
import { useOrganizeStore } from '@/stores/organize';
import { useSettingsStore } from '@/stores/settings';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BackupService } from '@/services/backup';
import { formatDate, isUnclassified, extractDomain } from '@/shared/utils';
import type { BookmarkFlat } from '@/shared/types';

interface OrganizePageProps {
  onStartPlan: (bookmarks: BookmarkFlat[], scope: 'all' | 'unclassified') => void;
}

export default function OrganizePage({ onStartPlan }: OrganizePageProps) {
  const { t } = useTranslation();
  const { stats, flat, loading } = useBookmarksStore();
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
    onStartPlan(bookmarks, scope);
  };

  const analyzing = progress.phase === 'analyzing' || progress.phase === 'scanning';
  const pct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  // Get unclassified bookmarks for preview (most recent first)
  const unclassifiedList = React.useMemo(() => {
    return flat
      .filter((b) => isUnclassified(b))
      .sort((a, b) => {
        // Use id as a rough proxy for creation order (higher id = newer)
        return Number(b.id) - Number(a.id);
      });
  }, [flat]);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">{t('organize.title')}</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('organize.description')}
        </p>
      </div>

      {/* Stats Row */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          {[
            { icon: BookMarked, label: t('overview.total'), value: stats.total, color: 'text-blue-500' },
            { icon: FolderTree, label: t('overview.folders'), value: stats.folders, color: 'text-emerald-500' },
            { icon: AlertCircle, label: t('overview.unclassified'), value: stats.unclassified, color: 'text-amber-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/50"
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <div>
                <div className="text-sm font-bold">{loading ? '…' : value}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            </div>
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
          className="w-full gap-2"
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

      {/* Unclassified Preview */}
      {!analyzing && unclassifiedList.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              {t('organize.unclassifiedPreview')}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {unclassifiedList.length > 6 ? `+${unclassifiedList.length - 6} ${t('organize.more')}` : ''}
            </span>
          </div>
          <div className="rounded-lg border bg-muted/20 divide-y divide-border/50 max-h-[140px] overflow-y-auto">
            {unclassifiedList.slice(0, 6).map((bm) => {
              const domain = extractDomain(bm.url);
              return (
                <div key={bm.id} className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/40 transition-colors group">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                    alt=""
                    className="w-4 h-4 rounded-sm shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium truncate leading-tight" title={bm.title}>
                      {bm.title || domain}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate" title={bm.url}>
                      {domain}
                    </div>
                  </div>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-accent"
                    title={bm.url}
                  >
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {progress.phase === 'error' && (
        <div className="mx-4 mb-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
          {progress.error}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 py-2 border-t flex justify-between items-center">
        <span className="text-[11px] text-muted-foreground">
          {lastBackupTime
            ? `${t('overview.lastBackup')}: ${formatDate(lastBackupTime)}`
            : t('overview.never')}
        </span>
      </div>
    </div>
  );
}
