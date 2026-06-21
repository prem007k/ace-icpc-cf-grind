// Codeforces API types

export interface CFUser {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
  maxRank?: string;
  contribution: number;
  friendOfCount: number;
  organization?: string;
  country?: string;
  city?: string;
  avatar?: string;
  titlePhoto?: string;
  registrationTimeSeconds: number;
}

export interface CFProblem {
  contestId?: number;
  index?: string;
  name: string;
  rating?: number;
  tags: string[];
  points?: number;
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem: CFProblem;
  verdict?: string;
  programmingLanguage: string;
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFApiResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result: T;
}

// Derived analytics types

export interface RatingBucketStats {
  bucket: string; // e.g. "1200-1399"
  count: number;
}

export interface TopicStats {
  tag: string;
  solved: number;
  attempted: number;
  confidence: number; // 0-100
}

export interface SubmissionAnalysis {
  totalSolved: number;
  totalSubmissions: number;
  ratingBuckets: RatingBucketStats[];
  topicStats: TopicStats[];
  averageRating: number;
  monthlyActivity: { month: string; solved: number }[];
  solvedProblemIds: Set<string>;
}

export interface GrindPlanItem {
  type: 'problem' | 'contest' | 'topic-review';
  description: string;
  topic?: string;
  targetRating?: number;
}

export interface GrindPlan {
  currentRating: number;
  targetRating: number;
  weakTopics: string[];
  strongTopics: string[];
  items: GrindPlanItem[];
  estimatedWeeks: number;
}

export interface RecommendedProblem extends CFProblem {
  score: number;
  reason: string;
}

export interface ContestAnalytics {
  bestContest?: CFRatingChange;
  worstContest?: CFRatingChange;
  averageGain: number;
  averageLoss: number;
  volatility: number;
  last10: CFRatingChange[];
  history: CFRatingChange[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSolveDate: string | null;
  solveDates: string[]; // ISO date strings, unique per day
  weeklyActivity: number[]; // last 7 days, count per day
}

export type AIProvider = 'gemini' | 'openai';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
}

export interface AppSettings {
  handle: string;
  theme: 'light' | 'dark';
  ai: AISettings;
  cacheTtlMinutes: number;
}

export interface HintRequest {
  problemName: string;
  problemTags: string[];
  problemRating?: number;
  statementExcerpt?: string;
  level: 'hint1' | 'hint2' | 'hint3' | 'approach' | 'related';
}

export interface CachedEntry<T> {
  data: T;
  fetchedAt: number;
}
