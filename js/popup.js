import { getCampaigns, saveCampaign, deleteCampaign } from './storage.js';

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
  setStatus('Run started');
});

$('pause').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'PAUSE_CAMPAIGN' });
  setStatus('Paused');
});

$('resume').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'RESUME_CAMPAIGN' });
  setStatus('Resumed');
});

refreshCampaigns();
