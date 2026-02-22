import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import type { BookmarkSuggestion } from '@/shared/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, truncate } from '@/shared/utils';

interface Props {
  suggestion: BookmarkSuggestion;
  onAccept: () => void;
  onReject: () => void;
  onModify: (newPath: string) => void;
}

export default function BookmarkSuggestionItem({ suggestion, onAccept, onReject, onModify }: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(suggestion.suggestedFolderPath);
  const [expanded, setExpanded] = useState(false);

  const statusColor = {
    accepted: 'border-l-green-500',
    rejected: 'border-l-gray-300 opacity-60',
    modified: 'border-l-blue-500',
    pending: 'border-l-yellow-400',
  }[suggestion.status];

  const handleEditConfirm = () => {
    onModify(editValue);
    setEditing(false);
  };

  return (
    <div className={cn('border-l-2 px-3 py-2 border-b', statusColor)}>
      {/* Title + URL row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" title={suggestion.title}>
            {suggestion.title}
          </p>
          <p className="text-xs text-muted-foreground truncate" title={suggestion.url}>
            {truncate(suggestion.url, 60)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onAccept}>
            <Check className={cn('h-3.5 w-3.5', suggestion.status === 'accepted' || suggestion.status === 'modified' ? 'text-green-500' : 'text-muted-foreground')} />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onReject}>
            <X className={cn('h-3.5 w-3.5', suggestion.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground')} />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(!editing)}>
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Folder path row - two lines for clarity */}
      <div className="mt-1 space-y-0.5 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground" title={suggestion.currentFolderPath}>
          <span className="shrink-0 text-[10px] bg-muted px-1 rounded">{t('suggestion.from') || '原'}</span>
          <span className="truncate">{suggestion.currentFolderPath || '/'}</span>
        </div>
        <div className="flex items-center gap-1" title={suggestion.suggestedFolderPath}>
          <span className="shrink-0 text-[10px] bg-primary/10 text-primary px-1 rounded">{t('suggestion.to') || '至'}</span>
          <span className={cn('truncate font-medium', suggestion.isNewFolder ? 'text-blue-600' : 'text-foreground')}>
            {suggestion.suggestedFolderPath}
          </span>
          {suggestion.isNewFolder && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">{t('suggestion.newFolderBadge')}</Badge>
          )}
        </div>
      </div>

      {/* Edit input */}
      {editing && (
        <div className="mt-1.5 flex gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-6 text-xs py-0"
            placeholder="Folder/SubFolder"
            onKeyDown={(e) => { if (e.key === 'Enter') handleEditConfirm(); if (e.key === 'Escape') setEditing(false); }}
            autoFocus
          />
          <Button size="sm" className="h-6 px-2 text-xs" onClick={handleEditConfirm}>OK</Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setEditing(false)}>✕</Button>
        </div>
      )}

      {/* Reason (collapsible) */}
      {suggestion.reason && (
        <button
          className="mt-1 flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {t('suggestion.reason')}
        </button>
      )}
      {expanded && suggestion.reason && (
        <p className="text-[10px] text-muted-foreground mt-0.5 italic">{suggestion.reason}</p>
      )}
    </div>
  );
}
