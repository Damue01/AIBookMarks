import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/stores/settings';
import { createAIService } from '@/services/ai';
import { AI_MODEL_SUGGESTIONS, AI_BASE_URLS, DEFAULT_PROVIDER_CONFIGS } from '@/shared/constants';
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
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelFilter, setModelFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const fetchAvailableModels = async (provider?: AIProvider, cfg?: AIProviderConfig) => {
    const p = provider ?? activeProvider;
    const c = cfg ?? currentConfig;
    setFetchingModels(true);
    try {
      if (p === 'ollama') {
        const root = (c.baseUrl || 'http://localhost:11434')
          .replace(/\/v1\/?$/, '').replace(/\/$/, '');
        const res = await fetch(`${root}/api/tags`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { models: { name: string }[] };
        setFetchedModels(data.models.map((m) => m.name));
      } else if (p === 'openai' || p === 'custom') {
        const base = (c.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
        const res = await fetch(`${base}/models`, {
          headers: { Authorization: `Bearer ${c.apiKey || ''}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { data: { id: string }[] };
        const ids = data.data
          .map((m) => m.id)
          .filter((id) => /gpt|claude|llama|mistral|qwen|gemma|deepseek/i.test(id))
          .sort();
        setFetchedModels(ids);
      } else if (p === 'claude') {
        const base = (c.baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
        const res = await fetch(`${base}/v1/models`, {
          headers: {
            'x-api-key': c.apiKey || '',
            'anthropic-version': '2023-06-01',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { data: { id: string }[] };
        setFetchedModels(data.data.map((m) => m.id).sort());
      }
    } catch {
      setFetchedModels([]);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleProviderChange = (p: AIProvider) => {
    setActiveProvider(p);
    setTestResult(null);
    setFetchedModels([]);
    if (p === 'ollama') fetchAvailableModels(p, configs[p]);
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

  const modelSuggestions =
    fetchedModels.length > 0 ? fetchedModels : AI_MODEL_SUGGESTIONS[activeProvider];

  const filteredModels = modelFilter
    ? modelSuggestions.filter((m) => m.toLowerCase().includes(modelFilter.toLowerCase()))
    : modelSuggestions;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
            <div className="flex items-center justify-between">
              <Label htmlFor="model">{t('settings.ai.model')}</Label>
              <button
                type="button"
                onClick={() => fetchAvailableModels()}
                disabled={fetchingModels || (activeProvider !== 'ollama' && !currentConfig.apiKey)}
                className="text-xs text-primary hover:underline disabled:opacity-50"
                title={activeProvider !== 'ollama' && !currentConfig.apiKey ? '请先填写 API Key' : undefined}
              >
                {fetchingModels ? '加载中…' : '获取模型列表'}
              </button>
            </div>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-1">
                <Input
                  id="model"
                  placeholder={t('settings.ai.modelPlaceholder')}
                  value={currentConfig.model}
                  onChange={(e) => {
                    updateCurrentConfig({ model: e.target.value });
                    setModelFilter(e.target.value);
                    setModelDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setModelFilter('');
                    setModelDropdownOpen(true);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setModelFilter('');
                    setModelDropdownOpen(!modelDropdownOpen);
                  }}
                  className="flex items-center justify-center w-9 h-9 rounded-md border border-input bg-transparent hover:bg-accent shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`}>
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {modelDropdownOpen && filteredModels.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-input bg-popover shadow-md">
                  {filteredModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
                        currentConfig.model === m ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                      onClick={() => {
                        updateCurrentConfig({ model: m });
                        setModelDropdownOpen(false);
                        setModelFilter('');
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
