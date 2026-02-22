import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings';
import type { UserRule, RuleMatchType } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const EMPTY_RULE: Omit<UserRule, 'id' | 'createdAt'> = {
  name: '',
  matchType: 'domain',
  pattern: '',
  targetFolderPath: '',
  enabled: true,
};

export default function RulesManagerPage() {
  const { t } = useTranslation();
  const { settings, addRule, updateRule, deleteRule } = useSettingsStore();
  const [editing, setEditing] = useState<UserRule | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_RULE);

  const matchTypes: { value: RuleMatchType; label: string; placeholder: string }[] = [
    { value: 'domain', label: t('rules.domain'), placeholder: t('rules.patternPlaceholderDomain') },
    { value: 'wildcard', label: t('rules.wildcard'), placeholder: t('rules.patternPlaceholderWildcard') },
    { value: 'regex', label: t('rules.regex'), placeholder: t('rules.patternPlaceholderRegex') },
  ];

  const placeholder = matchTypes.find((m) => m.value === form.matchType)?.placeholder || '';

  const handleAdd = async () => {
    if (!form.name || !form.pattern || !form.targetFolderPath) return;
    await addRule(form);
    setForm(EMPTY_RULE);
    setCreating(false);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    await updateRule(editing.id, form);
    setEditing(null);
    setForm(EMPTY_RULE);
  };

  const startEdit = (rule: UserRule) => {
    setEditing(rule);
    setForm({ name: rule.name, matchType: rule.matchType, pattern: rule.pattern, targetFolderPath: rule.targetFolderPath, enabled: rule.enabled });
    setCreating(false);
  };

  const cancel = () => { setEditing(null); setCreating(false); setForm(EMPTY_RULE); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('rules.title')}</h2>
        <Button size="sm" onClick={() => { setCreating(true); setEditing(null); }}>
          <Plus className="h-4 w-4" /> {t('rules.addRule')}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{t('rules.priority')}</p>

      {/* Rule form */}
      {(creating || editing) && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <h3 className="text-sm font-medium">{editing ? t('rules.editRule') : t('rules.addRule')}</h3>
            <div className="space-y-1">
              <Label>{t('rules.name')}</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Rule" />
            </div>
            <div className="space-y-1">
              <Label>{t('rules.matchType')}</Label>
              <div className="flex gap-2">
                {matchTypes.map((mt) => (
                  <button
                    key={mt.value}
                    onClick={() => setForm((f) => ({ ...f, matchType: mt.value }))}
                    className={`px-2 py-1 rounded border text-xs transition-colors ${form.matchType === mt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t('rules.pattern')}</Label>
              <Input value={form.pattern} onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))} placeholder={placeholder} />
            </div>
            <div className="space-y-1">
              <Label>{t('rules.targetFolder')}</Label>
              <Input value={form.targetFolderPath} onChange={(e) => setForm((f) => ({ ...f, targetFolderPath: e.target.value }))} placeholder="Development/GitHub" />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ruleEnabled" checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
              <Label htmlFor="ruleEnabled">{t('rules.enabled')}</Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={editing ? handleUpdate : handleAdd}>{t('common.save')}</Button>
              <Button size="sm" variant="outline" onClick={cancel}>{t('common.cancel')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rule list */}
      {settings.rules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('rules.noRules')}</p>
      ) : (
        <div className="space-y-2">
          {settings.rules.map((rule) => (
            <Card key={rule.id} className={rule.enabled ? '' : 'opacity-50'}>
              <CardContent className="py-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-mono bg-muted px-1 rounded">{rule.pattern}</span>
                    {' → '}
                    <span>{rule.targetFolderPath}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">{rule.matchType}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => updateRule(rule.id, { enabled: v })}
                    className="scale-75"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(rule)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteRule(rule.id)}>
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
