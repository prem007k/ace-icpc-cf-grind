import { uniqueProblemId } from '@/utils';
import type { CFProblem, RecommendedProblem, TopicStats } from '@/types';

export interface RecommendationOptions {
  currentRating: number;
  solvedIds: Set<string>;
  topicStats: TopicStats[];
  limit?: number;
}

function weakTopicSet(topicStats: TopicStats[]): Set<string> {
  return new Set(
    [...topicStats]
      .filter((t) => t.attempted >= 1)
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 6)
      .map((t) => t.tag)
  );
}

export function recommendProblems(
  problems: CFProblem[],
  options: RecommendationOptions
): RecommendedProblem[] {
  const { currentRating, solvedIds, topicStats, limit = 20 } = options;
  const weakTopics = weakTopicSet(topicStats);

  const candidates = problems.filter((p) => {
    if (!p.rating) return false;
    const id = uniqueProblemId(p);
    if (solvedIds.has(id)) return false;
    const ratingDiff = Math.abs(p.rating - currentRating);
    return ratingDiff <= 400; // keep within a reasonable training window
  });

  const scored: RecommendedProblem[] = candidates.map((p) => {
    const ratingDiff = Math.abs((p.rating ?? currentRating) - currentRating);
    const proximityScore = Math.max(0, 100 - ratingDiff / 4);
    const matchedWeakTags = p.tags.filter((t) => weakTopics.has(t));
    const weaknessScore = matchedWeakTags.length * 25;
    const score = proximityScore + weaknessScore;

    let reason: string;
    if (matchedWeakTags.length > 0) {
      reason = `Targets weak topic${matchedWeakTags.length > 1 ? 's' : ''}: ${matchedWeakTags.join(', ')}, rated near your level`;
    } else if (ratingDiff <= 100) {
      reason = 'Right at your current rating — good for consistency';
    } else if ((p.rating ?? 0) > currentRating) {
      reason = 'Slightly above your level — good stretch problem';
    } else {
      reason = 'Slightly below your level — good for speed and confidence';
    }

    return { ...p, score, reason };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity constraint: avoid more than 3 recommendations sharing the exact same primary tag.
  const tagCounts = new Map<string, number>();
  const diversified: RecommendedProblem[] = [];
  for (const problem of scored) {
    const primaryTag = problem.tags[0] ?? 'misc';
    const count = tagCounts.get(primaryTag) ?? 0;
    if (count >= 3) continue;
    tagCounts.set(primaryTag, count + 1);
    diversified.push(problem);
    if (diversified.length >= limit) break;
  }

  return diversified;
}

export function dailyRecommendations(all: RecommendedProblem[]): RecommendedProblem[] {
  return all.slice(0, 4);
}

export function weeklyRecommendations(all: RecommendedProblem[]): RecommendedProblem[] {
  return all.slice(0, 20);
}
