// ─── AI Provider Types ────────────────────────────────────────────────────────

export type AIProvider = 'openai' | 'claude' | 'ollama' | 'custom';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  maxTokensPerBatch?: number;
}

/** Per-provider config storage — each provider keeps its own key/url/model */
export interface AIProvidersConfig {
  activeProvider: AIProvider;
  configs: Record<AIProvider, AIProviderConfig>;
}

export interface AIAnalysisResult {
  bookmarkId: string;
  suggestedFolder: string;
  isNewFolder: boolean;
  reason?: string;
  confidence?: number;
}

// ─── Sort Types ───────────────────────────────────────────────────────────────

export type SortField = 'default' | 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'domain';

// ─── Bookmark Types ────────────────────────────────────────────────────────────

export interface BookmarkNode {
  id: string;
  parentId?: string;
  title: string;
  url?: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkNode[];
  index?: number;
}

export interface BookmarkFlat {
  id: string;
  parentId?: string;
  title: string;
  url: string;
  currentFolderPath: string;
  currentFolderId?: string;
}

export interface FolderNode {
  id: string;
  parentId?: string;
  title: string;
  path: string;
  children: FolderNode[];
}

// ─── Category Plan Types ──────────────────────────────────────────────────────

/** A single category in the plan proposed by the AI */
export interface CategoryPlanItem {
  /** Folder path, e.g. "开发/前端" */
  path: string;
  /** Brief description of what goes here */
  description: string;
  /** Estimated bookmark count */
  estimatedCount?: number;
}

// ─── Organize / Suggestion Types ──────────────────────────────────────────────

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'modified';
export type ChangeType = 'move' | 'new-folder' | 'no-change';

export interface BookmarkSuggestion {
  bookmarkId: string;
  title: string;
  url: string;
  currentFolderPath: string;
  suggestedFolderPath: string;
  suggestedFolderId?: string;
  isNewFolder: boolean;
  changeType: ChangeType;
  reason?: string;
  status: SuggestionStatus;
}

export type OrganizeScope = 'all' | 'unclassified' | 'folder';

export interface OrganizeOptions {
  scope: OrganizeScope;
  targetFolderId?: string; // when scope = 'folder'
  batchSize: number;
}

// ─── Rule Types ────────────────────────────────────────────────────────────────

export type RuleMatchType = 'domain' | 'wildcard' | 'regex';

export interface UserRule {
  id: string;
  name: string;
  matchType: RuleMatchType;
  pattern: string;
  targetFolderPath: string;
  targetFolderId?: string;
  enabled: boolean;
  createdAt: number;
}

// ─── Backup Types ──────────────────────────────────────────────────────────────

export type BackupTrigger = 'auto' | 'manual' | 'pre-organize';

export interface BackupEntry {
  id?: number; // IndexedDB auto-increment
  timestamp: number;
  trigger: BackupTrigger;
  bookmarkCount: number;
  folderCount: number;
  snapshot: BookmarkNode[]; // full bookmark tree
  label?: string;
}

// ─── Settings Types ────────────────────────────────────────────────────────────

export type Language = 'zh' | 'en';

export interface AppSettings {
  language: Language;
  aiProvider: AIProvidersConfig;
  autoClassify: {
    enabled: boolean;
    silentMode: boolean;
  };
  organize: {
    batchSize: number;
    includeReason: boolean;
  };
  backup: {
    autoBackup: boolean;
    maxBackups: number;
  };
  rules: UserRule[];
}

// ─── Progress Types ────────────────────────────────────────────────────────────

export interface AnalysisProgress {
  phase: 'idle' | 'scanning' | 'analyzing' | 'done' | 'error';
  processed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  error?: string;
  /** The bookmarks currently being analyzed in this batch */
  currentItems: { title: string; url: string }[];
}

// ─── Message Types (background <-> popup) ─────────────────────────────────────

export type MessageType =
  | 'GET_BOOKMARK_TREE'
  | 'GET_FLAT_BOOKMARKS'
  | 'GET_FOLDERS'
  | 'START_ANALYSIS'
  | 'STOP_ANALYSIS'
  | 'GET_ANALYSIS_STATE'
  | 'RESET_ANALYSIS'
  | 'ANALYSIS_PROGRESS'
  | 'ANALYSIS_RESULT'
  | 'EXECUTE_ORGANIZE'
  | 'ORGANIZE_PROGRESS'
  | 'ORGANIZE_DONE'
  | 'AUTO_CLASSIFY_NEW'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'TEST_AI_CONNECTION'
  | 'PLAN_CATEGORIES'
  | 'DEDUPLICATE_FOLDERS'
  | 'CLEANUP_EMPTY_FOLDERS'
  | 'SHOW_CLASSIFY_TOAST'
  | 'CLASSIFY_RESULT'
  | 'ACCEPT_CLASSIFY'
  | 'DISMISS_CLASSIFY';

// ─── Classify Toast Types (background <-> content script) ─────────────────────

/** Sent from background to content script: show loading toast immediately */
export interface ClassifyToastPayload {
  bookmarkId: string;
  title: string;
  url: string;
  /** Pre-translated UI strings so content script doesn't need i18n */
  strings: {
    analyzing: string;
    accept: string;
    ignore: string;
    suggestion: string;
    ruleMatch: string;
    aiSuggestion: string;
    moved: string;
    error: string;
  };
}

/** Sent from background to content script: analysis result */
export interface ClassifyResultPayload {
  bookmarkId: string;
  suggestedFolder: string;
  source: 'ai' | 'rule';
}

/** Sent from content script to background: user accepted */
export interface AcceptClassifyPayload {
  bookmarkId: string;
  suggestedFolder: string;
}

/** Payload for PLAN_CATEGORIES message */
export interface PlanCategoriesPayload {
  bookmarks: BookmarkFlat[];
  folders: FolderNode[];
}

/** Payload for START_ANALYSIS message */
export interface StartAnalysisPayload {
  bookmarks: BookmarkFlat[];
  folders: FolderNode[];
  scope: OrganizeScope;
  batchSize: number;
  /** User-confirmed categories — AI must ONLY use these */
  confirmedCategories?: string[];
}

/** State broadcasted from background during analysis */
export interface AnalysisState {
  progress: AnalysisProgress;
  suggestions: BookmarkSuggestion[];
}

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload?: T;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
