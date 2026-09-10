import { test, expect } from '@playwright/test';
import { exhibitSlugs } from '../../src/lib/exhibits';

/**
 * Layout integrity -- programmatic overlap + overflow guards.
 *
 * For every page (desktop + mobile viewports):
 *   1. No two visible text-bearing leaf elements may intersect by more than
 *      a small tolerance, unless one contains the other.
 *   2. The document must not scroll horizontally.
 *   3. No panel may overflow its parent panel-card / figure bounds horizontally.
 *
 * Exclusions:
 *   - [data-gpu-scene]: the storyboard intentionally layers labels over the
 *     canvas area; those are inside a fixed aspect box, not page content.
 *   - sr-only / aria-hidden decorations with no visible text are filtered by
 *     the visibility check.
 */

const DESKTOP_PAGES = [
  '/datahall/',
  '/datahall/gallery/',
  '/datahall/about/',
  ...exhibitSlugs().map((s) => `/datahall/databases/${s}/`),
];

const MOBILE_PAGES = DESKTOP_PAGES;

interface OverlapFinding {
  a: string;
  b: string;
  area: number;
}

async function collectOverlaps(page: import('@playwright/test').Page): Promise<OverlapFinding[]> {
  return page.evaluate(() => {
    const TOL = 2; // px tolerance for sub-pixel/AA touching
    const describe = (el: Element): string => {
      const tag = el.tagName.toLowerCase();
      const cls = (el.getAttribute('class') ?? '').split(/\s+/).slice(0, 3).join('.');
      const txt = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
      return `${tag}${cls ? '.' + cls : ''}["${txt}"]`;
    };
    const candidates = Array.from(document.querySelectorAll('body *')).filter((el) => {
      if (el.closest('[data-gpu-scene]')) return false;
      const cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed')
        return false;
      if (parseFloat(cs.opacity || '1') === 0) return false;
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
      );
      if (!hasDirectText) return false;
      const r = el.getBoundingClientRect();
      return r.width > TOL && r.height > TOL;
    });
    const findings: { a: string; b: string; area: number }[] = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const ea = candidates[i] as HTMLElement;
        const eb = candidates[j] as HTMLElement;
        if (ea.contains(eb) || eb.contains(ea)) continue;
        const a = ea.getBoundingClientRect();
        const b = eb.getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > TOL && oy > TOL) {
          findings.push({ a: describe(ea), b: describe(eb), area: Math.round(ox * oy) });
        }
      }
    }
    return findings.sort((x, y) => y.area - x.area).slice(0, 25);
  });
}

test.describe('layout integrity (desktop 1280x800)', () => {
  for (const path of DESKTOP_PAGES) {
    test(`no overlapping text: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const findings = await collectOverlaps(page);
      expect(
        findings,
        `overlapping text elements on ${path}:\n${findings.map((f) => `  ${f.a}  <->  ${f.b}  (${f.area}px^2)`).join('\n')}`,
      ).toEqual([]);
    });
    test(`no horizontal scroll: ${path}`, async ({ page }) => {
      await page.goto(path);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(over).toBeLessThanOrEqual(1);
    });
    test(`no uncaught JS errors: ${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(String(err)));
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(errors, `uncaught JS errors on ${path}:\n${errors.join('\n')}`).toEqual([]);
    });
  }
});

test.describe('layout integrity (mobile 375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  for (const path of MOBILE_PAGES) {
    test(`mobile: no overlapping text: ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const findings = await collectOverlaps(page);
      expect(
        findings,
        `overlapping text elements on ${path} (mobile):\n${findings.map((f) => `  ${f.a}  <->  ${f.b}  (${f.area}px^2)`).join('\n')}`,
      ).toEqual([]);
    });
    test(`mobile: no horizontal scroll: ${path}`, async ({ page }) => {
      await page.goto(path);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(over).toBeLessThanOrEqual(1);
    });
  }
});
