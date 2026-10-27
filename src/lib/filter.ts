/**
 * Client-side filter for the gallery.
 * Pure function, fully unit-testable.
 */
import type { DatabaseEntry, Paradigm, DatabaseFamily } from './schema';

export interface GalleryFilter {
  query?: string;
  paradigm?: Paradigm | null;
  families?: DatabaseFamily[] | null;
}

/** Gallery island state, as round-tripped through the URL query string. */
export interface FilterState {
  query: string;
  paradigm: string | null;
  families: string[];
}

/**
 * Parse `?q=&p=&f=` from a gallery URL. The query string is untrusted input:
 * `p` and `f` values are kept only when they appear in the allowed lists
 * (the rendered chips), so unknown or malformed values are dropped instead
 * of reaching selectors or hiding every card.
 */
export function parseFilterParams(
  search: string,
  allowedParadigms: ReadonlyArray<string>,
  allowedFamilies: ReadonlyArray<string>,
): FilterState {
  const params = new URLSearchParams(search);
  const p = params.get('p');
  const families = (params.get('f') ?? '')
    .split(',')
    .filter((fam, i, all) => allowedFamilies.includes(fam) && all.indexOf(fam) === i);
  return {
    query: params.get('q') ?? '',
    paradigm: p && allowedParadigms.includes(p) ? p : null,
    families,
  };
}

export function filterExhibits(
  exhibits: ReadonlyArray<DatabaseEntry>,
  filter: GalleryFilter,
): DatabaseEntry[] {
  const q = (filter.query ?? '').trim().toLowerCase();
  const p = filter.paradigm ?? null;
  const f = filter.families ?? null;

  return exhibits.filter((e) => {
    // paradigm exact match
    if (p && e.paradigm !== p) return false;

    // families: every selected family must be present (AND)
    if (f && f.length > 0) {
      const hasAll = f.every((fam) => (e.families ?? []).includes(fam));
      if (!hasAll) return false;
    }

    if (!q) return true;

    const hay = [e.name, e.tagline, e.summary, ...e.highlights.map((h) => h.label + ' ' + h.value)]
      .join(' ')
      .toLowerCase();

    return hay.includes(q);
  });
}
