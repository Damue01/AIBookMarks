import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Loader2,
  Pencil,
  Check,
  X,
  FolderTree,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CategoryPlanItem, BookmarkFlat, FolderNode } from '@/shared/types';
import type { PopupPage } from '../App';

interface CategoryPlanPageProps {
  bookmarks: BookmarkFlat[];
  folders: FolderNode[];
  scope: 'all' | 'unclassified';
  onNavigate: (page: PopupPage) => void;
  onConfirm: (categories: string[]) => void;
}

export default function CategoryPlanPage({
  bookmarks,
  folders,
  scope,
  onNavigate,
  onConfirm,
}: CategoryPlanPageProps) {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<CategoryPlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newPath, setNewPath] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-generate plan on first mount
  useEffect(() => {
    generatePlan();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PLAN_CATEGORIES',
        payload: { bookmarks, folders },
      });
      if (response?.success && Array.isArray(response.data)) {
        setPlan(response.data);
      } else {
        setError(response?.error || t('categoryPlan.generateFailed'));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('categoryPlan.generateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (idx: number) => {
    setPlan((p) => p.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    const trimmed = newPath.trim();
    if (!trimmed) return;
    if (plan.some((p) => p.path.toLowerCase() === trimmed.toLowerCase())) return;
    setPlan((p) => [...p, { path: trimmed, description: '', estimatedCount: 0 }]);
    setNewPath('');
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const startEdit = (idx: number) => {
    setEditIdx(idx);
    setEditValue(plan[idx].path);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmEdit = () => {
    if (editIdx === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    setPlan((p) =>
      p.map((item, i) => (i === editIdx ? { ...item, path: trimmed } : item)),
    );
    setEditIdx(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleConfirm = () => {
    const categories = plan.map((p) => p.path).filter(Boolean);
    if (categories.length === 0) return;
    onConfirm(categories);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0">
        <Button variant="ghost" size="icon" onClick={() => onNavigate('home')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <FolderTree className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm flex-1">
          {t('categoryPlan.title')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2"
          onClick={generatePlan}
          disabled={loading}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {t('categoryPlan.regenerate')}
        </Button>
      </div>

      {/* Hint */}
      <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-b">
        {t('categoryPlan.hint', { count: bookmarks.length })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm">{t('categoryPlan.generating')}</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mx-3 mt-2 p-2 rounded bg-destructive/10 text-destructive text-xs">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6 ml-2"
            onClick={generatePlan}
          >
            {t('categoryPlan.retry')}
          </Button>
        </div>
      )}

      {/* Category list */}
      {!loading && plan.length > 0 && (
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {plan.map((item, idx) => (
            <div
              key={idx}
              className="group flex items-center gap-1.5 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground/50 shrink-0" />

              {editIdx === idx ? (
                // Editing mode
                <div className="flex-1 flex items-center gap-1">
                  <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="h-6 text-xs flex-1"
                  />
                  <button
                    onClick={confirmEdit}
                    className="p-0.5 text-green-600 hover:text-green-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                // Display mode
                <>
                  <span className="flex-1 text-sm font-medium truncate">
                    📁 {item.path}
                  </span>
                  {item.description && (
                    <span
                      className="text-[10px] text-muted-foreground truncate max-w-[120px]"
                      title={item.description}
                    >
                      {item.description}
                    </span>
                  )}
                  {item.estimatedCount != null && item.estimatedCount > 0 && (
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      ~{item.estimatedCount}
                    </span>
                  )}
                  <button
                    onClick={() => startEdit(idx)}
                    className="p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add category input */}
      {!loading && (
        <div className="px-3 py-2 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              placeholder={t('categoryPlan.addPlaceholder')}
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              onKeyDown={handleAddKeyDown}
              className="h-7 text-xs flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              onClick={handleAdd}
              disabled={!newPath.trim()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <div className="px-3 py-2 border-t shrink-0">
        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={loading || plan.length === 0}
        >
          <Play className="h-3.5 w-3.5" />
          {t('categoryPlan.confirmAndAnalyze', { count: plan.length })}
        </Button>
      </div>
    </div>
  );
}
