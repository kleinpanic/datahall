import { test, expect } from '@playwright/test';

// Regressions for links that ignored the `/datahall/` base path and for
// gallery state restored from the (untrusted) query string.
test.describe('base path and gallery params', () => {
  test('/databases/ redirects to the gallery under the base path', async ({ page }) => {
    await page.goto('/datahall/databases/');
    await expect(page).toHaveURL(/\/datahall\/gallery\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every exhibit');
  });

  test('favicon resolves under the base path', async ({ page, request }) => {
    await page.goto('/datahall/');
    const href = await page.locator('link[rel="icon"]').getAttribute('href');
    expect(href).toBe('/datahall/favicon.svg');
    expect((await request.get(href!)).status()).toBe(200);
  });

  test('current nav item is marked aria-current', async ({ page }) => {
    await page.goto('/datahall/gallery/');
    const nav = page.getByRole('banner').getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Gallery' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  test('embedded-kv paradigm chip filters to RocksDB', async ({ page }) => {
    await page.goto('/datahall/gallery/');
    await page.locator('.paradigm-chip[data-paradigm="embedded-kv"]').click();
    await expect(page.locator('#results-count')).toHaveText(/Showing 1 of/);
    await expect(page.locator('.gallery-card:visible')).toHaveAttribute('data-slug', 'rocksdb');
  });

  test('malformed filter params are ignored, not fatal', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/datahall/gallery/?q=postgres&p=%22%5D&f=%22%5D,vector');
    expect(errors).toEqual([]);
    // q still applies; the bogus p is dropped; only the valid family is active.
    await expect(page.locator('#gallery-search')).toHaveValue('postgres');
    await expect(page.locator('.paradigm-chip.active')).toHaveCount(0);
    await expect(page.locator('.family-chip.active')).toHaveCount(1);
    await page.locator('#gallery-search').fill('');
    await expect(page.locator('#results-count')).toHaveText(/Showing 2 of/);
  });
});
