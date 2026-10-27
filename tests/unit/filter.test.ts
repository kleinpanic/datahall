import { describe, it, expect } from 'vitest';
import { filterExhibits, parseFilterParams } from '~/lib/filter';
import { Paradigm, DatabaseFamily } from '~/lib/schema';
import { exhibits } from '~/lib/exhibits';

describe('gallery filter', () => {
  it('returns all when no filter', () => {
    expect(filterExhibits(exhibits, {})).toHaveLength(25);
  });

  it('filters by query on name/tagline', () => {
    const res = filterExhibits(exhibits, { query: 'postgres' });
    expect(res.map((e) => e.slug).sort()).toEqual([
      'cockroachdb',
      'duckdb',
      'postgresql',
      'questdb',
      'timescaledb',
    ]);
  });

  it('filters by paradigm', () => {
    const res = filterExhibits(exhibits, { paradigm: 'server-vector' });
    expect(res.length).toBe(1);
    expect(res[0].slug).toBe('qdrant');
  });

  it('filters by family', () => {
    const res = filterExhibits(exhibits, { families: ['vector'] });
    expect(res.length).toBe(2);
    expect(res.map((e) => e.slug).sort()).toEqual(['lancedb', 'qdrant']);
  });

  it('combines query + paradigm', () => {
    const res = filterExhibits(exhibits, { query: 'wal', paradigm: 'embedded-sql' });
    expect(res.length).toBe(1);
    expect(res[0].slug).toBe('sqlite');
  });
});

describe('gallery URL params', () => {
  const P = Paradigm.options;
  const F = DatabaseFamily.options;

  it('round-trips known values', () => {
    expect(parseFilterParams('?q=wal&p=embedded-kv&f=vector,key-value', P, F)).toEqual({
      query: 'wal',
      paradigm: 'embedded-kv',
      families: ['vector', 'key-value'],
    });
  });

  it('drops unknown or selector-breaking paradigm and family values', () => {
    // Before the fix these were interpolated into querySelector and threw,
    // aborting the island; an unknown paradigm also hid every card.
    const s = parseFilterParams('?p=%22%5D%5Bx&f=vector,%22%5D,nope,vector', P, F);
    expect(s.paradigm).toBeNull();
    expect(s.families).toEqual(['vector']);
    expect(parseFilterParams('?p=not-a-paradigm', P, F).paradigm).toBeNull();
  });

  it('defaults to an empty filter', () => {
    expect(parseFilterParams('', P, F)).toEqual({ query: '', paradigm: null, families: [] });
  });

  it('every exhibit paradigm and family is a gallery chip value', () => {
    // The gallery once hard-coded its chips and omitted `embedded-kv`.
    for (const e of exhibits) {
      expect(P).toContain(e.paradigm);
      for (const fam of e.families ?? []) expect(F).toContain(fam);
    }
  });
});
