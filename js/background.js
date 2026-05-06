import { setRunState, getRunState, clearRunState } from './storage.js';

const ALARM_NAME = 'fb_campaign_tick';

async function notify(title, message) {
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/128.png',
    title,
    message
  });
}

async function tick() {
  const state = await getRunState();
  if (!state || state.status !== 'running') return;

  const { idx, targets, message, delaySeconds } = state;
  if (idx >= targets.length) {
    await notify('FB Campaign', 'Campaign completed');
    await clearRunState();
    chrome.alarms.clear(ALARM_NAME);
    return;
  }

  const url = targets[idx];
  // Open target URL for manual/assisted posting workflow.
  await chrome.tabs.create({ url });

  await notify('FB Campaign', `Opened target ${idx + 1}/${targets.length}`);

  await setRunState({ ...state, idx: idx + 1, nextAt: Date.now() + delaySeconds * 1000 });
  chrome.alarms.create(ALARM_NAME, { when: Date.now() + delaySeconds * 1000 });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === 'RUN_CAMPAIGN') {
      const { targets, message, delaySeconds } = msg.payload;
      await setRunState({ status: 'running', idx: 0, targets, message, delaySeconds, nextAt: Date.now() });
      chrome.alarms.create(ALARM_NAME, { when: Date.now() + 200 });
      await notify('FB Campaign', 'Campaign started');
    }
    if (msg.type === 'PAUSE_CAMPAIGN') {
      const state = await getRunState();
      if (state) await setRunState({ ...state, status: 'paused' });
      chrome.alarms.clear(ALARM_NAME);
      await notify('FB Campaign', 'Campaign paused');
    }
    if (msg.type === 'RESUME_CAMPAIGN') {
      const state = await getRunState();
      if (state) {
        await setRunState({ ...state, status: 'running' });
        chrome.alarms.create(ALARM_NAME, { when: Date.now() + 200 });
        await notify('FB Campaign', 'Campaign resumed');
      }
    }
    sendResponse({ ok: true });
  })();
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) tick();
});
