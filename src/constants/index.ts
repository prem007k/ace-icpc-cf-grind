export const CF_API_BASE = 'https://codeforces.com/api';

export const STORAGE_KEYS = {
  SETTINGS: 'ace_settings',
  USER_PROFILE: 'ace_user_profile',
  SUBMISSIONS_CACHE: 'ace_submissions_cache',
  RATING_CACHE: 'ace_rating_cache',
  PROBLEMSET_CACHE: 'ace_problemset_cache',
  STREAK: 'ace_streak',
  USER_INFO_CACHE: 'ace_user_info_cache'
} as const;

export const DEFAULT_SETTINGS = {
  handle: '',
  theme: 'dark' as const,
  ai: {
    provider: 'gemini' as const,
    apiKey: ''
  },
  cacheTtlMinutes: 30
};

export const RATING_BUCKETS: [number, number, string][] = [
  [0, 1199, '0-1199'],
  [1200, 1399, '1200-1399'],
  [1400, 1599, '1400-1599'],
  [1600, 1799, '1600-1799'],
  [1800, 1999, '1800-1999'],
  [2000, 2199, '2000-2199'],
  [2200, 2399, '2200-2399'],
  [2400, 2599, '2400-2599'],
  [2600, 2899, '2600-2899'],
  [2900, 9999, '2900+']
];

export const KEY_TOPICS = [
  'dp',
  'graphs',
  'greedy',
  'binary search',
  'bitmasks',
  'math',
  'data structures',
  'strings',
  'number theory',
  'combinatorics',
  'trees',
  'dfs and similar',
  'two pointers',
  'sortings',
  'implementation',
  'brute force',
  'constructive algorithms',
  'geometry'
];

export const RANK_COLORS: Record<string, string> = {
  newbie: '#808080',
  pupil: '#008000',
  specialist: '#03a89e',
  expert: '#0000ff',
  'candidate master': '#aa00aa',
  master: '#ff8c00',
  'international master': '#ff8c00',
  grandmaster: '#ff0000',
  'international grandmaster': '#ff0000',
  'legendary grandmaster': '#ff0000'
};

export const REQUEST_TIMEOUT_MS = 10000;
export const MAX_RETRIES = 2;
export const RETRY_DELAY_MS = 800;
