import { describe, it, expect } from 'vitest';
import { DatabaseEntry, Paradigm, ConcurrencyModel, StorageModel } from '../../src/lib/schema';
import { exhibits, getExhibit, exhibitSlugs } from '../../src/lib/exhibits';

describe('DatabaseEntry schema', () => {
  it('exposes the 5 expected enums', () => {
    expect(Paradigm.options).toContain('embedded-sql');
    expect(ConcurrencyModel.options).toContain('mvcc');
    expect(StorageModel.options).toContain('single-file-btree');
    expect(StorageModel.options).toContain('vector-columnar');
  });

  it('rejects a bad slug', () => {
    const bad = DatabaseEntry.safeParse({
      slug: 'Not_Kebab',
      name: 'X',
      tagline: 't',
      summary: 's'.repeat(60),
      paradigm: 'embedded-sql',
      concurrency: 'multi-process-mvcc',
      storage: 'single-file-btree',
      language: 'C',
      initialRelease: 2000,
      license: 'X',
      highlights: [{ label: 'a', value: 'b' }],
      features: [{ title: 'a', detail: 'b' }],
      sections: [{ heading: 'h', paragraphs: ['p'] }],
      diagrams: [{ component: 'X', title: 't', description: 'd' }],
    });
    expect(bad.success).toBe(false);
  });

  it('rejects a missing field', () => {
    const result = DatabaseEntry.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('exhibit corpus', () => {
  it('contains exactly five exhibits', () => {
    expect(exhibits).toHaveLength(5);
  });

  it('exposes unique slugs', () => {
    const slugs = exhibitSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('exposes the five expected slugs', () => {
    expect(new Set(exhibitSlugs())).toEqual(
      new Set(['sqlite', 'postgresql', 'mariadb', 'lancedb', 'qdrant']),
    );
  });

  it('every exhibit is sorted by initialRelease ascending', () => {
    for (let i = 1; i < exhibits.length; i++) {
      expect(exhibits[i]!.initialRelease).toBeGreaterThanOrEqual(exhibits[i - 1]!.initialRelease);
    }
  });

  it('every exhibit has at least 2 highlights, 2 features, 2 sections, 1 diagram', () => {
    for (const e of exhibits) {
      expect(e.highlights.length).toBeGreaterThanOrEqual(2);
      expect(e.features.length).toBeGreaterThanOrEqual(2);
      expect(e.sections.length).toBeGreaterThanOrEqual(2);
      expect(e.diagrams.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every exhibit summary is at least 40 characters', () => {
    for (const e of exhibits) {
      expect(e.summary.length).toBeGreaterThanOrEqual(40);
    }
  });

  it('getExhibit returns the matching entry and undefined for unknown', () => {
    expect(getExhibit('sqlite')?.name).toBe('SQLite');
    expect(getExhibit('does-not-exist')).toBeUndefined();
  });
});
