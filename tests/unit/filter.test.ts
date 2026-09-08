import { describe, it, expect } from 'vitest';
import { filterExhibits } from '~/lib/filter';
import { exhibits } from '~/lib/exhibits';

describe('gallery filter', () => {
  it('returns all when no filter', () => {
    expect(filterExhibits(exhibits, {})).toHaveLength(5);
  });

  it('filters by query on name/tagline', () => {
    const res = filterExhibits(exhibits, { query: 'postgres' });
    expect(res.length).toBe(1);
    expect(res[0].slug).toBe('postgresql');
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
