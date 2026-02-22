import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings';
import { initI18n } from '@/services/i18n';
import type { Language } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GeneralSettingsPage() {
  const { t } = useTranslation();
  const { settings, save } = useSettingsStore();

  const [language, setLanguage] = useState<Language>(settings.language);
  const [autoClassify, setAutoClassify] = useState(settings.autoClassify.enabled);
  const [silentMode, setSilentMode] = useState(settings.autoClassify.silentMode);
  const [autoBackup, setAutoBackup] = useState(settings.backup.autoBackup);
  const [maxBackups, setMaxBackups] = useState(settings.backup.maxBackups);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await save({
      language,
      autoClassify: { enabled: autoClassify, silentMode },
      backup: { autoBackup, maxBackups },
    });
    initI18n(language);
    setSaving(false);
  };

  const langs: { value: Language; label: string }[] = [
    { value: 'zh', label: t('settings.general.zh') },
    { value: 'en', label: t('settings.general.en') },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold">{t('settings.general.title')}</h2>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle>{t('settings.general.language')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {langs.map((l) => (
              <button
                key={l.value}
                onClick={() => setLanguage(l.value)}
                className={`px-4 py-2 rounded border text-sm transition-colors ${
                  language === l.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto Classify */}
      <Card>
        <CardHeader><CardTitle>{t('settings.autoClassify.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch id="autoClassify" checked={autoClassify} onCheckedChange={setAutoClassify} />
            <Label htmlFor="autoClassify">{t('settings.autoClassify.enable')}</Label>
          </div>
          {autoClassify && (
            <div className="flex items-center gap-3 pl-2">
              <Switch id="silentMode" checked={silentMode} onCheckedChange={setSilentMode} />
              <Label htmlFor="silentMode" className="text-sm text-muted-foreground">
                {t('settings.autoClassify.silentMode')}
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup */}
      <Card>
        <CardHeader><CardTitle>{t('settings.backup.title')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch id="autoBackup" checked={autoBackup} onCheckedChange={setAutoBackup} />
            <Label htmlFor="autoBackup">{t('settings.backup.autoBackup')}</Label>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="maxBackups" className="whitespace-nowrap">{t('settings.backup.maxBackups')}</Label>
            <Input
              id="maxBackups"
              type="number"
              min={1}
              max={50}
              value={maxBackups}
              onChange={(e) => setMaxBackups(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} loading={saving}>{t('common.save')}</Button>
    </div>
  );
}
