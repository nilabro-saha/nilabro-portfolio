import { setupCarousels } from './carousel.mjs';
import { setupSectionNav } from './section-nav.mjs';
import { configureLinks } from './links.mjs';

setupCarousels();
setupSectionNav();
configureLinks();
document.querySelector('#year').textContent = new Date().getFullYear();
