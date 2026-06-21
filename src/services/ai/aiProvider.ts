import type { HintRequest } from '@/types';

export interface AIProviderClient {
  generateHint(req: HintRequest, apiKey: string): Promise<string>;
}

export function buildPrompt(req: HintRequest): string {
  const tagList = req.problemTags.length ? req.problemTags.join(', ') : 'unknown';
  const ratingStr = req.problemRating ? `Rating: ${req.problemRating}.` : '';

  const base = `You are a competitive programming coach helping a student with a Codeforces problem.
Problem name: "${req.problemName}". Tags: ${tagList}. ${ratingStr}
Never reveal source code or pseudocode. Never write a full solution.`;

  switch (req.level) {
    case 'hint1':
      return `${base}\nGive ONE very vague, high-level hint — just enough to nudge the student's thinking, without revealing any specific technique or observation. 1-2 sentences.`;
    case 'hint2':
      return `${base}\nGive ONE more specific hint than a vague nudge — point toward the relevant idea or structure of the problem, but do not state the key insight directly. 2-3 sentences.`;
    case 'hint3':
      return `${base}\nGive a hint that nearly reveals the key observation or trick needed to solve the problem, stated clearly enough that a student who reads it should be able to find the rest of the solution themselves. Do not give code or step-by-step algorithm. 2-4 sentences.`;
    case 'approach':
      return `${base}\nDescribe the high-level approach/strategy to solve this problem (e.g. which algorithmic paradigm, what the overall plan is), without writing code, pseudocode, or a step-by-step implementation. 3-5 sentences.`;
    case 'related':
      return `${base}\nList 3-6 relevant algorithmic concepts/topics a student should know to solve this problem, each with a one-line explanation of why it's relevant. No code.`;
  }
}
