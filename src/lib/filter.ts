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
