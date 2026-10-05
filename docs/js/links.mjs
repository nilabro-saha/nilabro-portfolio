const KEY_PATTERN = /^[a-z]+(?:-[a-z0-9]+)*$/;

function safeUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'mailto:' ? url.href : null;
  } catch {
    return null;
  }
}

export async function configureLinks() {
  const anchors = [...document.querySelectorAll('[data-link-key]')];
  let config;
  try {
    const response = await fetch(new URL('../config.json', import.meta.url));
    if (!response.ok) throw new Error(`Configuration request failed: ${response.status}`);
    config = await response.json();
    if (!config || Array.isArray(config) || typeof config !== 'object') throw new Error('Link configuration must be an object');
  } catch (error) {
    console.error('Links could not be loaded:', error);
    anchors.forEach(anchor => { anchor.hidden = true; });
    return;
  }

  for (const anchor of anchors) {
    const key = anchor.dataset.linkKey;
    if (!KEY_PATTERN.test(key)) {
      console.warn(`Invalid link key: ${key}`);
      anchor.hidden = true;
      continue;
    }
    const href = safeUrl(config[key]);
    if (!href) {
      anchor.hidden = true;
      continue;
    }
    anchor.href = href;
    if (href.startsWith('https:')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  }
}
