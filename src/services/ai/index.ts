import type { AIProvider, HintRequest } from '@/types';
import type { AIProviderClient } from './aiProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';

export function getProviderClient(provider: AIProvider): AIProviderClient {
  switch (provider) {
    case 'gemini':
      return new GeminiProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export async function generateHint(
  provider: AIProvider,
  apiKey: string,
  req: HintRequest
): Promise<string> {
  const client = getProviderClient(provider);
  return client.generateHint(req, apiKey);
}

export type { HintRequest };
