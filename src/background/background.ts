// Background service worker (MV3). Handles alarms, badge updates, and
// acts as a lightweight message router between popup/content/settings.

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('ace-daily-check', { periodInMinutes: 60 * 12 });
  chrome.action.setBadgeBackgroundColor({ color: '#1e90d2' });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'ace-daily-check') {
    // Lightweight ping; the popup recomputes streaks on open. This alarm
    // exists primarily so the service worker stays alive enough to support
    // future push-style reminders without requiring extra permissions.
    chrome.storage.local.set({ ace_last_alarm_check: Date.now() });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'ACE_PING') {
    sendResponse({ ok: true, ts: Date.now() });
    return true;
  }
  return false;
});

export {};
