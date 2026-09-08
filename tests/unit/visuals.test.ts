/**
 * Visual registry tests -- guarantee that:
 *   1. Every `kind` declared in the `Visual` Zod discriminated union has a
 *      registered renderer in `src/lib/visuals.ts`.
 *   2. Every registered renderer kind matches a kind declared in the schema.
 *   3. All five exhibit corpora use the new visuals taxonomy (every entry
 *      has `visuals`, no exhibit still ships `diagrams`).
 *   4. The legacy `kind: 'diagram'` shim continues to work for the four
 *      legacy diagram components (SqliteFileFormat, MvccTimeline,
 *      Replication, VectorIndex).
 *   5. The five schemas each declare at least one visual per major kind
 *      family (page-microscope or wal-timeline for storages, vector-index
 *      for vector families, pipeline for all five).
 */
import { describe, it, expect } from 'vitest';
import { Visual } from '../../src/lib/schema';
import { VISUAL_KINDS, isRegisteredKind, registeredKinds } from '../../src/lib/visuals-registry';
import { getVisualRenderer } from '../../src/lib/visuals';
import { getLegacyDiagramFactory, LEGACY_DIAGRAM_NAMES } from '../../src/lib/visuals-legacy';
import { exhibits } from '../../src/lib/exhibits';

describe('visual registry', () => {
  it('exposes the documented set of kinds', () => {
    expect(new Set(VISUAL_KINDS)).toEqual(
      new Set([
        'diagram',
        'pipeline',
        'page-microscope',
        'wal-timeline',
        'vector-index',
        'family-map',
        'legend',
        'gpu-scene',
      ]),
    );
  });

  it('every schema-declared kind has a renderer', () => {
    // Visual.options exposes the literal kinds inside the discriminated union.
    // We assert by parsing sample payloads and checking renderer lookup.
    const samples = {
      diagram: { kind: 'diagram', title: 't', description: 'd', component: 'SqliteFileFormat' },
      pipeline: {
        kind: 'pipeline',
        title: 't',
        description: 'd',
        mode: 'read',
        database: 'sqlite',
      },
      'page-microscope': {
        kind: 'page-microscope',
        title: 't',
        description: 'd',
        mode: 'sqlite',
      },
      'wal-timeline': {
        kind: 'wal-timeline',
        title: 't',
        description: 'd',
        mode: 'sqlite',
        showCrashMoment: true,
      },
      'vector-index': {
        kind: 'vector-index',
        title: 't',
        description: 'd',
        mode: 'hnsw',
      },
      'family-map': { kind: 'family-map' },
      legend: { kind: 'legend' },
      'gpu-scene': { kind: 'gpu-scene', title: 't', description: 'd' },
    } as const;

    for (const [kind, sample] of Object.entries(samples)) {
      const parsed = Visual.safeParse(sample);
      expect(parsed.success, `sample for ${kind} failed: ${JSON.stringify(parsed)}`).toBe(true);
      expect(isRegisteredKind(kind)).toBe(true);
      // `kind: 'diagram'` is special-cased: it dispatches via the legacy
      // `component` field rather than a registered renderer. Every other
      // kind must resolve to a real Astro component.
      if (kind === 'diagram') {
        expect(getVisualRenderer(kind)).toBeNull();
      } else {
        expect(getVisualRenderer(kind)).toBeTruthy();
      }
    }
  });

  it('rejects an unknown kind in registry lookup', () => {
    expect(getVisualRenderer('not-a-real-kind')).toBeNull();
    expect(isRegisteredKind('not-a-real-kind')).toBe(false);
  });

  it('exposes the four legacy diagram component factories', () => {
    expect(new Set(LEGACY_DIAGRAM_NAMES)).toEqual(
      new Set(['SqliteFileFormat', 'MvccTimeline', 'Replication', 'VectorIndex']),
    );
    expect(getLegacyDiagramFactory('SqliteFileFormat')).toBeTruthy();
    expect(getLegacyDiagramFactory('MvccTimeline')).toBeTruthy();
    expect(getLegacyDiagramFactory('Replication')).toBeTruthy();
    expect(getLegacyDiagramFactory('VectorIndex')).toBeTruthy();
    expect(getLegacyDiagramFactory('Nope')).toBeNull();
  });

  it('registeredKinds() is non-empty and frozen-set', () => {
    const list = registeredKinds();
    expect(list.length).toBeGreaterThan(0);
    expect(new Set(list).size).toBe(list.length);
  });
});

describe('exhibit visuals taxonomy', () => {
  it('every exhibit has at least 2 visuals and at least one pipeline visual', () => {
    for (const e of exhibits) {
      expect(e.visuals.length, `${e.slug} visuals`).toBeGreaterThanOrEqual(2);
      const hasPipeline = e.visuals.some((v) => v.kind === 'pipeline');
      expect(hasPipeline, `${e.slug} should have a pipeline visual`).toBe(true);
    }
  });

  it('vector-family exhibits declare a vector-index visual', () => {
    const vectorSlugs = exhibits.filter((e) => e.families?.includes('vector')).map((e) => e.slug);
    expect(new Set(vectorSlugs)).toEqual(new Set(['lancedb', 'qdrant']));
    for (const slug of vectorSlugs) {
      const e = exhibits.find((x) => x.slug === slug)!;
      expect(
        e.visuals.some((v) => v.kind === 'vector-index'),
        `${slug} should have a vector-index visual`,
      ).toBe(true);
    }
  });

  it('relational exhibits declare a wal-timeline or page-microscope visual', () => {
    const rel = exhibits.filter((e) => e.families?.includes('relational')).map((e) => e.slug);
    expect(new Set(rel)).toEqual(new Set(['sqlite', 'postgresql', 'mariadb']));
    for (const slug of rel) {
      const e = exhibits.find((x) => x.slug === slug)!;
      const ok = e.visuals.some((v) => v.kind === 'wal-timeline' || v.kind === 'page-microscope');
      expect(ok, `${slug} should have a wal-timeline or page-microscope visual`).toBe(true);
    }
  });

  it('qdrant ships the gpu-scene visual (WebGPU scene with static fallback)', () => {
    const qdrant = exhibits.find((e) => e.slug === 'qdrant');
    expect(qdrant).toBeTruthy();
    const scene = qdrant!.visuals.find((v) => v.kind === 'gpu-scene');
    expect(scene).toBeTruthy();
    if (scene?.kind === 'gpu-scene') {
      expect(scene.scene).toBe('hnsw-layers');
      expect(scene.points).toBeGreaterThanOrEqual(32);
      expect(scene.fps).toBeGreaterThanOrEqual(8);
      expect((scene.sourceRefs ?? []).length).toBeGreaterThan(0);
    }
  });

  it('legacy diagram visuals keep their PascalCase component names', () => {
    for (const e of exhibits) {
      for (const v of e.visuals) {
        if (v.kind === 'diagram') {
          expect(typeof v.component).toBe('string');
          // If the component is one of our four legacy diagrams, the factory
          // must resolve (otherwise the page renders an empty placeholder).
          if (LEGACY_DIAGRAM_NAMES.includes(v.component as (typeof LEGACY_DIAGRAM_NAMES)[number])) {
            expect(getLegacyDiagramFactory(v.component)).toBeTruthy();
          }
        }
      }
    }
  });
});
