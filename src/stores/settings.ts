import { create } from 'zustand';
import type { AppSettings, UserRule, AIProvidersConfig } from '@/shared/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS, DEFAULT_PROVIDER_CONFIGS, AI_BASE_URLS } from '@/shared/constants';
import { generateId } from '@/shared/utils';

/** Migrate legacy single aiProvider config to new per-provider format */
function migrateAIProvider(stored: any): AIProvidersConfig {
  const ap = stored?.aiProvider;
  // Already new format
  if (ap && ap.configs && ap.activeProvider) {
    // Ensure all providers have a config (fill missing with defaults)
    const configs = { ...DEFAULT_PROVIDER_CONFIGS, ...ap.configs };
    return { activeProvider: ap.activeProvider, configs };
  }
  // Legacy format: { provider, apiKey, baseUrl, model, ... }
  if (ap && typeof ap.provider === 'string' && !ap.configs) {
    const legacyProvider = ap.provider;
    const configs = {
      ...DEFAULT_PROVIDER_CONFIGS,
      [legacyProvider]: {
        provider: legacyProvider,
        apiKey: ap.apiKey || '',
        baseUrl: ap.baseUrl || AI_BASE_URLS[legacyProvider as keyof typeof AI_BASE_URLS] || '',
        model: ap.model || '',
        maxTokensPerBatch: ap.maxTokensPerBatch ?? 4000,
      },
    };
    return { activeProvider: legacyProvider, configs };
  }
  return DEFAULT_SETTINGS.aiProvider;
}

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;
  load: () => Promise<void>;
  save: (partial: Partial<AppSettings>) => Promise<void>;
  addRule: (rule: Omit<UserRule, 'id' | 'createdAt'>) => Promise<void>;
  updateRule: (id: string, partial: Partial<UserRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  reorderRules: (rules: UserRule[]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  async load() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      const stored = result[STORAGE_KEYS.SETTINGS];
      if (stored) {
        const aiProvider = migrateAIProvider(stored);
        const merged = { ...DEFAULT_SETTINGS, ...stored, aiProvider };
        set({ settings: merged, loaded: true });
        // Persist migrated format so it's clean next time
        if (!stored.aiProvider?.configs) {
          await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged });
        }
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  async save(partial) {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
  },

  async addRule(ruleData) {
    const rule: UserRule = {
      ...ruleData,
      id: generateId(),
      createdAt: Date.now(),
    };
    const rules = [...get().settings.rules, rule];
    await get().save({ rules });
  },

  async updateRule(id, partial) {
    const rules = get().settings.rules.map((r) =>
      r.id === id ? { ...r, ...partial } : r,
    );
    await get().save({ rules });
  },

  async deleteRule(id) {
    const rules = get().settings.rules.filter((r) => r.id !== id);
    await get().save({ rules });
  },

  async reorderRules(rules) {
    await get().save({ rules });
  },
}));
