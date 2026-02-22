import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings';
import { createAIService } from '@/services/ai';
import { AI_MODELS, AI_BASE_URLS, DEFAULT_PROVIDER_CONFIGS } from '@/shared/constants';
import type { AIProvider, AIProviderConfig } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'claude', label: 'Anthropic Claude' },
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'custom', label: 'Custom (OpenAI-compatible)' },
];

export default function AIConfigPage() {
  const { t } = useTranslation();
  const { settings, save } = useSettingsStore();
  const aiProviders = settings.aiProvider;

  // Active provider selection
  const [activeProvider, setActiveProvider] = useState<AIProvider>(aiProviders.activeProvider);

  // Per-provider configs (local copy for editing)
  const [configs, setConfigs] = useState<Record<AIProvider, AIProviderConfig>>(() => ({
    ...DEFAULT_PROVIDER_CONFIGS,
    ...aiProviders.configs,
  }));

  // Analysis settings
  const [batchSize, setBatchSize] = useState(settings.organize.batchSize);
  const [includeReason, setIncludeReason] = useState(settings.organize.includeReason);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Current provider's config
  const currentConfig = configs[activeProvider];

  // Sync from store if settings change externally
  useEffect(() => {
    setConfigs(prev => ({ ...DEFAULT_PROVIDER_CONFIGS, ...prev, ...aiProviders.configs }));
    setActiveProvider(aiProviders.activeProvider);
  }, [aiProviders]);

  const updateCurrentConfig = (patch: Partial<AIProviderConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [activeProvider]: { ...prev[activeProvider], ...patch },
    }));
  };

  const handleProviderChange = (p: AIProvider) => {
    setActiveProvider(p);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const svc = createAIService(currentConfig);
      const result = await svc.testConnection();
      setTestResult({ ok: result.ok, msg: result.message });
    } catch (e) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : 'Error' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await save({
      aiProvider: { activeProvider, configs },
      organize: { batchSize, includeReason },
    });
    setSaving(false);
  };

  const knownModels = AI_MODELS[activeProvider];

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold">{t('settings.ai.title')}</h2>

      <Card>
        <CardContent className="pt-4 space-y-4">
          {/* Provider selector */}
          <div className="space-y-1">
            <Label>{t('settings.ai.provider')}</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleProviderChange(p.value)}
                  className={`px-3 py-2 rounded border text-sm text-left transition-colors ${
                    activeProvider === p.value
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Key (not needed for Ollama) */}
          {activeProvider !== 'ollama' && (
            <div className="space-y-1">
              <Label htmlFor="apiKey">{t('settings.ai.apiKey')}</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={t('settings.ai.apiKeyPlaceholder')}
                value={currentConfig.apiKey || ''}
                onChange={(e) => updateCurrentConfig({ apiKey: e.target.value })}
              />
            </div>
          )}

          {/* Base URL */}
          <div className="space-y-1">
            <Label htmlFor="baseUrl">{t('settings.ai.baseUrl')}</Label>
            <Input
              id="baseUrl"
              placeholder={AI_BASE_URLS[activeProvider] || 'https://api.openai.com/v1'}
              value={currentConfig.baseUrl || ''}
              onChange={(e) => updateCurrentConfig({ baseUrl: e.target.value })}
            />
          </div>

          {/* Model */}
          <div className="space-y-1">
            <Label htmlFor="model">{t('settings.ai.model')}</Label>
            {knownModels.length > 0 ? (
              <select
                id="model"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={currentConfig.model}
                onChange={(e) => updateCurrentConfig({ model: e.target.value })}
              >
                {knownModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            ) : (
              <Input
                id="model"
                placeholder={t('settings.ai.modelPlaceholder')}
                value={currentConfig.model}
                onChange={(e) => updateCurrentConfig({ model: e.target.value })}
              />
            )}
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleTest} loading={testing} disabled={testing}>
              {t('settings.ai.testConnection')}
            </Button>
            {testResult && (
              <span className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-destructive'}`}>
                {testResult.ok ? '\u2713' : '\u2717'} {testResult.msg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Analysis Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="batchSize">{t('settings.ai.batchSize')}</Label>
            <Input
              id="batchSize"
              type="number"
              min={5}
              max={100}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="w-24"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="includeReason"
              checked={includeReason}
              onCheckedChange={setIncludeReason}
            />
            <Label htmlFor="includeReason">{t('settings.ai.includeReason')}</Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} loading={saving}>
        {t('common.save')}
      </Button>
    </div>
  );
}
