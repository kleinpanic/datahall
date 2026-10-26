/**
 * Shared site constants.
 *
 * `SITE_BASE` is set at build time via the environment in `astro.config.mjs`.
 * Everything that renders an href to a static asset or a route should derive
 * its path from `SITE_BASE` so a build for `https://example.com/foo/` and a
 * build for `https://example.com/` both produce correct links.
 */

const rawBase = import.meta.env.BASE_URL ?? '/datahall/';
export const SITE_BASE: string = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export const SITE_TITLE = 'datahall';
export const SITE_TAGLINE = 'An interactive web museum for database internals.';
export const SITE_REPO = 'https://github.com/kleinpanic/datahall';
export const AUTHOR = 'datahall contributors';

export const NAV: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Home', href: '/' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About', href: '/about' },
];

/**
 * Whether a NAV href is the current page. `pathname` comes from `Astro.url`
 * and carries the base prefix (`/datahall/gallery/`), while NAV hrefs are
 * base-relative (`/gallery`), so strip the base before comparing.
 */
export function isNavActive(pathname: string, href: string, base: string = SITE_BASE): boolean {
  const prefix = base.replace(/\/$/, '');
  let path = pathname;
  if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) {
    path = path.slice(prefix.length);
  }
  path = path.replace(/\/$/, '') || '/';
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}

/** Build an absolute, base-prefixed path. */
export function withBase(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const trimmed = path.startsWith('/') ? path.slice(1) : path;
  return SITE_BASE + trimmed;
}
