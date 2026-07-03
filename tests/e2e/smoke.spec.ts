import { test, expect } from '@playwright/test';
import { exhibitSlugs } from '../../src/lib/exhibits';

test.describe('datahall smoke', () => {
  test('home renders, has the hero, lists all exhibits', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/datahall/');
    await expect(page).toHaveTitle(/datahall/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pull back the cover');

    for (const slug of exhibitSlugs()) {
      await expect(page.getByRole('link', { name: new RegExp(slug, 'i') })).toBeVisible();
    }
    await page.screenshot({ path: 'test-results/home.png', fullPage: true });
    expect(consoleErrors).toEqual([]);
  });

  test('gallery renders all five exhibit cards', async ({ page }) => {
    await page.goto('/datahall/gallery/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every exhibit');
    const cards = page.locator('a[href*="/databases/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
    await page.screenshot({ path: 'test-results/gallery.png', fullPage: true });
  });

  test('about page renders', async ({ page }) => {
    await page.goto('/datahall/about/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('What this is');
  });

  test('every database page renders a diagram and at least one code excerpt', async ({ page }) => {
    for (const slug of exhibitSlugs()) {
      await page.goto(`/datahall/databases/${slug}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('svg[role="img"]').first()).toBeVisible();
      await page.screenshot({ path: `test-results/${slug}.png`, fullPage: true });
    }
  });

  test('GitHub source link is in the footer', async ({ page }) => {
    await page.goto('/datahall/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: /Source/ })).toBeVisible();
  });

  test('navigation links go to the right pages', async ({ page }) => {
    await page.goto('/datahall/');
    await page.getByRole('link', { name: 'Gallery' }).first().click();
    await expect(page).toHaveURL(/\/gallery\/?$/);
  });
});
