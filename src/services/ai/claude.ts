import type { AIProviderConfig, AIAnalysisResult, BookmarkFlat, FolderNode, CategoryPlanItem } from '@/shared/types';
import type { AIService } from './base';
import { buildSystemPrompt, buildUserPrompt, parseAIResponse, buildPlanSystemPrompt, buildPlanUserPrompt, parsePlanResponse } from './base';

export class ClaudeService implements AIService {
  constructor(private config: AIProviderConfig) {}

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey || '',
      'anthropic-version': '2023-06-01',
    };
  }

  private get baseUrl() {
    return this.config.baseUrl || 'https://api.anthropic.com';
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: 5,
          messages: [{ role: 'user', content: 'hi' }],
        }),
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
    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokensPerBatch || 4000,
        system: buildSystemPrompt(existingFolders, undefined, confirmedCategories),
        messages: [{ role: 'user', content: buildUserPrompt(bookmarks) }],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    return parseAIResponse(content);
  }

  async planCategories(
    bookmarks: BookmarkFlat[],
    existingFolders: FolderNode[],
  ): Promise<CategoryPlanItem[]> {
    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokensPerBatch || 4000,
        system: buildPlanSystemPrompt(existingFolders),
        messages: [{ role: 'user', content: buildPlanUserPrompt(bookmarks) }],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    return parsePlanResponse(content);
  }
}
