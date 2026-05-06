const KEY_CAMPAIGNS = 'campaigns_v1';
const KEY_STATE = 'run_state_v1';

export async function getCampaigns() {
  const data = await chrome.storage.local.get(KEY_CAMPAIGNS);
  return data[KEY_CAMPAIGNS] || {};
}

export async function saveCampaign(name, payload) {
  const campaigns = await getCampaigns();
  campaigns[name] = payload;
  await chrome.storage.local.set({ [KEY_CAMPAIGNS]: campaigns });
}

export async function deleteCampaign(name) {
  const campaigns = await getCampaigns();
  delete campaigns[name];
  await chrome.storage.local.set({ [KEY_CAMPAIGNS]: campaigns });
}

export async function getRunState() {
  const data = await chrome.storage.local.get(KEY_STATE);
  return data[KEY_STATE] || null;
}

export async function setRunState(state) {
  await chrome.storage.local.set({ [KEY_STATE]: state });
}

export async function clearRunState() {
  await chrome.storage.local.remove(KEY_STATE);
}
