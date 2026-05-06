import { setRunState, getRunState, clearRunState, addLog } from './storage.js';

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

  const { idx, targets, delaySeconds } = state;
  if (idx >= targets.length) {
    await addLog('Campaign completed', 'success');
    await notify('FB Campaign', 'Campaign completed');
    await clearRunState();
    chrome.alarms.clear(ALARM_NAME);
    return;
  }

  const url = targets[idx];
  await chrome.tabs.create({ url });

  const msg = `Opened target ${idx + 1}/${targets.length}: ${url}`;
  await addLog(msg, 'info');
  await notify('FB Campaign', `Opened target ${idx + 1}/${targets.length}`);

  await setRunState({ ...state, idx: idx + 1, nextAt: Date.now() + delaySeconds * 1000 });
  chrome.alarms.create(ALARM_NAME, { when: Date.now() + delaySeconds * 1000 });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === 'RUN_CAMPAIGN') {
      const { targets, message, delaySeconds, name } = msg.payload;
      await setRunState({ status: 'running', idx: 0, targets, message, delaySeconds, name: name || 'unnamed', nextAt: Date.now() });
      await addLog(`Campaign started: ${name || 'unnamed'} (${targets.length} targets)`, 'success');
      chrome.alarms.create(ALARM_NAME, { when: Date.now() + 200 });
      await notify('FB Campaign', 'Campaign started');
    }

    if (msg.type === 'PAUSE_CAMPAIGN') {
      const state = await getRunState();
      if (state) {
        await setRunState({ ...state, status: 'paused' });
        await addLog('Campaign paused', 'warn');
      }
      chrome.alarms.clear(ALARM_NAME);
      await notify('FB Campaign', 'Campaign paused');
    }

    if (msg.type === 'RESUME_CAMPAIGN') {
      const state = await getRunState();
      if (state) {
        await setRunState({ ...state, status: 'running' });
        await addLog('Campaign resumed', 'success');
        chrome.alarms.create(ALARM_NAME, { when: Date.now() + 200 });
        await notify('FB Campaign', 'Campaign resumed');
      }
    }

    if (msg.type === 'ASSISTED_PASTE') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, { type: 'ASSISTED_PASTE', message: msg.payload?.message || '' });
        await addLog('Sent assisted paste message to active tab', 'info');
      }
    }

    sendResponse({ ok: true });
  })().catch(async (err) => {
    await addLog(`Error: ${String(err?.message || err)}`, 'error');
    sendResponse({ ok: false, error: String(err?.message || err) });
  });
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) tick();
});
