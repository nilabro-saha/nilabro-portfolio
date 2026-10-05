import { test, expect } from '@playwright/test';

test('ships themed sections, source previews, and configured external links', async ({ page }) => {
  const failed = [];
  page.on('requestfailed', request => failed.push(request.url()));
  await page.goto('/');
  await expect(page).toHaveTitle(/Nilabro Saha/);
  await expect(page.locator('#academic-work .visual-card')).toHaveCount(5);
  await expect(page.locator('#publications .publication-card')).toHaveCount(2);
  await expect(page.locator('#academic-work img[src*="seminar-"]')).toHaveCount(2);
  await expect(page.locator('[data-link-key="seminar-wearable-technology"]')).toHaveAttribute('href', 'https://doi.org/10.5281/zenodo.22843036');
  await expect(page.locator('[data-link-key="seminar-compliant-mechanisms"]')).toHaveAttribute('href', 'https://doi.org/10.5281/zenodo.22843178');
  expect(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  expect(failed).toEqual([]);
});

test('carousel progress train and controls track the active slide', async ({ page }) => {
  await page.goto('/');
  const carousel = page.locator('#highlights .carousel');
  await expect(carousel.locator('.carousel-bubble')).toHaveCount(3);
  await expect(carousel.locator('.carousel-bubble.is-active')).toHaveCount(1);
  await carousel.locator('.next').click();
  await expect(carousel.locator('.carousel-progress')).toContainText('Slide 2 of 3');
  await carousel.locator('.carousel-track').focus();
  await page.keyboard.press('ArrowRight');
  await expect(carousel.locator('.carousel-progress')).toContainText('Slide 3 of 3');
  await expect(carousel.locator('.next')).toBeDisabled();
});

test('active section updates the transparent header theme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-active-theme', 'vermilion');
  await page.locator('.site-nav a[href="#academic-work"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-active-theme', 'ivory');
  await page.locator('.site-nav a[href="#contact"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-active-theme', 'neutral');
});

test('desktop cards are centred with visible adjacent slides and separators', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1040 } });
  const page = await context.newPage();
  await page.goto('/');
  const carousel = page.locator('#academic-work .carousel');
  const geometry = await carousel.locator('.carousel-track').evaluate(track => {
    const card = track.querySelector('.slide').getBoundingClientRect();
    const bounds = track.getBoundingClientRect();
    const separator = getComputedStyle(track.querySelector('.slide'), '::after');
    return { cardCenter: card.left + card.width / 2, trackCenter: bounds.left + bounds.width / 2, separatorWidth: separator.width };
  });
  expect(Math.abs(geometry.cardCenter - geometry.trackCenter)).toBeLessThanOrEqual(2);
  expect(geometry.separatorWidth).toBe('1px');
  await context.close();
});

test('small screens place arrows beside a centred card and use an in-flow menu', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/');
  const toggle = page.locator('.menu-toggle');
  await expect(toggle).toBeVisible();
  const before = await page.locator('#highlights').evaluate(section => section.getBoundingClientRect().top);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const after = await page.locator('#highlights').evaluate(section => section.getBoundingClientRect().top);
  expect(after).toBeGreaterThan(before);
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('.site-nav a[href="#academic-work"]').click();
  const positions = await page.locator('#academic-work .carousel').evaluate(carousel => {
    const card = carousel.querySelector('.slide').getBoundingClientRect();
    const previous = carousel.querySelector('.prev').getBoundingClientRect();
    const next = carousel.querySelector('.next').getBoundingClientRect();
    return { cardCenter: card.left + card.width / 2, viewportCenter: innerWidth / 2, previousRight: previous.right, cardLeft: card.left, nextLeft: next.left, cardRight: card.right };
  });
  expect(Math.abs(positions.cardCenter - positions.viewportCenter)).toBeLessThanOrEqual(4);
  expect(positions.previousRight).toBeLessThanOrEqual(positions.cardLeft);
  expect(positions.nextLeft).toBeGreaterThanOrEqual(positions.cardRight);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await context.close();
});

test('page-wide direction keys and no-JavaScript navigation remain available', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.locator('.site-nav a[href="#academic-work"]').click();
  await page.waitForTimeout(500);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#academic-work .carousel-progress')).toContainText('Slide 2 of 5');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.section-rail [data-section-current]')).toHaveText('03');
  await page.close();

  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto('/');
  await expect(noJsPage.locator('.site-nav a[href="#academic-work"]')).toBeVisible();
  await noJs.close();
});

test('reduced motion removes animated movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.locator('#academic-work .visual-card').first().evaluate(card => getComputedStyle(card).transitionDuration);
  expect(duration).toContain('1e-05s');
});
