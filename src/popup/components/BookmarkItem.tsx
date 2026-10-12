import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ExternalLink,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Check,
  X,
  FolderInput,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { extractDomain } from '@/shared/utils';
import BookmarkIcon from '@/components/BookmarkIcon';

export interface BookmarkItemProps {
  id: string;
  title: string;
  url: string;
  dateAdded?: number;
  /** Whether the parent list is in multi-select mode */
  isSelecting?: boolean;
  /** Whether this item is currently selected */
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, title: string, url: string) => void;
  /** Callback when user wants to move this bookmark to another folder */
  onMove?: (id: string) => void;
  /** Set to true when rendering as DragOverlay (no DnD hooks, simplified style) */
  isOverlay?: boolean;
  dragDisabled?: boolean;
}

export default function BookmarkItem({
  id,
  title,
  url,
  dateAdded: _dateAdded,
  isSelecting = false,
  isSelected = false,
  onSelect,
  onDelete,
  onUpdate,
  onMove,
  isOverlay = false,
  dragDisabled = false,
}: BookmarkItemProps) {
  const { t } = useTranslation();
  const domain = extractDomain(url);

  // ── Inline edit state ──────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editUrl, setEditUrl] = useState(url);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditTitle(title);
      setEditUrl(url);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isEditing, title, url]);

  const commitEdit = () => {
    const newTitle = editTitle.trim();
    const newUrl = editUrl.trim();
    if (newTitle && newUrl && (newTitle !== title || newUrl !== url)) {
      onUpdate?.(id, newTitle, newUrl);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  // ── Context menu (right-click) state ──────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isEditing || isSelecting) return;
    e.preventDefault();
    setMenuOpen(true);
  };

  // ── DnD ───────────────────────────────────────────────────────────────────
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isOverlay || isEditing || isSelecting || dragDisabled,
    data: { type: 'bookmark' },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : undefined,
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClick = () => {
    if (isSelecting) {
      onSelect?.(id);
      return;
    }
    if (!isEditing) {
      chrome.tabs.create({ url });
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const handleDelete = () => {
    if (window.confirm(t('browse.deleteBookmarkConfirm', { name: title }))) {
      onDelete?.(id);
    }
  };

  // ── Render: editing mode ──────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full flex flex-col gap-1.5 px-3 py-2.5 rounded-lg border border-primary/40 bg-background shadow-sm"
      >
        <input
          ref={titleInputRef}
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder={t('browse.editTitlePlaceholder')}
          className="w-full text-sm border border-border rounded px-2 py-1 bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/60"
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
        />
        <input
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          placeholder={t('browse.editUrlPlaceholder')}
          className="w-full text-xs border border-border rounded px-2 py-1 bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/60"
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
        />
        <div className="flex gap-1 justify-end">
          <button
            onClick={commitEdit}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Check className="w-3 h-3" />
            {t('common.save')}
          </button>
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-muted hover:bg-muted/80"
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
        className={`bookmark-row group relative flex items-center gap-3 px-2 py-1.5 hover:bg-accent/60 transition-colors duration-150 cursor-pointer ${
          isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : ''
        } ${isDragging ? 'shadow-lg bg-background' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); }
        }}
      >
        {/* Checkbox (select mode) */}
        {isSelecting && (
          <div
            className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-primary border-primary' : 'border-border bg-background'
            }`}
          >
            {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
          </div>
        )}

        {/* Drag handle (shown on hover, hidden in select mode) */}
        {!isSelecting && !dragDisabled && !isOverlay && (
          <div
            {...attributes}
            {...listeners}
            aria-label={t('browse.dragBookmark')}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-3 flex items-center justify-center opacity-0 group-hover:opacity-40 focus-visible:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}

        {/* Favicon */}
        <BookmarkIcon url={url} title={title} />

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-foreground truncate leading-tight group-hover:text-primary transition-colors">
            {title || domain || url}
          </div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">{domain}</div>
        </div>

        {/* Action buttons on hover */}
        {!isSelecting && (
          <div className="row-actions shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                chrome.tabs.create({ url });
              }}
              className="p-1 rounded hover:bg-accent transition-colors"
              title={t('browse.openUrl')}
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <DropdownMenu.Trigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-accent transition-colors"
                title={t('common.more')}
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenu.Trigger>
          </div>
        )}
      </div>

      {/* Context dropdown menu */}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[160px] bg-popover text-popover-foreground shadow-lg rounded-lg border border-border/60 py-1 text-sm animate-in fade-in-0 zoom-in-95"
          sideOffset={4}
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer outline-none rounded-sm mx-1"
            onSelect={() => chrome.tabs.create({ url })}
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            {t('browse.openUrl')}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer outline-none rounded-sm mx-1"
            onSelect={handleCopyUrl}
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            {t('browse.copyUrl')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer outline-none rounded-sm mx-1"
            onSelect={() => setIsEditing(true)}
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            {t('browse.editTitle')}
          </DropdownMenu.Item>
          {onMove && (
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer outline-none rounded-sm mx-1"
              onSelect={() => onMove(id)}
            >
              <FolderInput className="w-3.5 h-3.5 text-muted-foreground" />
              {t('browse.moveToFolder')}
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive cursor-pointer outline-none rounded-sm mx-1"
            onSelect={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('browse.deleteBookmark')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
