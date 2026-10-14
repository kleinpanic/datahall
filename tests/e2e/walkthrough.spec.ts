import { test, expect } from '@playwright/test';

/**
 * Walkthrough replay, vector playground controls, and reduced-motion
 * behavior. These specs run against the production build via the preview
 * server (see playwright.config.ts baseURL).
 */

const WALKTHROUGH_PAGES = [
  '/datahall/databases/postgresql/',
  '/datahall/databases/rocksdb/',
  '/datahall/databases/mongodb/',
  '/datahall/databases/neo4j/',
  '/datahall/databases/clickhouse/',
];

test.describe('walkthrough visuals', () => {
  for (const path of WALKTHROUGH_PAGES) {
    test(`${path}: steps forward, back, resets; summary inspectable`, async ({ page }) => {
      await page.goto(path);
      const panel = page.locator('[data-wt-panel]').first();
      await expect(panel).toBeVisible();
      const counter = panel.locator('[data-wt-counter]');
      const note = panel.locator('[data-wt-note]');

      await panel.locator('[data-ctrl="reset"]').click();
      await expect(counter).toHaveText(/^1 \//);
      const firstNote = (await note.textContent()) ?? '';

      await panel.locator('[data-ctrl="next"]').click();
      await expect(counter).toHaveText(/^2 \//);
      await expect(note).not.toHaveText(firstNote);

      await panel.locator('[data-ctrl="prev"]').click();
      await expect(counter).toHaveText(/^1 \//);

      // inspectable result/state summary (server-rendered table)
      await expect(panel.locator('table tbody tr').first()).toBeVisible();
    });
  }
});

test.describe('vector playground controls', () => {
  test('k parameter changes counters and stats on the qdrant page', async ({ page }) => {
    await page.goto('/datahall/databases/qdrant/');
    const controls = page.locator('[data-hnsw-controls]');
    await expect(controls).toBeVisible();
    await controls.locator('[data-param="k"]').fill('2');
    await expect(controls.locator('[data-kout]')).toHaveText('2');
    await expect(controls.locator('[data-hnsw-stats]')).toContainText('k=2');
  });

  test('stepping updates the narration on the qdrant page', async ({ page }) => {
    await page.goto('/datahall/databases/qdrant/');
    const controls = page.locator('[data-hnsw-controls]');
    await expect(controls).toBeVisible();
    const caption = controls.locator('[data-step-caption]');
    const before = (await caption.textContent()) ?? '';
    await controls.locator('[data-ctrl="reset"]').click();
    await expect(caption).not.toHaveText(before);
  });
});

test.describe('reduced motion', () => {
  test('gpu scene never activates; storyboard remains readable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/datahall/databases/qdrant/');
    const scene = page.locator('[data-gpu-scene]');
    await expect(scene.locator('svg[role="img"]')).toBeVisible();
    await page.waitForTimeout(800);
    expect(await scene.getAttribute('data-gpu-state')).not.toBe('on');
  });

  test('walkthrough still steps discretely (no continuous animation)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/datahall/databases/rocksdb/');
    const panel = page.locator('[data-wt-panel]').first();
    await panel.locator('[data-ctrl="reset"]').click();
    await expect(panel.locator('[data-wt-counter]')).toHaveText(/^1 \//);
    await panel.locator('[data-ctrl="next"]').click();
    await expect(panel.locator('[data-wt-counter]')).toHaveText(/^2 \//);
  });
});
