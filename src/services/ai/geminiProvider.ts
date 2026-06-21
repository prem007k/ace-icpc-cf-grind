import { withTimeout } from '@/utils';
import { REQUEST_TIMEOUT_MS } from '@/constants';
import type { HintRequest } from '@/types';
import { buildPrompt, type AIProviderClient } from './aiProvider';

export class GeminiProvider implements AIProviderClient {
  async generateHint(req: HintRequest, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error('Missing Gemini API key. Add it in Settings.');
    }
    const prompt = buildPrompt(req);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 2048 }
        })
      }),
      REQUEST_TIMEOUT_MS
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }
    return text.trim();
  }
}
