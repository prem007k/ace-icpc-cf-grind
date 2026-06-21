import { dateKey } from '@/utils';
import type { CFSubmission, StreakData } from '@/types';

export function computeStreaks(submissions: CFSubmission[]): StreakData {
  const solveDateSet = new Set<string>();
  for (const sub of submissions) {
    if (sub.verdict === 'OK') {
      solveDateSet.add(dateKey(sub.creationTimeSeconds));
    }
  }
  const solveDates = Array.from(solveDateSet).sort();

  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate: Date | null = null;

  for (const ds of solveDates) {
    const current = new Date(ds);
    if (prevDate) {
      const diffDays = Math.round((current.getTime() - prevDate.getTime()) / 86400000);
      runningStreak = diffDays === 1 ? runningStreak + 1 : 1;
    } else {
      runningStreak = 1;
    }
    longestStreak = Math.max(longestStreak, runningStreak);
    prevDate = current;
  }

  // Current streak: walk backwards from today (or yesterday, to allow for "today not yet solved").
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);

  // Allow the streak to still count if today has no solve yet but yesterday did.
  if (!solveDateSet.has(dateKey(Math.floor(today.getTime() / 1000)))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (solveDateSet.has(dateKey(Math.floor(cursor.getTime() / 1000)))) {
    currentStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weeklyActivity: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(Math.floor(d.getTime() / 1000));
    weeklyActivity.push(solveDateSet.has(key) ? 1 : 0);
  }

  return {
    currentStreak,
    longestStreak,
    lastSolveDate: solveDates.length ? solveDates[solveDates.length - 1] : null,
    solveDates,
    weeklyActivity
  };
}

export function motivationalMessage(streak: StreakData): string {
  if (streak.currentStreak === 0) {
    return 'No active streak yet — solve a problem today to start one!';
  }
  if (streak.currentStreak >= streak.longestStreak && streak.currentStreak >= 3) {
    return `New personal best! ${streak.currentStreak}-day streak and counting.`;
  }
  if (streak.currentStreak >= 7) {
    return `Incredible consistency — ${streak.currentStreak} days in a row. Keep the momentum!`;
  }
  return `${streak.currentStreak}-day streak. Solve something today to keep it alive.`;
}
