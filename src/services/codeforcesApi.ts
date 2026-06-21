import { CF_API_BASE, MAX_RETRIES, REQUEST_TIMEOUT_MS, RETRY_DELAY_MS } from '@/constants';
import { retry, withTimeout } from '@/utils';
import type { CFApiResponse, CFRatingChange, CFSubmission, CFUser, CFProblem } from '@/types';

// Request deduplication: in-flight identical requests share one promise.
const inFlight = new Map<string, Promise<unknown>>();

async function rawFetch<T>(url: string): Promise<T> {
  if (inFlight.has(url)) {
    return inFlight.get(url) as Promise<T>;
  }

  const exec = retry(
    async () => {
      const res = await withTimeout(fetch(url), REQUEST_TIMEOUT_MS);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} requesting Codeforces API`);
      }
      const json: CFApiResponse<T> = await res.json();
      if (json.status !== 'OK') {
        throw new Error(json.comment ?? 'Codeforces API returned an error');
      }
      return json.result;
    },
    MAX_RETRIES,
    RETRY_DELAY_MS
  ).finally(() => {
    inFlight.delete(url);
  });

  inFlight.set(url, exec);
  return exec;
}

export class CodeforcesApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CodeforcesApiError';
  }
}

export async function fetchUserInfo(handle: string): Promise<CFUser> {
  if (!handle || !/^[a-zA-Z0-9_.-]{3,24}$/.test(handle)) {
    throw new CodeforcesApiError('Invalid Codeforces handle format.');
  }
  try {
    const result = await rawFetch<CFUser[]>(
      `${CF_API_BASE}/user.info?handles=${encodeURIComponent(handle)}`
    );
    if (!result?.length) {
      throw new CodeforcesApiError(`Handle "${handle}" not found.`);
    }
    return result[0];
  } catch (err) {
    throw mapError(err, handle);
  }
}

export async function fetchUserSubmissions(handle: string): Promise<CFSubmission[]> {
  try {
    return await rawFetch<CFSubmission[]>(
      `${CF_API_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`
    );
  } catch (err) {
    throw mapError(err, handle);
  }
}

export async function fetchUserRatingHistory(handle: string): Promise<CFRatingChange[]> {
  try {
    return await rawFetch<CFRatingChange[]>(
      `${CF_API_BASE}/user.rating?handle=${encodeURIComponent(handle)}`
    );
  } catch (err) {
    throw mapError(err, handle);
  }
}

export async function fetchProblemset(): Promise<CFProblem[]> {
  try {
    const result = await rawFetch<{ problems: CFProblem[] }>(
      `${CF_API_BASE}/problemset.problems`
    );
    return result.problems;
  } catch (err) {
    throw mapError(err);
  }
}

function mapError(err: unknown, handle?: string): Error {
  const msg = err instanceof Error ? err.message : 'Unknown error';
  if (/not found/i.test(msg)) {
    return new CodeforcesApiError(`Handle "${handle}" was not found on Codeforces.`);
  }
  if (/timed out/i.test(msg)) {
    return new CodeforcesApiError('Codeforces API request timed out. Please try again.');
  }
  if (/limit/i.test(msg)) {
    return new CodeforcesApiError('Codeforces API rate limit reached. Please wait a moment.');
  }
  return new CodeforcesApiError(msg || 'Codeforces API is currently unavailable.');
}
