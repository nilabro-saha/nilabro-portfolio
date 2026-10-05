import { test, expect } from '@playwright/test';

test('content, assets, and configured links are present', async ({ page }) => {
  const failed = [];
  page.on('requestfailed', request => failed.push(request.url()));
  await page.goto('/');
  await expect(page).toHaveTitle(/Nilabro Saha/);
  await expect(page.locator('#highlights .slide')).toHaveCount(3);
  await expect(page.locator('#academic-work .visual-card')).toHaveCount(3);
  await expect(page.locator('#publications .visual-card')).toHaveCount(2);
  await expect(page.locator('#academic-achievements .visual-card')).toHaveCount(6);
  await expect(page.locator('#professional-achievements .visual-card')).toHaveCount(3);
  await expect(page.locator('.section-rail')).toBeVisible();
  await expect(page.locator('[data-link-key="gear-meshing-paper"]')).toHaveAttribute('href', 'https://doi.org/10.1007/978-981-19-3716-3_51');
  await expect(page.locator('[data-link-key="contact-email"]')).toHaveAttribute('href', 'mailto:nilabrosaha2001@gmail.com');
  expect(await page.locator('a[href="#"]').count()).toBe(0);
  expect(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  expect(failed).toEqual([]);
  if (process.env.CAPTURE_SITE) {
    await page.screenshot({ path: 'test-results/highlights-desktop.png' });
    await page.locator('.site-nav a[href="#academic-work"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/academic-work-desktop.png' });
    await page.locator('.site-nav a[href="#academic-achievements"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/academic-achievements-desktop.png' });
  }
});

test('carousel buttons and keyboard navigate grouped highlights', async ({ page }) => {
  await page.goto('/');
  const carousel = page.locator('#highlights .carousel');
  await carousel.locator('.next').click();
  await expect(carousel.locator('.carousel-count')).toContainText('02');
  await carousel.locator('.carousel-track').focus();
  await page.keyboard.press('ArrowRight');
  await expect(carousel.locator('.carousel-count')).toContainText('03');
  await expect(carousel.locator('.next')).toBeDisabled();
});

test('mobile page has no viewport overflow and touch-visible evidence links', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.section-rail')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.locator('.site-nav a[href="#academic-work"]').click();
  const headerBottom = await page.locator('.site-header').evaluate(header => header.getBoundingClientRect().bottom);
  await expect.poll(() => page.locator('#academic-work h2').evaluate(title => title.getBoundingClientRect().top)).toBeLessThan(headerBottom + 150);
  const titleTop = await page.locator('#academic-work h2').evaluate(title => title.getBoundingClientRect().top);
  expect(titleTop).toBeGreaterThanOrEqual(headerBottom - 1);
  await expect(page.locator('#academic-work [data-link-key="exoskeleton-thesis"]')).toBeVisible();
  const pillOpacity = await page.locator('#academic-work .media-links').first().evaluate(pills => getComputedStyle(pills).opacity);
  expect(pillOpacity).toBe('1');
  if (process.env.CAPTURE_SITE) {
    await page.screenshot({ path: 'test-results/academic-work-mobile.png' });
  }
  await context.close();
});

test('desktop section rail moves between sections and respects boundaries', async ({ page }) => {
  await page.goto('/');
  const rail = page.locator('.section-rail');
  await expect(rail.locator('[data-section-previous]')).toBeDisabled();
  await rail.locator('[data-section-next]').click();
  await expect(rail.locator('[data-section-current]')).toHaveText('02');
  await expect.poll(() => page.locator('#academic-work h2').evaluate(title => title.getBoundingClientRect().top)).toBeGreaterThanOrEqual(100);
  for (const expected of ['03', '04', '05', '06']) {
    await rail.locator('[data-section-next]').click();
    await expect(rail.locator('[data-section-current]')).toHaveText(expected);
  }
  await expect(rail.locator('[data-section-next]')).toBeDisabled();
});

test('active cards have a safe left expansion gutter', async ({ page }) => {
  await page.goto('/');
  const bounds = await page.locator('#academic-work .carousel-track').evaluate(track => {
    const card = track.querySelector('.visual-card');
    const trackBox = track.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();
    return { cardLeft: cardBox.left, trackLeft: trackBox.left };
  });
  expect(bounds.cardLeft - bounds.trackLeft).toBeGreaterThan(0);
});

test('desktop carousel centers active cards and exposes real adjacent cards', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1040 } });
  const page = await context.newPage();
  await page.goto('/');
  const carousel = page.locator('#academic-work .carousel');
  const centered = async () => carousel.locator('.carousel-track').evaluate(track => {
    const active = track.querySelector('.slide.is-active').getBoundingClientRect();
    const bounds = track.getBoundingClientRect();
    return { activeCenter: active.left + active.width / 2, trackCenter: bounds.left + bounds.width / 2 };
  });

  let position = await centered();
  expect(Math.abs(position.activeCenter - position.trackCenter)).toBeLessThanOrEqual(2);

  await carousel.locator('.next').click();
  await expect(carousel.locator('.carousel-count')).toContainText('02');
  await page.waitForTimeout(500);
  position = await centered();
  expect(Math.abs(position.activeCenter - position.trackCenter)).toBeLessThanOrEqual(2);

  const previews = await carousel.locator('.carousel-track').evaluate(track => {
    const bounds = track.getBoundingClientRect();
    const [previous, active, next] = [...track.querySelectorAll('.slide')].map(slide => slide.getBoundingClientRect());
    return { previousRight: previous.right, activeLeft: active.left, activeRight: active.right, nextLeft: next.left, trackLeft: bounds.left, trackRight: bounds.right };
  });
  expect(previews.previousRight).toBeGreaterThan(previews.trackLeft);
  expect(previews.activeLeft).toBeGreaterThan(previews.trackLeft);
  expect(previews.activeRight).toBeLessThan(previews.trackRight);
  expect(previews.nextLeft).toBeLessThan(previews.trackRight);
  await context.close();
});

test('focused carousel direction keys navigate cards and major sections', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav a[href="#academic-work"]').click();
  await page.waitForTimeout(500);
  const academicTrack = page.locator('#academic-work .carousel-track');
  await academicTrack.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#academic-work .carousel-count')).toContainText('02');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#academic-work .carousel-count')).toContainText('01');

  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#publications .carousel-track')).toBeFocused();
  await expect(page.locator('.section-rail [data-section-current]')).toHaveText('03');
  await page.keyboard.press('ArrowUp');
  await expect(academicTrack).toBeFocused();
  await expect(page.locator('.section-rail [data-section-current]')).toHaveText('02');

  await page.locator('.site-nav a[href="#professional-achievements"]').click();
  await page.waitForTimeout(500);
  await page.locator('#professional-achievements .carousel-track').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#contact-title')).toBeFocused();
});

test('page-wide direction keys navigate the active section without carousel focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('.site-nav a[href="#academic-work"]').click();
  await page.waitForTimeout(500);
  await page.locator('#academic-work h2').click();
  await expect(page.locator('#academic-work .carousel-track')).not.toBeFocused();

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#academic-work .carousel-count')).toContainText('02');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#publications .carousel-track')).toBeFocused();
  await expect(page.locator('.section-rail [data-section-current]')).toHaveText('03');
});

test('desktop sections fit a full card and its controls at the compact breakpoint', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 840 } });
  const page = await context.newPage();
  await page.goto('/');
  for (const id of ['highlights', 'academic-work', 'publications', 'academic-achievements', 'professional-achievements']) {
    await page.locator(`.site-nav a[href="#${id}"]`).click();
    await page.waitForTimeout(500);
    const heading = page.locator(`#${id} h1, #${id} h2`).first();
    await expect.poll(() => heading.evaluate(title => title.getBoundingClientRect().top)).toBeLessThan(260);
    await expect.poll(() => heading.evaluate(title => title.getBoundingClientRect().top)).toBeGreaterThanOrEqual(100);
    const bounds = await page.locator(`#${id}`).evaluate(section => {
      const card = section.querySelector('.slide').getBoundingClientRect();
      const controls = section.querySelector('.carousel-footer').getBoundingClientRect();
      return { cardBottom: card.bottom, controlsBottom: controls.bottom, viewportHeight: window.innerHeight };
    });
    expect(bounds.cardBottom, `${id} card`).toBeLessThanOrEqual(bounds.viewportHeight);
    expect(bounds.controlsBottom, `${id} controls`).toBeLessThanOrEqual(bounds.viewportHeight);
    if (process.env.CAPTURE_SITE) {
      await page.screenshot({ path: `test-results/${id}-fitted-desktop.png` });
    }
  }
  await context.close();
});

test('content remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByText('Underactuated', { exact: false }).first()).toBeVisible();
  await expect(page.locator('#publications h2')).toHaveText('Publications.');
  await context.close();
});

test('reduced motion removes animated card movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const duration = await page.locator('#academic-work .visual-card').first().evaluate(card => getComputedStyle(card).transitionDuration);
  expect(duration).toContain('1e-05s');
});
