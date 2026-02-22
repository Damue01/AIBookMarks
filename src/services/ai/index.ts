import type { AIProviderConfig } from '@/shared/types';
import type { AIService } from './base';
import { OpenAIService } from './openai';
import { ClaudeService } from './claude';
import { OllamaService } from './ollama';
import { CustomAIService } from './custom';

export { type AIService } from './base';

export function createAIService(config: AIProviderConfig): AIService {
  switch (config.provider) {
    case 'openai':
      return new OpenAIService(config);
    case 'claude':
      return new ClaudeService(config);
    case 'ollama':
      return new OllamaService(config);
    case 'custom':
      return new CustomAIService(config);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
