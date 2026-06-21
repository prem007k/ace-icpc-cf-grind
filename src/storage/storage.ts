import type { CachedEntry } from '@/types';

export async function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (items) => {
      resolve(items[key] as T | undefined);
    });
  });
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export async function storageRemove(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key, () => resolve());
  });
}

export async function storageClearAll(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => resolve());
  });
}

/**
 * Fetch from cache if fresh, otherwise call `fetcher`, store result, and return it.
 */
export async function getCachedOrFetch<T>(
  key: string,
  ttlMinutes: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await storageGet<CachedEntry<T>>(key);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < ttlMinutes * 60 * 1000) {
    return cached.data;
  }
  const data = await fetcher();
  await storageSet<CachedEntry<T>>(key, { data, fetchedAt: now });
  return data;
}

export async function exportAllData(): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => resolve(items));
  });
}
