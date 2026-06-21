import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/constants';
import { storageGet, storageSet } from '@/storage/storage';
import type { AppSettings } from '@/types';

export async function getSettings(): Promise<AppSettings> {
  const stored = await storageGet<AppSettings>(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored, ai: { ...DEFAULT_SETTINGS.ai, ...stored?.ai } };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await storageSet(STORAGE_KEYS.SETTINGS, settings);
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated: AppSettings = {
    ...current,
    ...partial,
    ai: { ...current.ai, ...partial.ai }
  };
  await saveSettings(updated);
  return updated;
}
