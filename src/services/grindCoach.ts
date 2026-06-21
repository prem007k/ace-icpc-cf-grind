import type { GrindPlan, GrindPlanItem, TopicStats } from '@/types';

function defaultTarget(current: number): number {
  if (current < 1200) return 1200;
  if (current < 1400) return 1400;
  if (current < 1600) return 1600;
  if (current < 1900) return 1900;
  if (current < 2100) return 2100;
  return current + 200;
}

export function buildGrindPlan(
  currentRating: number,
  topicStats: TopicStats[],
  targetRating?: number
): GrindPlan {
  const target = targetRating ?? defaultTarget(currentRating);
  const ratingGap = Math.max(0, target - currentRating);

  const relevant = topicStats.filter((t) => t.attempted >= 1);
  const sortedByConfidence = [...relevant].sort((a, b) => a.confidence - b.confidence);
  const weakTopics = sortedByConfidence.slice(0, 3).map((t) => t.tag);
  const strongTopics = sortedByConfidence
    .slice(-3)
    .reverse()
    .map((t) => t.tag);

  const items: GrindPlanItem[] = [];

  // Problem quota scales with gap size: bigger gap => more volume.
  const problemsPerWeakTopic = ratingGap >= 300 ? 6 : ratingGap >= 150 ? 4 : 3;

  for (const topic of weakTopics) {
    items.push({
      type: 'problem',
      description: `Solve ${problemsPerWeakTopic} problems tagged "${topic}" near rating ${currentRating}`,
      topic,
      targetRating: currentRating
    });
  }

  if (weakTopics.length > 0) {
    items.push({
      type: 'topic-review',
      description: `Review core concepts and editorial patterns for: ${weakTopics.join(', ')}`
    });
  }

  const contestCount = ratingGap >= 300 ? 4 : ratingGap >= 150 ? 3 : 2;
  items.push({
    type: 'contest',
    description: `Participate in ${contestCount} rated contests (Div. 2/3/4 as appropriate) and upsolve unsolved problems within 48 hours`
  });

  items.push({
    type: 'problem',
    description: `Solve 3 problems rated ${currentRating + 100}-${currentRating + 200} to push your comfort zone`,
    targetRating: currentRating + 150
  });

  const estimatedWeeks = Math.max(2, Math.round(ratingGap / 60));

  return {
    currentRating,
    targetRating: target,
    weakTopics,
    strongTopics,
    items,
    estimatedWeeks
  };
}
