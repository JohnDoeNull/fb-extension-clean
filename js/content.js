function findComposerElement() {
  // Common editable composer targets on Facebook web.
  const selectors = [
    '[role="textbox"][contenteditable="true"]',
    'div[contenteditable="true"][data-lexical-editor="true"]',
    'textarea[aria-label*="What\'s on your mind"]',
    'textarea'
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function setComposerText(el, text) {
  if (!el) return false;
  el.focus();

  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    el.value = text;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  if (el.isContentEditable) {
    el.textContent = text;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
    return true;
  }

  return false;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'ASSISTED_PASTE') return;

  const target = findComposerElement();
  const ok = setComposerText(target, msg.message || '');

  sendResponse({ ok, found: Boolean(target) });
  return true;
});
