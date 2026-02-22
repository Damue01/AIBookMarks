// Ollama exposes an OpenAI-compatible /v1 API
import { OpenAIService } from './openai';
import type { AIProviderConfig } from '@/shared/types';

export class OllamaService extends OpenAIService {
  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'http://localhost:11434/v1',
      apiKey: config.apiKey || 'ollama', // Ollama doesn't require a real key
    });
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const base = this.config.baseUrl?.replace(/\/v1$/, '') || 'http://localhost:11434';
      const res = await fetch(`${base}/api/tags`);
      if (!res.ok) return { ok: false, message: `HTTP ${res.status}` };
      const data = await res.json();
      const models: string[] = (data.models || []).map((m: { name: string }) => m.name);
      return {
        ok: true,
        message: `Connected. Available models: ${models.join(', ') || 'none'}`,
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'Cannot connect to Ollama. Is it running?',
      };
    }
  }
}
