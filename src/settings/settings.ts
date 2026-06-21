import { getSettings, saveSettings } from '@/services/settingsService';
import { exportAllData, storageClearAll } from '@/storage/storage';
import type { AISettings, AppSettings } from '@/types';

const handleInput = document.getElementById('handle') as HTMLInputElement;
const themeSelect = document.getElementById('theme') as HTMLSelectElement;
const providerSelect = document.getElementById('provider') as HTMLSelectElement;
const apiKeyInput = document.getElementById('apikey') as HTMLInputElement;
const ttlInput = document.getElementById('ttl') as HTMLInputElement;
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const clearCacheBtn = document.getElementById('clear-cache') as HTMLButtonElement;
const exportBtn = document.getElementById('export-data') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

function applyTheme(theme: 'dark' | 'light') {
  document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
}

function showStatus(message: string) {
  statusEl.textContent = message;
  setTimeout(() => {
    statusEl.textContent = '';
  }, 2500);
}

async function init() {
  const settings = await getSettings();
  handleInput.value = settings.handle;
  themeSelect.value = settings.theme;
  providerSelect.value = settings.ai.provider;
  apiKeyInput.value = settings.ai.apiKey;
  ttlInput.value = String(settings.cacheTtlMinutes);
  applyTheme(settings.theme);
}

themeSelect.addEventListener('change', () => {
  applyTheme(themeSelect.value as 'dark' | 'light');
});

saveBtn.addEventListener('click', async () => {
  const ai: AISettings = {
    provider: providerSelect.value as AISettings['provider'],
    apiKey: apiKeyInput.value.trim()
  };
  const settings: AppSettings = {
    handle: handleInput.value.trim(),
    theme: themeSelect.value as 'dark' | 'light',
    ai,
    cacheTtlMinutes: Math.max(5, Math.min(1440, Number(ttlInput.value) || 30))
  };
  await saveSettings(settings);
  showStatus('Settings saved!');
});

clearCacheBtn.addEventListener('click', async () => {
  await storageClearAll();
  showStatus('Cache cleared. Reload the popup to start fresh.');
  void init();
});

exportBtn.addEventListener('click', async () => {
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ace-icpc-cf-grind-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

void init();
