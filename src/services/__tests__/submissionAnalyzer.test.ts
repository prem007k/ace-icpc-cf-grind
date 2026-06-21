import { describe, it, expect } from 'vitest';
import { analyzeSubmissions } from '@/services/submissionAnalyzer';
import type { CFSubmission } from '@/types';

function makeSubmission(overrides: Partial<CFSubmission>): CFSubmission {
  return {
    id: Math.random(),
    creationTimeSeconds: 1700000000,
    problem: { contestId: 1, index: 'A', name: 'Test', tags: ['dp'], rating: 1200 },
    verdict: 'OK',
    programmingLanguage: 'C++',
    ...overrides
  };
}

describe('analyzeSubmissions', () => {
  it('counts unique solved problems only once', () => {
    const subs = [
      makeSubmission({ id: 1 }),
      makeSubmission({ id: 2 }), // same problem, duplicate solve
      makeSubmission({ id: 3, problem: { contestId: 2, index: 'B', name: 'Other', tags: ['greedy'], rating: 1400 } })
    ];
    const result = analyzeSubmissions(subs);
    expect(result.totalSolved).toBe(2);
  });

  it('ignores non-OK verdicts for solved count', () => {
    const subs = [makeSubmission({ verdict: 'WRONG_ANSWER' })];
    const result = analyzeSubmissions(subs);
    expect(result.totalSolved).toBe(0);
  });

  it('buckets solved problems by rating', () => {
    const subs = [makeSubmission({ problem: { contestId: 1, index: 'A', name: 'T', tags: [], rating: 1250 } })];
    const result = analyzeSubmissions(subs);
    const bucket = result.ratingBuckets.find((b) => b.bucket === '1200-1399');
    expect(bucket?.count).toBe(1);
  });
});
