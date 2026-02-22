// Custom OpenAI-compatible API
import { OpenAIService } from './openai';
import type { AIProviderConfig } from '@/shared/types';

export class CustomAIService extends OpenAIService {
  constructor(config: AIProviderConfig) {
    super(config);
  }
}
