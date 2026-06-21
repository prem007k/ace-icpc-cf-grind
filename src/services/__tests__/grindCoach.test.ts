import { describe, it, expect } from 'vitest';
import { buildGrindPlan } from '@/services/grindCoach';
import type { TopicStats } from '@/types';

describe('buildGrindPlan', () => {
  const topicStats: TopicStats[] = [
    { tag: 'dp', solved: 2, attempted: 10, confidence: 20 },
    { tag: 'graphs', solved: 3, attempted: 10, confidence: 30 },
    { tag: 'binary search', solved: 4, attempted: 10, confidence: 40 },
    { tag: 'greedy', solved: 9, attempted: 10, confidence: 90 }
  ];

  it('targets a higher rating than current by default', () => {
    const plan = buildGrindPlan(1450, topicStats);
    expect(plan.targetRating).toBeGreaterThan(1450);
  });

  it('selects weakest topics for the plan', () => {
    const plan = buildGrindPlan(1450, topicStats);
    expect(plan.weakTopics).toContain('dp');
    expect(plan.weakTopics).not.toContain('greedy');
  });

  it('always includes at least one contest item', () => {
    const plan = buildGrindPlan(1450, topicStats);
    expect(plan.items.some((i) => i.type === 'contest')).toBe(true);
  });
});
