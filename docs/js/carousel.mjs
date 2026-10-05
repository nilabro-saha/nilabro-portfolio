const sectionLinks = () => [...document.querySelectorAll('.site-nav a[href^="#"]')];

function focusDestination(section) {
  const focusTarget = section?.querySelector('.carousel-track') ?? section?.querySelector('h1, h2');
  if (!focusTarget) return;
  if (!focusTarget.matches('.carousel-track')) focusTarget.tabIndex = -1;
  focusTarget.focus({ preventScroll: true });
}

function moveSection(section, direction) {
  const links = sectionLinks();
  const currentIndex = links.findIndex(link => link.getAttribute('href') === `#${section?.id}`);
  const destinationLink = links[currentIndex + direction];
  if (!destinationLink) return false;
  const destination = document.querySelector(destinationLink.getAttribute('href'));
  focusDestination(destination);
  destinationLink.click();
  return true;
}

function moveCarousel(section, direction) {
  const selector = direction > 0 ? '.carousel-arrow.next' : '.carousel-arrow.prev';
  const control = section?.querySelector(`[data-carousel] ${selector}`);
  if (!control || control.disabled) return false;
  control.click();
  return true;
}

function isEditableTarget(target) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable]'));
}

function setupPageDirectionKeys() {
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
    const activeLink = document.querySelector('.site-nav a[aria-current="location"]');
    const section = activeLink && document.querySelector(activeLink.getAttribute('href'));
    if (!section) return;

    if (event.key === 'ArrowRight' && moveCarousel(section, 1)) event.preventDefault();
    if (event.key === 'ArrowLeft' && moveCarousel(section, -1)) event.preventDefault();
    if (event.key === 'ArrowDown') { event.preventDefault(); moveSection(section, 1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveSection(section, -1); }
  });
}

function setupCarousel(carousel) {
  const track = carousel.querySelector('.carousel-track');
  const slides = [...track.querySelectorAll('.slide')];
  const previous = carousel.querySelector('.carousel-arrow.prev');
  const next = carousel.querySelector('.carousel-arrow.next');
  const count = carousel.querySelector('.carousel-count');
  let active = 0;
  let frame = 0;

  const update = () => {
    const left = track.scrollLeft;
    const viewportCenter = left + track.clientWidth / 2;
    active = slides.reduce((best, slide, index) =>
      Math.abs(slide.offsetLeft - track.offsetLeft + slide.offsetWidth / 2 - viewportCenter) <
      Math.abs(slides[best].offsetLeft - track.offsetLeft + slides[best].offsetWidth / 2 - viewportCenter) ? index : best, 0);
    slides.forEach((slide, index) => slide.classList.toggle('is-active', index === active));
    count.innerHTML = `${String(active + 1).padStart(2, '0')} <span>/ ${String(slides.length).padStart(2, '0')}</span>`;
    previous.disabled = active === 0;
    next.disabled = active === slides.length - 1;
  };

  const goTo = index => {
    const target = slides[Math.max(0, Math.min(slides.length - 1, index))];
    const centeredLeft = target.offsetLeft - track.offsetLeft - (track.clientWidth - target.offsetWidth) / 2;
    const maxLeft = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: Math.max(0, Math.min(centeredLeft, maxLeft)), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goTo(active + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(active - 1); }
    if (event.key === 'ArrowDown') { event.preventDefault(); moveSection(track.closest('section[id]'), 1); }
    if (event.key === 'ArrowUp') { event.preventDefault(); moveSection(track.closest('section[id]'), -1); }
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

export function setupCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
  setupPageDirectionKeys();
}
