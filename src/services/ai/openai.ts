import type { AIProviderConfig, AIAnalysisResult, BookmarkFlat, FolderNode, CategoryPlanItem } from '@/shared/types';
import type { AIService } from './base';
import { buildSystemPrompt, buildUserPrompt, parseAIResponse, buildPlanSystemPrompt, buildPlanUserPrompt, parsePlanResponse } from './base';

export class OpenAIService implements AIService {
  constructor(protected config: AIProviderConfig) {}

  protected get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };
  }

  protected get baseUrl() {
    return this.config.baseUrl || 'https://api.openai.com/v1';
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
        return { ok: false, message: err?.error?.message || `HTTP ${res.status}` };
      }
      return { ok: true, message: 'Connection successful' };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  async analyzeBatch(
    bookmarks: BookmarkFlat[],
    existingFolders: FolderNode[],
    confirmedCategories?: string[],
  ): Promise<AIAnalysisResult[]> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: buildSystemPrompt(existingFolders, undefined, confirmedCategories) },
          { role: 'user', content: buildUserPrompt(bookmarks) },
        ],
        temperature: 0.2,
        max_tokens: this.config.maxTokensPerBatch || 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    return parseAIResponse(content);
  }

  async planCategories(
    bookmarks: BookmarkFlat[],
    existingFolders: FolderNode[],
  ): Promise<CategoryPlanItem[]> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: buildPlanSystemPrompt(existingFolders) },
          { role: 'user', content: buildPlanUserPrompt(bookmarks) },
        ],
        temperature: 0.3,
        max_tokens: this.config.maxTokensPerBatch || 4000,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    return parsePlanResponse(content);
  }
}
