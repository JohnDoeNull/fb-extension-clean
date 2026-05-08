import { getCampaigns, saveCampaign, deleteCampaign, getLogs, clearLogs } from './storage.js';

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

function getForm() {
  const name = $('name').value.trim();
  const message = $('message').value;
  const targets = $('targets').value.split('\n').map(s => s.trim()).filter(Boolean);
  const delaySeconds = Math.max(10, Number($('delay').value || 90));
  return { name, message, targets, delaySeconds };
}

function setStatus(msg) { statusEl.textContent = msg; }

function formatTs(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

async function refreshLogs() {
  const logs = await getLogs();
  $('logs').textContent = logs.map((l) => `[${formatTs(l.ts)}] ${l.level.toUpperCase()} ${l.message}`).join('\n');
}

async function refreshCampaigns() {
  const campaigns = await getCampaigns();
  const select = $('campaigns');
  select.innerHTML = '';
  Object.keys(campaigns).sort().forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    select.appendChild(opt);
  });
}

$('save').addEventListener('click', async () => {
  const data = getForm();
  if (!data.name) return setStatus('Campaign name required');
  if (!data.message) return setStatus('Message required');
  if (!data.targets.length) return setStatus('At least one target URL required');
  await saveCampaign(data.name, data);
  await refreshCampaigns();
  setStatus('Campaign saved');
});

$('load').addEventListener('click', async () => {
  const name = $('campaigns').value;
  const campaigns = await getCampaigns();
  const c = campaigns[name];
  if (!c) return setStatus('Campaign not found');
  $('name').value = c.name;
  $('message').value = c.message;
  $('targets').value = c.targets.join('\n');
  $('delay').value = c.delaySeconds;
  setStatus('Campaign loaded');
});

$('delete').addEventListener('click', async () => {
  const name = $('campaigns').value;
  if (!name) return;
  await deleteCampaign(name);
  await refreshCampaigns();
  setStatus('Campaign deleted');
});

$('run').addEventListener('click', async () => {
  const data = getForm();
  if (!data.message || !data.targets.length) return setStatus('Message + targets required');
  await chrome.runtime.sendMessage({ type: 'RUN_CAMPAIGN', payload: data });
  await refreshLogs();
  setStatus('Run started');
});

$('pause').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'PAUSE_CAMPAIGN' });
  await refreshLogs();
  setStatus('Paused');
});

$('resume').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'RESUME_CAMPAIGN' });
  await refreshLogs();
  setStatus('Resumed');
});

$('paste').addEventListener('click', async () => {
  const data = getForm();
  if (!data.message) return setStatus('Message required for assisted paste');
  await chrome.runtime.sendMessage({ type: 'ASSISTED_PASTE', payload: { message: data.message } });
  await refreshLogs();
  setStatus('Paste signal sent to active tab');
});

$('clearLogs').addEventListener('click', async () => {
  await clearLogs();
  await refreshLogs();
  setStatus('Logs cleared');
});

$('openHome').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'OPEN_FB_HOME' });
  setStatus('Opened Facebook Home');
});

$('openGroups').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'OPEN_FB_GROUPS' });
  setStatus('Opened Facebook Groups');
});

$('openPages').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'OPEN_FB_PAGES' });
  setStatus('Opened Facebook Pages');
});

$('openMessages').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'OPEN_FB_MESSAGES' });
  setStatus('Opened Facebook Messages');
});

$('openFirstTarget').addEventListener('click', async () => {
  const data = getForm();
  if (!data.targets.length) return setStatus('Add at least one target URL');
  await chrome.runtime.sendMessage({ type: 'OPEN_FIRST_TARGET', payload: data });
  setStatus('Opened first target');
});

$('openAllTargets').addEventListener('click', async () => {
  const data = getForm();
  if (!data.targets.length) return setStatus('Add at least one target URL');
  await chrome.runtime.sendMessage({ type: 'OPEN_ALL_TARGETS', payload: data });
  setStatus('Opened all targets in tabs');
});

$('export').addEventListener('click', async () => {
  const campaigns = await getCampaigns();
  const blob = new Blob([JSON.stringify({ campaigns }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fb-campaigns.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus('Exported campaigns JSON');
});

$('importFile').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const text = await f.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { return setStatus('Invalid JSON file'); }
  const incoming = parsed?.campaigns;
  if (!incoming || typeof incoming !== 'object') return setStatus('Invalid campaigns format');

  for (const [name, c] of Object.entries(incoming)) {
    if (c && c.message && Array.isArray(c.targets)) {
      await saveCampaign(name, {
        name,
        message: String(c.message),
        targets: c.targets.map(String),
        delaySeconds: Math.max(10, Number(c.delaySeconds || 90))
      });
    }
  }
  await refreshCampaigns();
  setStatus('Imported campaigns');
});

refreshCampaigns();
refreshLogs();
setInterval(refreshLogs, 1500);
