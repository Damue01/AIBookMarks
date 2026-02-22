import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCheck, XCircle, Play } from 'lucide-react';
import { useOrganizeStore } from '@/stores/organize';
import { useSettingsStore } from '@/stores/settings';
import { BackupService } from '@/services/backup';
import { useBookmarksStore } from '@/stores/bookmarks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BookmarkSuggestionItem from '../components/BookmarkSuggestionItem';
import FilterBar from '../components/FilterBar';
import type { PopupPage } from '../App';
import type { BookmarkSuggestion } from '@/shared/types';

interface PreviewPageProps {
  onNavigate: (page: PopupPage) => void;
}

export default function PreviewPage({ onNavigate }: PreviewPageProps) {
  const { t } = useTranslation();
  const {
    suggestions,
    getFiltered,
    filter,
    searchQuery,
    setFilter,
    setSearchQuery,
    acceptAll,
    rejectAll,
    setSuggestionStatus,
    setSuggestionFolder,
    progress,
  } = useOrganizeStore();
  const { settings } = useSettingsStore();
  const { tree, refresh } = useBookmarksStore();
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);
  const [execResult, setExecResult] = useState<{ succeeded: number; failed: number; errors: string[]; merged?: number; cleaned?: number } | null>(null);

  const filtered = getFiltered();
  const accepted = suggestions.filter((s) => s.status === 'accepted' || s.status === 'modified');

  const handleExecute = async () => {
    if (accepted.length === 0) return;
    if (!confirm(t('organize.confirmExecute', { count: accepted.length }))) return;

    setExecuting(true);

    // Auto backup before executing
    if (settings.backup.autoBackup && tree.length > 0) {
      await BackupService.create(tree, 'pre-organize');
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_ORGANIZE',
        payload: suggestions,
      });
      if (response?.success) {
        setExecResult(response.data);
        setDone(true);
        await refresh();
      }
    } catch (e) {
      setExecResult({ succeeded: 0, failed: accepted.length, errors: [String(e)] });
    } finally {
      setExecuting(false);
    }
  };

  if (done && execResult) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('home')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">{t('organize.done')}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <CheckCheck className="h-12 w-12 text-green-500" />
          <div>
            <p className="font-medium">{t('organize.done')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              ✅ {execResult.succeeded} | ❌ {execResult.failed}
            </p>
            {(execResult.merged != null && execResult.merged > 0 || execResult.cleaned != null && execResult.cleaned > 0) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {execResult.merged ? `🔀 ${t('organize.merged') || '合并重复文件夹'}: ${execResult.merged}` : ''}
                {execResult.merged && execResult.cleaned ? ' | ' : ''}
                {execResult.cleaned ? `🧹 ${t('organize.cleaned') || '清理空文件夹'}: ${execResult.cleaned}` : ''}
              </p>
            )}
          </div>
          {execResult.errors.length > 0 && (
            <div className="w-full text-left max-h-24 overflow-y-auto text-xs text-destructive bg-destructive/10 rounded p-2">
              {execResult.errors.join('\n')}
            </div>
          )}
          <Button onClick={() => onNavigate('home')}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('home')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm flex-1">{t('organize.previewTitle')}</span>
        <span className="text-xs text-muted-foreground">
          {t('organize.acceptedCount', { count: accepted.length })}/{suggestions.length}
        </span>
      </div>

      {/* Analysis still running banner */}
      {progress.phase === 'analyzing' && (
        <div className="px-3 py-1 bg-primary/10 text-primary text-xs text-center">
          {t('organize.analyzing')} — {progress.processed}/{progress.total}
        </div>
      )}

      {/* Toolbar */}
      <div className="px-3 py-2 space-y-2 border-b shrink-0">
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-xs"
        />
        <FilterBar current={filter} onChange={setFilter} suggestions={suggestions} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={acceptAll}>
            <CheckCheck className="h-3 w-3" />
            {t('common.selectAll')}
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-6 px-2" onClick={rejectAll}>
            <XCircle className="h-3 w-3" />
            {t('common.deselectAll')}
          </Button>
        </div>
      </div>

      {/* Suggestion List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {t('organization.noSuggestions') || t('common.noResults')}
          </div>
        ) : (
          filtered.map((s: BookmarkSuggestion) => (
            <BookmarkSuggestionItem
              key={s.bookmarkId}
              suggestion={s}
              onAccept={() => setSuggestionStatus(s.bookmarkId, 'accepted')}
              onReject={() => setSuggestionStatus(s.bookmarkId, 'rejected')}
              onModify={(path) => setSuggestionFolder(s.bookmarkId, path)}
            />
          ))
        )}
      </div>

      {/* Footer Execute */}
      <div className="px-3 py-2 border-t shrink-0">
        <Button
          className="w-full"
          onClick={handleExecute}
          disabled={accepted.length === 0 || executing}
          loading={executing}
        >
          <Play className="h-3.5 w-3.5" />
          {t('organize.executeOrganize')} ({accepted.length})
        </Button>
      </div>
    </div>
  );
}
