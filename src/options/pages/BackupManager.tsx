import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackupService } from '@/services/backup';
import type { BackupEntry, BookmarkNode } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Archive, RotateCcw, Trash2, Download, Upload, Loader2 } from 'lucide-react';
import { formatDate } from '@/shared/utils';

export default function BackupManagerPage() {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  const loadBackups = async () => {
    setLoading(true);
    setBackups(await BackupService.list());
    setLoading(false);
  };

  useEffect(() => { loadBackups(); }, []);

  const handleCreateManual = async () => {
    // Always fetch fresh tree directly from Chrome API
    const tree = await chrome.bookmarks.getTree() as BookmarkNode[];
    await BackupService.create(tree, 'manual');
    await loadBackups();
  };

  const handleRestore = async (entry: BackupEntry) => {
    if (!confirm(t('backup.restoreConfirm'))) return;
    setRestoring(true);
    try {
      // 1. Backup current state first
      const currentTree = await chrome.bookmarks.getTree() as BookmarkNode[];
      await BackupService.create(currentTree, 'auto', t('backup.preRestoreLabel'));

      // 2. Remove all existing bookmarks (except root nodes)
      const roots = await chrome.bookmarks.getTree();
      for (const root of roots) {
        if (root.children) {
          for (const topFolder of root.children) {
            // topFolder is "Bookmarks Bar", "Other Bookmarks", etc.
            if (topFolder.children) {
              // Remove all children of each top-level folder
              for (const child of [...topFolder.children].reverse()) {
                try {
                  await chrome.bookmarks.removeTree(child.id);
                } catch {
                  // ignore errors for individual items
                }
              }
            }
          }
        }
      }

      // 3. Recreate from snapshot
      const snapshot = entry.snapshot;
      for (const root of snapshot) {
        if (root.children) {
          for (const topFolder of root.children) {
            if (topFolder.children) {
              await restoreChildren(topFolder.children, topFolder.id);
            }
          }
        }
      }

      alert(t('backup.restoreSuccess'));
    } catch (e) {
      alert(t('backup.restoreFailed') + ': ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setRestoring(false);
      await loadBackups();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('backup.deleteConfirm'))) return;
    await BackupService.delete(id);
    await loadBackups();
  };

  const handleExport = (entry: BackupEntry) => {
    const json = BackupService.exportAsJSON(entry);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-backup-${formatDate(entry.timestamp).replace(/[\s:/]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const snapshot = BackupService.importFromJSON(text);
        await BackupService.create(snapshot, 'manual', `Imported: ${file.name}`);
        await loadBackups();
      } catch {
        alert('Invalid backup file');
      }
    };
    input.click();
  };

  const triggerLabel = (trigger: BackupEntry['trigger']) =>
    t(`backup.triggers.${trigger}` as Parameters<typeof t>[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('backup.title')}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4" /> {t('common.import')}
          </Button>
          <Button size="sm" onClick={handleCreateManual}>
            <Archive className="h-4 w-4" /> {t('backup.createManual')}
          </Button>
        </div>
      </div>

      {restoring && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('backup.restoring')}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : backups.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('backup.noBackups')}</p>
      ) : (
        <div className="space-y-2">
          {backups.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="py-3 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{formatDate(entry.timestamp)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('backup.count', { bookmarks: entry.bookmarkCount, folders: entry.folderCount })}
                    {' · '}
                    <span className="capitalize">{triggerLabel(entry.trigger)}</span>
                    {entry.label && ` · ${entry.label}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleExport(entry)} title={t('common.export')}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRestore(entry)} title={t('backup.restore')} disabled={restoring}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(entry.id!)} title={t('common.delete')}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/** Recursively restore children into a parent folder */
async function restoreChildren(children: BookmarkNode[], parentId: string): Promise<void> {
  for (const child of children) {
    try {
      if (child.url) {
        // It's a bookmark
        await chrome.bookmarks.create({
          parentId,
          title: child.title,
          url: child.url,
        });
      } else {
        // It's a folder
        const created = await chrome.bookmarks.create({
          parentId,
          title: child.title,
        });
        if (child.children && child.children.length > 0) {
          await restoreChildren(child.children, created.id);
        }
      }
    } catch {
      // Continue with other items if one fails
    }
  }
}
