import { KEY_TOPICS } from '@/constants';
import type { TopicStats } from '@/types';

export interface TopicStrengthResult {
  strongest: TopicStats[];
  weakest: TopicStats[];
  radarTopics: TopicStats[];
}

/**
 * Confidence score = weighted blend of solve-rate and volume,
 * so a topic with 1 solved/1 attempted doesn't outrank one with 40/50.
 */
function adjustedConfidence(stat: TopicStats): number {
  const volumeFactor = Math.min(1, stat.attempted / 15); // saturates at 15 attempts
  return Math.round(stat.confidence * (0.4 + 0.6 * volumeFactor));
}

export function computeTopicStrength(topicStats: TopicStats[]): TopicStrengthResult {
  const relevant = topicStats.filter((t) => t.attempted >= 1);
  const withAdjusted = relevant.map((t) => ({ ...t, confidence: adjustedConfidence(t) }));

  const sortedDesc = [...withAdjusted].sort((a, b) => b.confidence - a.confidence);
  const strongest = sortedDesc.slice(0, 5);
  const weakest = [...withAdjusted]
    .filter((t) => t.attempted >= 2)
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, 5);

  const radarTopics: TopicStats[] = KEY_TOPICS.map((tag) => {
    const found = topicStats.find((t) => t.tag === tag);
    return found ?? { tag, solved: 0, attempted: 0, confidence: 0 };
  });

  return { strongest, weakest, radarTopics };
}
