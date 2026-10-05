import { setupCarousels } from './carousel.mjs';
import { setupSectionNav } from './section-nav.mjs';
import { configureLinks } from './links.mjs';
import { setupSiteMenu } from './site-menu.mjs';

setupSiteMenu();
setupCarousels();
setupSectionNav();
configureLinks();
document.querySelector('#year').textContent = new Date().getFullYear();
