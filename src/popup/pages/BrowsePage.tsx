import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  ChevronRight,
  Home,
  ArrowLeft,
  Bookmark,
  FolderPlus,
  CheckSquare,
  Trash2,
  FolderInput,
  X,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import { useBookmarksStore } from '@/stores/bookmarks';
import { Input } from '@/components/ui/input';
import type { BookmarkNode, SortField } from '@/shared/types';
import { sortBookmarkNodes, applyPermanentSort } from '@/shared/sort-utils';
import FolderCard from '../components/FolderCard';
import BookmarkItem from '../components/BookmarkItem';
import SortDropdown from '../components/SortDropdown';
import CreateFolderDialog from '../components/CreateFolderDialog';
import MoveToFolderDialog from '../components/MoveToFolderDialog';

/** Root IDs for Chrome's built-in root folders */
const ROOT_IDS = new Set(['0']);

/** Find a node by ID in the tree */
function findNode(nodes: BookmarkNode[], id: string): BookmarkNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Build path from root to the target node */
function buildBreadcrumb(
  tree: BookmarkNode[],
  targetId: string,
): { id: string; title: string }[] {
  const path: { id: string; title: string }[] = [];
  function walk(nodes: BookmarkNode[], chain: { id: string; title: string }[]): boolean {
    for (const n of nodes) {
      const next = [...chain, { id: n.id, title: n.title }];
      if (n.id === targetId) {
        path.push(...next);
        return true;
      }
      if (n.children && walk(n.children, next)) return true;
    }
    return false;
  }
  walk(tree, []);
  return path;
}

/** Recursively collect all bookmark URLs under a folder (for search) */
function collectAllBookmarks(node: BookmarkNode): BookmarkNode[] {
  const result: BookmarkNode[] = [];
  if (node.url) {
    result.push(node);
  }
  if (node.children) {
    for (const c of node.children) {
      result.push(...collectAllBookmarks(c));
    }
  }
  return result;
}

const BROWSE_FOLDER_KEY = 'aibm_browse_folder';

export default function BrowsePage() {
  const { t } = useTranslation();
  const { tree, loading, error, fetchAll } = useBookmarksStore();

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [restored, setRestored] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField>('default');
  // Multi-select state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  // Move-to-folder dialog state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveBookmarkId, setMoveBookmarkId] = useState<string | null>(null);

  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'folder' | 'bookmark' | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Restore last visited folder on mount
  useEffect(() => {
    chrome.storage.local.get(BROWSE_FOLDER_KEY).then((result) => {
      const saved = result[BROWSE_FOLDER_KEY];
      if (saved && typeof saved === 'string') {
        setCurrentFolderId(saved);
      }
      setRestored(true);
    }).catch(() => setRestored(true));
  }, []);

  // Persist current folder whenever it changes
  useEffect(() => {
    if (!restored) return;
    if (currentFolderId) {
      chrome.storage.local.set({ [BROWSE_FOLDER_KEY]: currentFolderId });
    } else {
      chrome.storage.local.remove(BROWSE_FOLDER_KEY);
    }
  }, [currentFolderId, restored]);

  // Current node and its children
  const currentNode = useMemo(() => {
    if (!currentFolderId) return null;
    return findNode(tree, currentFolderId);
  }, [tree, currentFolderId]);

  // If the saved folder was deleted, fall back to root
  useEffect(() => {
    if (restored && currentFolderId && tree.length > 0 && !findNode(tree, currentFolderId)) {
      setCurrentFolderId(null);
    }
  }, [tree, currentFolderId, restored]);

  // Breadcrumb trail
  const breadcrumb = useMemo(() => {
    if (!currentFolderId) return [];
    return buildBreadcrumb(tree, currentFolderId).filter((b) => !ROOT_IDS.has(b.id));
  }, [tree, currentFolderId]);

  // Raw children (always reflects current Chrome order)
  const { rawFolders, rawBookmarks } = useMemo(() => {
    let children = currentNode?.children ?? [];
    if (!currentFolderId) {
      const rootNode = tree[0];
      children = rootNode?.children ?? [];
    }
    return {
      rawFolders: children.filter((n) => !n.url),
      rawBookmarks: children.filter((n) => !!n.url),
    };
  }, [tree, currentFolderId, currentNode]);

  // Derive the sorted view from live data so edits, moves and deletes remain visible.
  const childFolders = useMemo(() => sortBookmarkNodes(rawFolders, sortField), [rawFolders, sortField]);
  const childBookmarks = useMemo(() => sortBookmarkNodes(rawBookmarks, sortField), [rawBookmarks, sortField]);
  const handleSortChange = (val: SortField) => setSortField(val);

  // Flatten once per tree update instead of traversing the tree on every keystroke.
  const searchableBookmarks = useMemo(() => tree.flatMap(collectAllBookmarks), [tree]);
  const deferredQuery = useDeferredValue(searchQuery.trim().toLocaleLowerCase());
  const searchResults = useMemo(() => {
    if (!deferredQuery) return null;
    return searchableBookmarks.filter((b) =>
      b.title.toLocaleLowerCase().includes(deferredQuery) || b.url?.toLocaleLowerCase().includes(deferredQuery));
  }, [searchableBookmarks, deferredQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const navigateTo = (id: string | null) => {
    setCurrentFolderId(id);
    setSearchQuery('');
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const goBack = () => {
    if (currentNode?.parentId) {
      if (currentNode.parentId === '0') {
        setCurrentFolderId(null);
      } else {
        setCurrentFolderId(currentNode.parentId);
      }
    } else {
      setCurrentFolderId(null);
    }
    setSearchQuery('');
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  const handleApplyPermanentSort = async () => {
    if (!currentFolderId || sortField === 'default') return;
    const children = currentNode?.children ?? [];
    await applyPermanentSort(children, currentFolderId, sortField);
    setSortField('default');
  };

  const handleCreateFolder = async (name: string) => {
    if (!currentFolderId) return;
    await chrome.bookmarks.create({ parentId: currentFolderId, title: name });
  };

  const handleRenameFolder = async (id: string, newTitle: string) => {
    await chrome.bookmarks.update(id, { title: newTitle });
  };

  const handleUpdateBookmark = async (id: string, title: string, url: string) => {
    await chrome.bookmarks.update(id, { title, url });
  };

  const handleDeleteNode = async (id: string) => {
    await chrome.bookmarks.removeTree(id);
  };

  // ── Move to folder handlers ───────────────────────────────────────────────

  const handleMoveRequest = (bookmarkId: string) => {
    setMoveBookmarkId(bookmarkId);
    setMoveDialogOpen(true);
  };

  const handleMoveConfirm = async (targetFolderId: string) => {
    if (moveBookmarkId) {
      await chrome.bookmarks.move(moveBookmarkId, { parentId: targetFolderId });
      setMoveBookmarkId(null);
    }
  };

  // ── Multi-select Handlers ─────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(t('browse.batchDeleteConfirm', { count: selectedIds.size }))) {
      for (const id of selectedIds) {
        await chrome.bookmarks.removeTree(id).catch(() => {});
      }
      setSelectedIds(new Set());
      setIsSelecting(false);
    }
  };

  // ── DnD Handlers ──────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveType(active.data.current?.type as 'folder' | 'bookmark');
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over && over.data.current?.type === 'folder' && over.id !== activeId) {
      setDropTargetId(over.id as string);
    } else {
      setDropTargetId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    setDropTargetId(null);

    if (!over || !currentFolderId) return;

    // Case 1: Dropped onto a folder (move inside)
    if (over.data.current?.type === 'folder' && over.id !== active.id) {
      await chrome.bookmarks.move(active.id as string, { parentId: over.id as string });
      return;
    }

    // Case 2: Reordering within the same list
    if (active.id !== over.id) {
      const isFolder = active.data.current?.type === 'folder';
      const items = isFolder ? childFolders : childBookmarks;
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Calculate the actual Chrome index
        // Folders come first, then bookmarks
        const baseIndex = isFolder ? 0 : childFolders.length;
        const targetChromeIndex = baseIndex + newIndex;
        await chrome.bookmarks.move(active.id as string, {
          parentId: currentFolderId,
          index: targetChromeIndex,
        });
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (error) {
    return <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 text-sm">
      <p>{t('browse.loadError')}</p>
      <button className="rounded-md border px-3 py-1.5 text-primary" onClick={() => fetchAll()}>{t('browse.retry')}</button>
    </div>;
  }
  if (loading && tree.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  const activeNode = activeId ? findNode(tree, activeId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar: Search & Actions */}
      <div className="px-[18px] pt-0 pb-3 flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t('browse.searchPlaceholder')}
            placeholder={t('browse.searchPlaceholder')}
            className="pl-8 pr-8 h-9 text-[13px] bg-muted/50 border-transparent shadow-none focus-visible:bg-background"
          />
          {searchQuery && <button title={t('browse.clearSearch')} aria-label={t('browse.clearSearch')}
            onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:bg-accent"><X className="h-3.5 w-3.5" /></button>}
        </div>
        {!searchResults && currentFolderId && (
          <>
            <SortDropdown
              value={sortField}
              onChange={handleSortChange}
              onApplyPermanent={handleApplyPermanentSort}
            />
            <button
              onClick={() => setCreateFolderOpen(true)}
              className="p-2 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground transition-colors"
              title={t('browse.newFolder')}
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsSelecting(!isSelecting);
                setSelectedIds(new Set());
              }}
              className={`p-2 rounded-md border transition-colors ${
                isSelecting
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/50 bg-muted/30 hover:bg-accent text-muted-foreground'
              }`}
              title={t('browse.selectMode')}
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Batch Actions Toolbar */}
      {isSelecting && (
        <div className="px-3 py-2 mx-3 mb-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary">
            {t('browse.selected', { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDelete}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('browse.batchDelete')}
            </button>
            <button
              onClick={() => setIsSelecting(false)}
              className="px-2.5 py-1.5 rounded text-xs font-medium bg-background border hover:bg-accent transition-colors"
            >
              {t('browse.exitSelect')}
            </button>
          </div>
        </div>
      )}

      {/* Search Results Mode */}
      {searchResults ? (
        <div className="flex-1 overflow-y-auto px-1">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {searchResults.length > 0
              ? t('browse.searchResults', { count: searchResults.length })
              : t('common.noResults')}
          </div>
          <div className="divide-y divide-border/60">
            {searchResults.map((b) => (
              <BookmarkItem
                key={b.id}
                id={b.id}
                title={b.title}
                url={b.url!}
                dateAdded={b.dateAdded}
                onDelete={handleDeleteNode} onUpdate={handleUpdateBookmark} onMove={handleMoveRequest}
                dragDisabled
              />
            ))}
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Breadcrumb Navigation */}
          <div className="px-[18px] pb-3">
            <div className="flex items-center gap-1 text-xs overflow-x-auto no-scrollbar">
              {currentFolderId && (
                <button
                  onClick={goBack}
                  className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => navigateTo(null)}
                className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-accent transition-colors ${!currentFolderId ? 'text-primary font-medium' : 'text-muted-foreground'}`}
              >
                <Home className="w-3 h-3" />
                <span>{t('browse.root')}</span>
              </button>
              {breadcrumb.map((b, i) => (
                <React.Fragment key={b.id}>
                  <ChevronRight className="shrink-0 w-3 h-3 text-muted-foreground/50" />
                  <button
                    onClick={() => navigateTo(b.id)}
                    className={`shrink-0 px-1.5 py-0.5 rounded hover:bg-accent transition-colors truncate max-w-[120px] ${
                      i === breadcrumb.length - 1
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {b.title}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3">
            {/* Folders Grid */}
            {childFolders.length > 0 && (
              <div className="px-0.5 pt-1 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-foreground">
                    {t('browse.folders')}
                  </div>

                </div>
                <SortableContext items={childFolders.map(f => f.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 gap-2">
                    {childFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        node={folder}
                        onClick={(n) => navigateTo(n.id)}
                        isDropTarget={dropTargetId === folder.id}
                        onRename={handleRenameFolder}
                        onDelete={handleDeleteNode}
                        dragDisabled={sortField !== 'default' || isSelecting || !currentFolderId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}

            {/* Bookmarks List */}
            {childBookmarks.length > 0 && (
              <div className="px-0.5 pt-1">
                <div className="text-xs font-semibold text-foreground mb-1">
                  {t('browse.bookmarks')}
                </div>
                <SortableContext items={childBookmarks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="divide-y divide-border/60">
                    {childBookmarks.map((b) => (
                      <BookmarkItem
                        key={b.id}
                        id={b.id}
                        title={b.title}
                        url={b.url!}
                        dateAdded={b.dateAdded}
                        isSelecting={isSelecting}
                        isSelected={selectedIds.has(b.id)}
                        onSelect={toggleSelect}
                        onDelete={handleDeleteNode}
                        onUpdate={handleUpdateBookmark}
                        onMove={handleMoveRequest}
                        dragDisabled={sortField !== 'default' || !currentFolderId}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}

            {/* Empty State */}
            {childFolders.length === 0 && childBookmarks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bookmark className="w-10 h-10 mb-2 opacity-30" />
                <span className="text-sm">{t('browse.emptyFolder')}</span>
              </div>
            )}
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeId && activeNode ? (
              activeType === 'folder' ? (
                <div className="w-[200px] opacity-90">
                  <FolderCard node={activeNode} onClick={() => {}} isOverlay />
                </div>
              ) : (
                <div className="w-[300px] opacity-90 bg-background rounded-lg shadow-xl border border-border">
                  <BookmarkItem
                    id={activeNode.id}
                    title={activeNode.title}
                    url={activeNode.url!}
                    isOverlay
                  />
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={handleCreateFolder}
      />

      <MoveToFolderDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        tree={tree}
        currentFolderId={currentFolderId ?? undefined}
        onMove={handleMoveConfirm}
      />
    </div>
  );
}
