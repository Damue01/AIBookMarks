import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Folder, ChevronRight, GripVertical, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BookmarkNode } from '@/shared/types';

export interface FolderCardProps {
  node: BookmarkNode;
  onClick: (node: BookmarkNode) => void;
  /** Highlight this card as a drop target */
  isDropTarget?: boolean;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  /** Set to true when rendering as DragOverlay */
  isOverlay?: boolean;
}

/** Count bookmarks (urls) directly + recursively inside a folder node */
function countInside(node: BookmarkNode): { bookmarks: number; folders: number } {
  let bookmarks = 0;
  let folders = 0;
  if (node.children) {
    for (const c of node.children) {
      if (c.url) {
        bookmarks++;
      } else {
        folders++;
        const inner = countInside(c);
        bookmarks += inner.bookmarks;
        folders += inner.folders;
      }
    }
  }
  return { bookmarks, folders };
}

// Pastel colour palette for folder cards
const COLORS = [
  'from-blue-50 to-blue-100/60 border-blue-200/60 text-blue-700',
  'from-violet-50 to-violet-100/60 border-violet-200/60 text-violet-700',
  'from-emerald-50 to-emerald-100/60 border-emerald-200/60 text-emerald-700',
  'from-amber-50 to-amber-100/60 border-amber-200/60 text-amber-700',
  'from-rose-50 to-rose-100/60 border-rose-200/60 text-rose-700',
  'from-cyan-50 to-cyan-100/60 border-cyan-200/60 text-cyan-700',
  'from-orange-50 to-orange-100/60 border-orange-200/60 text-orange-700',
  'from-indigo-50 to-indigo-100/60 border-indigo-200/60 text-indigo-700',
];

const ICON_COLORS = [
  'text-blue-500',
  'text-violet-500',
  'text-emerald-500',
  'text-amber-500',
  'text-rose-500',
  'text-cyan-500',
  'text-orange-500',
  'text-indigo-500',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export default function FolderCard({
  node,
  onClick,
  isDropTarget = false,
  onRename,
  onDelete,
  isOverlay = false,
}: FolderCardProps) {
  const { t } = useTranslation();
  const { bookmarks, folders } = countInside(node);
  const idx = Math.abs(hashString(node.id)) % COLORS.length;
  const colorClass = COLORS[idx];
  const iconColor = ICON_COLORS[idx];

  // ── Inline rename ──────────────────────────────────────────────────────────
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(node.title);
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [isRenaming, node.title]);

  const commitRename = () => {
    const newTitle = renameValue.trim();
    if (newTitle && newTitle !== node.title) {
      onRename?.(node.id, newTitle);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => setIsRenaming(false);

  // ── Context menu ──────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isRenaming) return;
    e.preventDefault();
    setMenuOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm(t('browse.deleteFolderConfirm', { name: node.title }))) {
      onDelete?.(node.id);
    }
  };

  // ── DnD ───────────────────────────────────────────────────────────────────
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: isOverlay || isRenaming,
    data: { type: 'folder' },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // ── Render: renaming mode ─────────────────────────────────────────────────
  if (isRenaming) {
    return (
      <div
        className={`flex flex-col gap-2 p-3 rounded-xl border bg-gradient-to-br ${colorClass}`}
      >
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="w-full text-sm border border-border rounded px-2 py-1 bg-white/70 focus:outline-none focus:ring-1 focus:ring-primary/60"
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') cancelRename();
          }}
        />
        <div className="flex gap-1 justify-end">
          <button
            onClick={commitRename}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white/70 hover:bg-white/90"
          >
            <Check className="w-3 h-3" />
            {t('common.save')}
          </button>
          <button
            onClick={cancelRename}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white/40 hover:bg-white/60"
          >
            <X className="w-3 h-3" />
            {t('common.cancel')}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: normal mode ───────────────────────────────────────────────────
  return (
    <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <div
        ref={setNodeRef}
        style={style}
        onContextMenu={handleContextMenu}
        onClick={() => !isRenaming && !menuOpen && onClick(node)}
        className={`group relative flex flex-col gap-1 p-2.5 rounded-xl border bg-gradient-to-br ${colorClass}
          hover:shadow-md hover:scale-[1.02] transition-all duration-200 overflow-hidden cursor-pointer
          ${isDropTarget ? 'ring-2 ring-primary shadow-md scale-[1.03] brightness-95' : ''}
          ${isDragging ? 'shadow-lg' : ''}
        `}
      >
        {/* Drop target indicator */}
        {isDropTarget && (
          <div className="absolute inset-0 rounded-xl bg-primary/10 flex items-center justify-center pointer-events-none">
            <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {t('browse.moveToFolder')}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3" />
          </div>

          <Folder className={`shrink-0 w-4 h-4 ${iconColor}`} />
          <span
            className="flex-1 text-sm font-semibold truncate"
            onDoubleClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}
          >
            {node.title || '(unnamed)'}
          </span>
          <div className="flex items-center gap-0.5 ml-auto">
            <DropdownMenu.Trigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity hover:bg-black/10"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenu.Trigger>
            <button
              className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="text-[11px] opacity-70 pl-5">
          {bookmarks} {t('browse.bookmarks')}
          {folders > 0 ? ` · ${folders} ${t('browse.subfolders')}` : ''}
        </div>
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[160px] bg-popover text-popover-foreground shadow-lg rounded-lg border border-border/60 py-1 text-sm animate-in fade-in-0 zoom-in-95"
          sideOffset={4}
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer outline-none rounded-sm mx-1"
            onSelect={() => setIsRenaming(true)}
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            {t('browse.renameFolder')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive cursor-pointer outline-none rounded-sm mx-1"
            onSelect={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('browse.deleteFolder')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
