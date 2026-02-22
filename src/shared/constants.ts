import type { AIProvider, AIProviderConfig, AIProvidersConfig, AppSettings } from './types';

export const DEFAULT_BATCH_SIZE = 30;
export const MAX_BACKUPS_DEFAULT = 10;
export const AUTO_CLASSIFY_DEFAULT = true;

/** Non-binding model name suggestions — users can freely type any model name. */
export const AI_MODEL_SUGGESTIONS: Record<AIProvider, string[]> = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4.5-preview',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ],
  claude: [
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
  ],
  ollama: [
    'llama3.2',
    'mistral',
    'qwen2.5',
    'gemma2',
    'deepseek-r1',
  ],
  custom: [],
};

export const AI_BASE_URLS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com',
  ollama: 'http://localhost:11434/v1',
  custom: '',
};

/** Default per-provider configs */
export const DEFAULT_PROVIDER_CONFIGS: Record<AIProvider, AIProviderConfig> = {
  openai: {
    provider: 'openai',
    apiKey: '',
    baseUrl: AI_BASE_URLS.openai,
    model: 'gpt-4o-mini',
    maxTokensPerBatch: 4000,
  },
  claude: {
    provider: 'claude',
    apiKey: '',
    baseUrl: AI_BASE_URLS.claude,
    model: 'claude-3-5-sonnet-20241022',
    maxTokensPerBatch: 4000,
  },
  ollama: {
    provider: 'ollama',
    apiKey: '',
    baseUrl: AI_BASE_URLS.ollama,
    model: 'llama3.2',
    maxTokensPerBatch: 4000,
  },
  custom: {
    provider: 'custom',
    apiKey: '',
    baseUrl: '',
    model: '',
    maxTokensPerBatch: 4000,
  },
};

export const DEFAULT_AI_PROVIDERS: AIProvidersConfig = {
  activeProvider: 'openai',
  configs: { ...DEFAULT_PROVIDER_CONFIGS },
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'zh',
  aiProvider: DEFAULT_AI_PROVIDERS,
  autoClassify: {
    enabled: AUTO_CLASSIFY_DEFAULT,
    silentMode: false,
  },
  organize: {
    batchSize: DEFAULT_BATCH_SIZE,
    includeReason: true,
  },
  backup: {
    autoBackup: true,
    maxBackups: MAX_BACKUPS_DEFAULT,
  },
  rules: [],
};

export const STORAGE_KEYS = {
  SETTINGS: 'aibm_settings',
  PENDING_ORGANIZE: 'aibm_pending_organize',
} as const;

export const DB_NAME = 'AIBookMarksDB';
export const DB_VERSION = 1;
export const BACKUP_TABLE = 'backups';

// Chrome/Firefox root folder IDs
export const BROWSER_ROOT_IDS = ['0', '1', '2'];

// Special folder titles (localized in-browser)
export const UNCATEGORIZED_PARENTS = ['1', '2']; // Bookmarks bar, Other bookmarks
