import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import {
  FolderInput,
  X,
  Search,
  Folder,
  FolderOpen,
} from 'lucide-react';
import type { BookmarkNode } from '@/shared/types';

interface FlatFolder {
  id: string;
  title: string;
  path: string;
  level: number;
}

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The raw Chrome bookmark tree */
  tree: BookmarkNode[];
  /** Current parent folder ID (to grey out / mark) */
  currentFolderId?: string;
  onMove: (targetFolderId: string) => void;
}

/**
 * Build a clean flat list of folders from the Chrome bookmark tree.
 * Each entry appears exactly once, with an indent level and full path.
 * Skips Chrome's invisible root node (id "0").
 */
function buildFolderList(
  nodes: BookmarkNode[],
  level = 0,
  parentPath = '',
): FlatFolder[] {
  const result: FlatFolder[] = [];
  for (const node of nodes) {
    // Skip bookmark URLs — only process folders
    if (node.url) continue;

    const path = parentPath ? `${parentPath}/${node.title}` : node.title;

    // Chrome root node (id "0") is invisible — don't show it but recurse into it
    if (node.id !== '0') {
      result.push({ id: node.id, title: node.title, path, level });
    }

    if (node.children) {
      result.push(
        ...buildFolderList(
          node.children,
          node.id === '0' ? 0 : level + 1,
          node.id === '0' ? '' : path,
        ),
      );
    }
  }
  return result;
}

export default function MoveToFolderDialog({
  open,
  onOpenChange,
  tree,
  currentFolderId,
  onMove,
}: MoveToFolderDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setSearch('');
      setSelectedId(null);
    }
  }, [open]);

  const flatFolders = useMemo(() => buildFolderList(tree), [tree]);

  const filtered = useMemo(() => {
    if (!search.trim()) return flatFolders;
    const q = search.toLowerCase();
    return flatFolders.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.path.toLowerCase().includes(q),
    );
  }, [flatFolders, search]);

  const handleConfirm = () => {
    if (selectedId) {
      onMove(selectedId);
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 sm:rounded-xl animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <FolderInput className="w-5 h-5 text-primary" />
            <Dialog.Title className="text-base font-semibold leading-none">
              {t('browse.moveToFolder')}
            </Dialog.Title>
            <Dialog.Close className="ml-auto rounded-sm opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {/* Search */}
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('browse.searchFolderPlaceholder')}
                className="flex h-8 w-full rounded-md border border-input bg-muted/40 pl-8 pr-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Folder list */}
          <div className="max-h-[240px] overflow-y-auto px-2 pb-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {t('common.noResults')}
              </p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((f) => {
                  const isCurrent = f.id === currentFolderId;
                  const isSelected = f.id === selectedId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => !isCurrent && setSelectedId(f.id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
                        isCurrent
                          ? 'opacity-40 cursor-not-allowed'
                          : isSelected
                            ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                            : 'hover:bg-accent'
                      }`}
                      style={{ paddingLeft: `${8 + f.level * 16}px` }}
                      disabled={isCurrent}
                    >
                      {isSelected ? (
                        <FolderOpen className="w-4 h-4 shrink-0 text-primary" />
                      ) : (
                        <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{f.title}</span>
                      {isCurrent && (
                        <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
                          {t('browse.currentFolder')}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t">
            <Dialog.Close asChild>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-8 px-3 transition-colors">
                {t('common.cancel')}
              </button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {t('browse.moveConfirm')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
