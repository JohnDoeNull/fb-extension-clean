# FB Campaign Extension (Clean)

Clean-room Chrome extension scaffold for Facebook campaign workflows.

## What this version does
- Save/load/delete local campaigns (name, message, target URLs, delay)
- Run/pause/resume campaign queue
- Opens each target URL in sequence on schedule
- Local-only storage (`chrome.storage.local`), **no external DB**
- Notifications for campaign progress
- Import/export campaigns as JSON
- Popup run logs (persisted in local storage)
- Optional assisted paste signal to active Facebook tab

## What this version does NOT do
- No license bypass/cracking logic
- No hidden scraping/bot evasion behavior
- No direct auto-post spam workflow

## Install
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `fb-extension-clean`

## Structure
- `manifest.json`
- `html/popup.html`
- `css/popup.css`
- `js/popup.js`
- `js/background.js`
- `js/content.js`
- `js/storage.js`

## Next steps (optional)
- Add localization
- Add richer validation for target URL patterns
- Add zipped release tags on GitHub
