export function setupSectionNav() {
  const links = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const previous = document.querySelector('[data-section-previous]');
  const next = document.querySelector('[data-section-next]');
  const currentCounter = document.querySelector('[data-section-current]');
  const currentLabel = document.querySelector('[data-section-label]');
  let currentIndex = 0;

  const moveTo = index => {
    currentIndex = Math.max(0, Math.min(sections.length - 1, index));
    const section = sections[currentIndex];
    const offset = document.querySelector('.site-header').offsetHeight;
    const top = section.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const update = index => {
    currentIndex = index;
    const label = links[index].textContent.trim();
    links.forEach((link, linkIndex) => {
      if (linkIndex === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    currentCounter.textContent = String(index + 1).padStart(2, '0');
    currentLabel.textContent = `Current section: ${label}`;
    previous.disabled = index === 0;
    next.disabled = index === sections.length - 1;
  };

  links.forEach((link, index) => link.addEventListener('click', event => {
    event.preventDefault();
    moveTo(index);
  }));
  previous.addEventListener('click', () => moveTo(currentIndex - 1));
  next.addEventListener('click', () => moveTo(currentIndex + 1));
  update(0);
  if (!('IntersectionObserver' in window)) return;
  const visible = new Map();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => visible.set(entry.target.id, entry.intersectionRatio));
    const current = [...visible.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const index = sections.findIndex(section => section.id === current);
    if (index !== -1) update(index);
  }, { rootMargin: '-10% 0px -25% 0px', threshold: [0, .1, .25, .5, .75] });
  sections.forEach(section => observer.observe(section));
}
