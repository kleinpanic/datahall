/**
 * Invariant tests for the deterministic toy HNSW search that drives the
 * vector exhibits. The static SVG, counters, and GPU replay all render from
 * this trace, so these tests pin the teaching model: deterministic steps,
 * exact-baseline comparability, cross-layer node identity.
 */
import { describe, expect, it } from 'vitest';
import {
  buildHnsw,
  dist2,
  exactSearch,
  hnswSearch,
  recall,
  toyVectors,
  type SearchStep,
} from '../../src/lib/vector-search';

const SEED = 4242;
const graph = buildHnsw(toyVectors(SEED), SEED, { m: 3 });
const QUERY = { x: 0.5, y: 0.45 };

describe('toy dataset + graph build', () => {
  it('assigns levels so upper layers are subsets of lower ones', () => {
    for (let layer = 1; layer < graph.layers; layer++) {
      for (const id of graph.presentAt[layer]) {
        expect(graph.presentAt[0]).toContain(id);
      }
    }
    expect(graph.presentAt[graph.layers - 1]).toContain(graph.entry);
  });

  it('keeps node identity: point positions are identical wherever referenced', () => {
    for (const layer of graph.presentAt) {
      for (const id of layer) {
        expect(graph.points[id].id).toBe(id);
      }
    }
  });

  it('entry is a top-layer node and adjacency is symmetric within a layer', () => {
    expect(graph.presentAt[graph.layers - 1]).toContain(graph.entry);
    graph.adjacency.forEach((layerAdj, layer) => {
      const ids = graph.presentAt[layer];
      layerAdj.forEach((neighbors, i) => {
        for (const n of neighbors) {
          const nIdx = ids.indexOf(n);
          expect(nIdx).toBeGreaterThanOrEqual(0);
          expect(layerAdj[nIdx]).toContain(ids[i]);
        }
      });
    });
  });
});

describe('hnswSearch trace', () => {
  const trace = hnswSearch(graph, QUERY, { k: 4, ef: 16 });

  it('is deterministic: identical inputs produce an identical trace', () => {
    const again = hnswSearch(graph, QUERY, { k: 4, ef: 16 });
    expect(again).toEqual(trace);
  });

  it('opens with the entry step and closes with the result step', () => {
    expect(trace.steps[0].kind).toBe('entry');
    expect(trace.steps[trace.steps.length - 1].kind).toBe('result');
  });

  it('only uses greedy descent above the base layer and expansion on it', () => {
    for (const step of trace.steps) {
      if (step.kind === 'greedy') expect(step.layer).toBeGreaterThan(0);
      if (step.kind === 'expand') expect(step.layer).toBe(0);
    }
  });

  it('returns k results with ascending distances', () => {
    expect(trace.topK).toHaveLength(4);
    const dists = trace.topKDists;
    expect([...dists].sort((a, b) => a - b)).toEqual(dists);
  });

  it('accounts for every distance evaluation and walks real edges', () => {
    expect(trace.distanceEvaluations).toBeGreaterThanOrEqual(trace.visitedNodes.length);
    for (const hop of trace.walk) {
      const idx = graph.presentAt[hop.layer].indexOf(hop.a);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(graph.adjacency[hop.layer][idx]).toContain(hop.b);
    }
  });

  it('reaches perfect recall when the beam covers the whole base layer', () => {
    const wide = hnswSearch(graph, QUERY, { k: 4, ef: graph.presentAt[0].length + 4 });
    const exact = exactSearch(graph.points, QUERY, 4);
    expect(recall(wide.topK, exact.ids)).toBe(1);
  });

  it('honors a payload-style filter in both the walk and the result', () => {
    const filtered = hnswSearch(graph, QUERY, { k: 3, ef: 16, filter: (id) => id % 2 === 0 });
    for (const id of filtered.topK) expect(id % 2).toBe(0);
    const filteredExact = exactSearch(graph.points, QUERY, 3, (id) => id % 2 === 0);
    expect(recall(filtered.topK, filteredExact.ids)).toBe(1);
  });

  it('degraded beams still return a full result list', () => {
    const narrow = hnswSearch(graph, QUERY, { k: 3, ef: 3 });
    expect(narrow.topK).toHaveLength(3);
    expect(narrow.distanceEvaluations).toBeLessThan(24);
  });
});

describe('exactSearch baseline', () => {
  it('finds the true nearest neighbors on a hand-checkable dataset', () => {
    const pts = toyVectors(SEED, 3).map((p, i) => ({ ...p, id: i }));
    pts[0].x = 0;
    pts[0].y = 0;
    pts[1].x = 1;
    pts[1].y = 0;
    pts[2].x = 10;
    pts[2].y = 0;
    const res = exactSearch(pts, { x: 0.9, y: 0 }, 2);
    expect(res.ids).toEqual([1, 0]);
    expect(res.dists[0]).toBeCloseTo(dist2({ x: 0.9, y: 0 }, { x: 1, y: 0 }));
  });

  it('never returns more than k ids', () => {
    const res = exactSearch(graph.points, QUERY, 5);
    expect(res.ids).toHaveLength(5);
  });
});

describe('recall metric', () => {
  it('is 1 for identical lists, 0 for disjoint lists', () => {
    expect(recall([1, 2, 3], [1, 2, 3])).toBe(1);
    expect(recall([1, 2, 3], [4, 5, 6])).toBe(0);
    expect(recall([1, 2, 3], [3, 2, 9])).toBeCloseTo(2 / 3);
  });
});

describe('step narration', () => {
  it('every step carries a non-empty explanation', () => {
    const trace = hnswSearch(graph, QUERY, { k: 4, ef: 8 });
    for (const step of trace.steps as SearchStep[]) {
      expect(step.note.length).toBeGreaterThan(10);
    }
  });
});
