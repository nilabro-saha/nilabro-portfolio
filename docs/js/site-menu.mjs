export function setupSiteMenu() {
  document.documentElement.classList.add('js');
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.site-nav');
  if (!header || !toggle || !menu) return;

  const close = () => {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };
  const open = () => {
    header.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation');
  };

  toggle.addEventListener('click', () => header.classList.contains('menu-open') ? close() : open());
  menu.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  document.addEventListener('pointerdown', event => {
    if (header.classList.contains('menu-open') && !header.contains(event.target)) close();
  });
}
