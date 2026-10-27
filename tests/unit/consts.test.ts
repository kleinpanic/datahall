import { describe, it, expect } from 'vitest';
import { isNavActive } from '~/consts';

describe('isNavActive', () => {
  it('matches pages under a non-root base', () => {
    // Astro.url.pathname includes the base; NAV hrefs do not.
    expect(isNavActive('/datahall/gallery/', '/gallery', '/datahall/')).toBe(true);
    expect(isNavActive('/datahall/about', '/about', '/datahall/')).toBe(true);
    expect(isNavActive('/datahall/', '/', '/datahall/')).toBe(true);
    expect(isNavActive('/datahall', '/', '/datahall/')).toBe(true);
  });

  it('does not mark unrelated pages active', () => {
    expect(isNavActive('/datahall/gallery/', '/', '/datahall/')).toBe(false);
    expect(isNavActive('/datahall/databases/sqlite/', '/gallery', '/datahall/')).toBe(false);
    expect(isNavActive('/datahall/galleryx/', '/gallery', '/datahall/')).toBe(false);
  });

  it('works with a root base', () => {
    expect(isNavActive('/gallery/', '/gallery', '/')).toBe(true);
    expect(isNavActive('/', '/', '/')).toBe(true);
  });
});
