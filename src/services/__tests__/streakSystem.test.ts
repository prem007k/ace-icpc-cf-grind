import { describe, it, expect } from 'vitest';
import { computeStreaks } from '@/services/streakSystem';
import type { CFSubmission } from '@/types';

function subAt(daysAgo: number, verdict = 'OK'): CFSubmission {
  const ts = Math.floor(Date.now() / 1000) - daysAgo * 86400;
  return {
    id: Math.random(),
    creationTimeSeconds: ts,
    problem: { contestId: 1, index: 'A', name: 'T', tags: [] },
    verdict,
    programmingLanguage: 'C++'
  };
}

describe('computeStreaks', () => {
  it('returns zero streak with no solves', () => {
    const result = computeStreaks([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it('counts consecutive day streak including today', () => {
    const subs = [subAt(0), subAt(1), subAt(2)];
    const result = computeStreaks(subs);
    expect(result.currentStreak).toBe(3);
  });

  it('breaks streak on a gap', () => {
    const subs = [subAt(0), subAt(5)];
    const result = computeStreaks(subs);
    expect(result.currentStreak).toBe(1);
  });
});
