import type { AIAnalysisResult, BookmarkFlat, FolderNode, CategoryPlanItem } from '@/shared/types';

export interface AIService {
  /** Test if the connection is working */
  testConnection(): Promise<{ ok: boolean; message: string }>;
  /** Analyze a batch of bookmarks and return suggestions */
  analyzeBatch(
    bookmarks: BookmarkFlat[],
    existingFolders: FolderNode[],
    confirmedCategories?: string[],
  ): Promise<AIAnalysisResult[]>;
  /** Generate a category plan based on all bookmarks */
  planCategories(
    bookmarks: BookmarkFlat[],
    existingFolders: FolderNode[],
  ): Promise<CategoryPlanItem[]>;
}

export function buildSystemPrompt(existingFolders: FolderNode[], language: string = 'zh', confirmedCategories?: string[]): string {
  const rootNames = new Set([
    'bookmarks bar', 'other bookmarks', 'mobile bookmarks',
    '书签栏', '其他书签', '移动设备书签',
  ]);

  // If user provided confirmed categories, use ONLY those
  if (confirmedCategories && confirmedCategories.length > 0) {
    const folderList = confirmedCategories.map((c) => `  - ${c}`).join('\n');
    const langInstruction = language === 'zh'
      ? '请使用中文命名（除非该领域约定俗成使用英文名）。'
      : 'Use English for folder names.';
    return `You are a bookmark organization assistant. Your task is to assign each bookmark to the BEST matching folder from the APPROVED list below.

APPROVED FOLDERS (you MUST use one of these — do NOT invent new folders):
${folderList}

Rules:
1. You MUST assign each bookmark to one of the approved folders listed above. Do NOT create any new folder.
2. Use "/" as path separator. Do NOT include root folder names like "Bookmarks Bar", "书签栏", etc.
3. If a bookmark doesn't fit perfectly, choose the closest match from the approved list.
4. ${langInstruction}
5. Set "isNewFolder" to false for ALL items (since only approved folders are used).
6. Respond ONLY with a valid JSON array, no explanation text.
7. Each item: { "id": string, "suggestedFolder": string, "isNewFolder": false, "reason": string (brief, in ${language === 'zh' ? 'Chinese' : 'English'}) }`;
  }

  // Original behavior: AI can suggest existing or new folders
  const seen = new Set<string>();
  const dedupedPaths: string[] = [];
  for (const f of existingFolders) {
    let parts = f.path.split('/').filter(Boolean);
    if (parts.length > 0 && rootNames.has(parts[0].toLowerCase())) {
      parts = parts.slice(1);
    }
    if (parts.length === 0) continue;
    const display = parts.join('/');
    const key = display.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      dedupedPaths.push(`  - ${display}`);
    }
  }

  const langInstruction = language === 'zh'
    ? '请使用中文命名新文件夹（除非该领域约定俗成使用英文名，如 GitHub、Docker）。'
    : 'Use English for new folder names.';

  const folderList = dedupedPaths.join('\n');
  return `You are a bookmark organization assistant. Your task is to suggest the best folder for each bookmark.

Existing folder structure:
${folderList || '  (no folders yet)'}

Rules:
1. STRONGLY prefer existing folders. Reuse folder names EXACTLY as listed above. Do NOT create a near-duplicate (e.g. "开发工具" when "开发" exists, or "AI Tools" when "AI" exists).
2. Do NOT create a new folder unless absolutely no existing folder can hold the bookmark.
3. Use "/" as path separator (e.g. "开发/GitHub"). Do NOT include root folder names like "Bookmarks Bar", "Other Bookmarks", "书签栏", "其他书签".
4. Keep folder hierarchy 1-2 levels deep. Avoid deep nesting (e.g. prefer "开发/前端" over "开发/前端/React/组件库").
5. ${langInstruction}
6. Group similar bookmarks together. Think in broad categories: 开发, 设计, 工具, 学习, 娱乐, 新闻, 社交, 购物, 金融, etc.
7. Respond ONLY with a valid JSON array, no explanation text.
8. Each item: { "id": string, "suggestedFolder": string, "isNewFolder": boolean, "reason": string (brief, in ${language === 'zh' ? 'Chinese' : 'English'}) }`;
}

export function buildUserPrompt(bookmarks: BookmarkFlat[]): string {
  const list = bookmarks
    .map(
      (b, i) =>
        `${i + 1}. id="${b.id}" title="${b.title}" url="${b.url}" currentFolder="${b.currentFolderPath}"`,
    )
    .join('\n');
  return `Categorize the following bookmarks:\n${list}\n\nRespond with a JSON array only.`;
}

export function parseAIResponse(raw: string): AIAnalysisResult[] {
  // Extract JSON array from the response (handles markdown code blocks)
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found in AI response');
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error('AI response is not an array');
  return parsed.map((item) => ({
    bookmarkId: String(item.id),
    suggestedFolder: String(item.suggestedFolder || ''),
    isNewFolder: Boolean(item.isNewFolder),
    reason: item.reason ? String(item.reason) : undefined,
    confidence: item.confidence ? Number(item.confidence) : undefined,
  }));
}

// ─── Category Planning Prompts ────────────────────────────────────────────────

export function buildPlanSystemPrompt(existingFolders: FolderNode[], language: string = 'zh'): string {
  const rootNames = new Set([
    'bookmarks bar', 'other bookmarks', 'mobile bookmarks',
    '书签栏', '其他书签', '移动设备书签',
  ]);
  const seen = new Set<string>();
  const dedupedPaths: string[] = [];
  for (const f of existingFolders) {
    let parts = f.path.split('/').filter(Boolean);
    if (parts.length > 0 && rootNames.has(parts[0].toLowerCase())) {
      parts = parts.slice(1);
    }
    if (parts.length === 0) continue;
    const display = parts.join('/');
    const key = display.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      dedupedPaths.push(`  - ${display}`);
    }
  }

  const langInstruction = language === 'zh'
    ? '请使用中文命名文件夹（除非该领域约定俗成使用英文名，如 GitHub、Docker、AI）。'
    : 'Use English for folder names.';

  const folderList = dedupedPaths.join('\n');
  return `You are a bookmark organization planner. Analyze the bookmarks provided and propose a clean, well-organized folder structure.

Current folder structure (for reference, you may keep, merge, or replace):
${folderList || '  (no folders yet)'}

Rules:
1. Propose 8-20 folder paths that can hold ALL the bookmarks. Not too few, not too many.
2. Use "/" as path separator. Keep hierarchy 1-2 levels deep max (e.g. "开发/前端" is OK, "开发/前端/React/组件" is too deep).
3. Merge similar/overlapping existing folders into one. Remove near-duplicates.
4. Do NOT include root folder names like "Bookmarks Bar", "Other Bookmarks", "书签栏", "其他书签".
5. ${langInstruction}
6. Think in broad, practical categories. Example categories: 开发, 设计, AI, 工具, 学习, 新闻, 娱乐, 社交, 购物, 金融, etc. You can use sub-folders like "开发/前端", "开发/后端" if there are many bookmarks in that area.
7. Provide a brief description and estimated bookmark count for each category.
8. Respond ONLY with a valid JSON array:
   [{ "path": string, "description": string, "estimatedCount": number }]`;
}

export function buildPlanUserPrompt(bookmarks: BookmarkFlat[]): string {
  // Send a summary rather than full list (could be hundreds of bookmarks)
  // Group by domain and current folder for overview
  const domainCounts = new Map<string, number>();
  const folderCounts = new Map<string, number>();
  for (const b of bookmarks) {
    try {
      const host = new URL(b.url).hostname.replace(/^www\./, '');
      domainCounts.set(host, (domainCounts.get(host) || 0) + 1);
    } catch { /* skip */ }
    const folder = b.currentFolderPath || '(root)';
    folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
  }

  // Top domains
  const topDomains = [...domainCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([domain, count]) => `  ${domain}: ${count}`)
    .join('\n');

  // Current folders
  const currentFolders = [...folderCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([folder, count]) => `  ${folder}: ${count}`)
    .join('\n');

  // Sample bookmarks (first 50 titles for context)
  const samples = bookmarks
    .slice(0, 50)
    .map((b) => `  - ${b.title} (${(() => { try { return new URL(b.url).hostname; } catch { return b.url; } })()})`)
    .join('\n');

  return `I have ${bookmarks.length} bookmarks in total. Please propose a folder structure.

Top domains:
${topDomains}

Current folder distribution:
${currentFolders}

Sample bookmarks:
${samples}

Respond with a JSON array of proposed categories.`;
}

export function parsePlanResponse(raw: string): CategoryPlanItem[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found in AI response');
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error('AI response is not an array');
  return parsed.map((item) => ({
    path: String(item.path || ''),
    description: String(item.description || ''),
    estimatedCount: item.estimatedCount ? Number(item.estimatedCount) : undefined,
  }));
}
