import React from 'react';
import { useTranslation } from 'react-i18next';
import type { BookmarkSuggestion, ChangeType } from '@/shared/types';
import { cn } from '@/shared/utils';

type FilterType = 'all' | ChangeType | 'pending';

interface Props {
  current: FilterType;
  onChange: (f: FilterType) => void;
  suggestions: BookmarkSuggestion[];
}

export default function FilterBar({ current, onChange, suggestions }: Props) {
  const { t } = useTranslation();

  const counts: Record<FilterType, number> = {
    all: suggestions.length,
    move: suggestions.filter((s) => s.changeType === 'move').length,
    'new-folder': suggestions.filter((s) => s.changeType === 'new-folder').length,
    'no-change': suggestions.filter((s) => s.changeType === 'no-change').length,
    pending: suggestions.filter((s) => s.status === 'pending').length,
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('filter.all') },
    { key: 'move', label: t('filter.move') },
    { key: 'new-folder', label: t('filter.newFolder') },
    { key: 'pending', label: t('filter.pending') },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'px-2 py-0.5 rounded text-xs border transition-colors',
            current === key
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:bg-accent',
          )}
        >
          {label} <span className="ml-0.5 opacity-75">({counts[key]})</span>
        </button>
      ))}
    </div>
  );
}
