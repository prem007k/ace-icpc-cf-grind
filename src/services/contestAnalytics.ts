import { mean, stdDev } from '@/utils';
import type { CFRatingChange, ContestAnalytics } from '@/types';

export function analyzeContests(history: CFRatingChange[]): ContestAnalytics {
  const sorted = [...history].sort(
    (a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds
  );

  const deltas = sorted.map((c) => c.newRating - c.oldRating);
  const gains = deltas.filter((d) => d > 0);
  const losses = deltas.filter((d) => d < 0);

  let bestContest: CFRatingChange | undefined;
  let worstContest: CFRatingChange | undefined;
  let bestDelta = -Infinity;
  let worstDelta = Infinity;

  for (const c of sorted) {
    const delta = c.newRating - c.oldRating;
    if (delta > bestDelta) {
      bestDelta = delta;
      bestContest = c;
    }
    if (delta < worstDelta) {
      worstDelta = delta;
      worstContest = c;
    }
  }

  return {
    bestContest,
    worstContest,
    averageGain: gains.length ? Math.round(mean(gains)) : 0,
    averageLoss: losses.length ? Math.round(mean(losses)) : 0,
    volatility: Math.round(stdDev(deltas)),
    last10: sorted.slice(-10).reverse(),
    history: sorted
  };
}
