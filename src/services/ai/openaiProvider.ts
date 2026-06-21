import { withTimeout } from '@/utils';
import { REQUEST_TIMEOUT_MS } from '@/constants';
import type { HintRequest } from '@/types';
import { buildPrompt, type AIProviderClient } from './aiProvider';

export class OpenAIProvider implements AIProviderClient {
  async generateHint(req: HintRequest, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error('Missing OpenAI API key. Add it in Settings.');
    }
    const prompt = buildPrompt(req);

    const res = await withTimeout(
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 300
        })
      }),
      REQUEST_TIMEOUT_MS
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('OpenAI returned an empty response.');
    }
    return text.trim();
  }
}
