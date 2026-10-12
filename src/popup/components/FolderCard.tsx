import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Folder, GripVertical, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
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
  dragDisabled?: boolean;
}

export default function FolderCard({
  node,
  onClick,
  isDropTarget = false,
  onRename,
  onDelete,
  isOverlay = false,
  dragDisabled = false,
}: FolderCardProps) {
  const { t } = useTranslation();

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
    disabled: isOverlay || isRenaming || dragDisabled,
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
        className="flex flex-col gap-2 p-3 rounded-lg border bg-background"
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
        role="button" tabIndex={0} aria-label={node.title}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(node); }
        }}
        className={`folder-card group relative px-3 py-2.5 rounded-lg border bg-background
          hover:bg-muted/40 hover:border-slate-300 transition-colors duration-150 cursor-pointer
          ${isDropTarget ? 'ring-2 ring-primary bg-primary/5' : ''}
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
          {!dragDisabled && !isOverlay && <div
            {...attributes}
            {...listeners}
            aria-label={t('browse.dragFolder')}
            className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 focus-visible:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3" />
          </div>}

          <Folder className="shrink-0 w-5 h-5 mr-1 text-muted-foreground" />
          <span
            className="flex-1 text-[13px] font-medium truncate"
          >
            {node.title || '(unnamed)'}
          </span>
          <div className="flex items-center gap-0.5 ml-auto">
            <DropdownMenu.Trigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                title={t('common.more')}
                className="row-actions p-0.5 rounded opacity-0 group-hover:opacity-60 group-focus-within:opacity-100 transition-opacity hover:bg-muted"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenu.Trigger>

          </div>
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
