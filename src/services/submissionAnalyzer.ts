import { RATING_BUCKETS } from '@/constants';
import { mean, monthKey, uniqueProblemId } from '@/utils';
import type { CFSubmission, RatingBucketStats, SubmissionAnalysis, TopicStats } from '@/types';

export function analyzeSubmissions(submissions: CFSubmission[]): SubmissionAnalysis {
  const solvedIds = new Set<string>();
  const solvedProblems: { rating?: number; tags: string[] }[] = [];
  const attemptedTagCounts = new Map<string, number>();
  const solvedTagCounts = new Map<string, number>();
  const monthlyMap = new Map<string, number>();

  for (const sub of submissions) {
    const pid = uniqueProblemId(sub.problem);
    for (const tag of sub.problem.tags) {
      attemptedTagCounts.set(tag, (attemptedTagCounts.get(tag) ?? 0) + 1);
    }
    if (sub.verdict === 'OK' && !solvedIds.has(pid)) {
      solvedIds.add(pid);
      solvedProblems.push({ rating: sub.problem.rating, tags: sub.problem.tags });
      for (const tag of sub.problem.tags) {
        solvedTagCounts.set(tag, (solvedTagCounts.get(tag) ?? 0) + 1);
      }
      const mk = monthKey(sub.creationTimeSeconds);
      monthlyMap.set(mk, (monthlyMap.get(mk) ?? 0) + 1);
    }
  }

  const ratingBuckets: RatingBucketStats[] = RATING_BUCKETS.map(([lo, hi, label]) => ({
    bucket: label,
    count: solvedProblems.filter((p) => p.rating !== undefined && p.rating >= lo && p.rating <= hi)
      .length
  }));

  const topicStats: TopicStats[] = Array.from(attemptedTagCounts.entries())
    .map(([tag, attempted]) => {
      const solved = solvedTagCounts.get(tag) ?? 0;
      const confidence = attempted === 0 ? 0 : Math.round((solved / attempted) * 100);
      return { tag, solved, attempted, confidence };
    })
    .sort((a, b) => b.solved - a.solved);

  const ratedSolved = solvedProblems.filter((p) => typeof p.rating === 'number');
  const averageRating = Math.round(mean(ratedSolved.map((p) => p.rating as number)));

  const monthlyActivity = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, solved]) => ({ month, solved }));

  return {
    totalSolved: solvedIds.size,
    totalSubmissions: submissions.length,
    ratingBuckets,
    topicStats,
    averageRating: Number.isNaN(averageRating) ? 0 : averageRating,
    monthlyActivity,
    solvedProblemIds: solvedIds
  };
}
