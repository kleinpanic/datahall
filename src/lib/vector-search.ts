/**
 * vector-search -- deterministic toy HNSW search for the vector exhibits.
 *
 * Teaching model, stated plainly:
 *  - Production embeddings live in hundreds of dimensions. This module projects
 *    a synthetic point set onto 2D so the algorithm's geometry is visible. The
 *    *mechanics* (layered graph, greedy descent, beam expansion, exact baseline)
 *    are faithful to the algorithm; the 2D geometry is not representative of
 *    high-dimensional distance behavior.
 *  - Every function is pure and deterministic: same inputs produce the identical
 *    trace. The static SVG, the counters, and the GPU replay all render from the
 *    same trace, so animation can smooth movement but never changes results.
 *
 * References (see also docs/source-ledger.md):
 *  - Malkov & Yashunin, "Efficient and robust approximate nearest neighbor
 *    search using Hierarchical Navigable Small World graphs" (2016),
 *    arXiv:1603.09320 — layer assignment (§2.2), SEARCH-layered (§4.2).
 *  - Qdrant docs, Filtering — filtered HNSW variants (qdrant.tech/documentation).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface ToyVector extends Vec2 {
  id: number;
  /** Highest layer this node appears in (0 = base layer only). */
  level: number;
}

/** Deterministic 32-bit PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dist2(a: Vec2, b: Vec2): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * The toy dataset used by the exhibits: `count` vectors drawn from a seeded
 * bimodal layout so clusters and bridges are visible. `count` defaults to 24 —
 * small enough to search exhaustively, large enough that a beam search has
 * meaningful order.
 */
export function toyVectors(seed: number, count = 24): ToyVector[] {
  const rnd = mulberry32(seed);
  const pts: ToyVector[] = [];
  for (let i = 0; i < count; i++) {
    // Two clusters (left-bottom / right-top) plus a sparse bridge band.
    const pick = rnd();
    let x: number;
    let y: number;
    if (pick < 0.42) {
      x = 0.08 + rnd() * 0.3;
      y = 0.08 + rnd() * 0.3;
    } else if (pick < 0.84) {
      x = 0.62 + rnd() * 0.3;
      y = 0.62 + rnd() * 0.3;
    } else {
      x = 0.3 + rnd() * 0.4;
      y = 0.38 + rnd() * 0.24;
    }
    pts.push({ id: i, x, y, level: 0 });
  }
  return pts;
}

export interface HnswGraph {
  points: ToyVector[];
  /** Number of layers (max level + 1). */
  layers: number;
  /** presentAt[layer] = node ids that exist at that layer. */
  presentAt: number[][];
  /** adjacency[layer][id] = undirected neighbor ids within that layer. */
  adjacency: number[][][];
  /** Entry point id (a top-layer node). */
  entry: number;
}

/**
 * Simplified static HNSW build:
 *  - Level assignment follows the paper's geometric distribution
 *    (`level = floor(-ln(U) * mL)`, mL = 1/ln(M)) with a seeded PRNG.
 *  - Within each layer, every node links to its `m` nearest co-layer nodes
 *    (undirected, deduplicated). A production HNSW links *incrementally* at
 *    insert time with pruning heuristics; the static build keeps the same
 *    navigable-small-world flavor at a scale the reader can audit by eye.
 */
export function buildHnsw(
  points: ToyVector[],
  seed: number,
  opts: { m?: number; maxLevel?: number } = {},
): HnswGraph {
  const m = opts.m ?? 3;
  const maxLevel = opts.maxLevel ?? 2;
  const mL = 1 / Math.log(m);
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const levels = points.map(() => {
    const u = Math.max(rnd(), 1e-9);
    return Math.min(maxLevel, Math.floor(-Math.log(u) * mL));
  });
  const withLevels = points.map((p, i) => ({ ...p, level: levels[i] }));

  const top = Math.max(...withLevels.map((p) => p.level));
  const presentAt: number[][] = [];
  const adjacency: number[][][] = [];
  for (let layer = 0; layer <= top; layer++) presentAt[layer] = [];
  for (const p of withLevels) {
    for (let layer = 0; layer <= p.level; layer++) presentAt[layer].push(p.id);
  }

  for (let layer = 0; layer <= top; layer++) {
    const ids = presentAt[layer];
    const adj = new Map<number, number[]>();
    for (const id of ids) adj.set(id, []);
    for (const id of ids) {
      const here = withLevels[id];
      const near = ids
        .filter((other) => other !== id)
        .map((other) => ({ other, d: dist2(here, withLevels[other]) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, m);
      for (const { other } of near) {
        if (!adj.get(id)!.includes(other)) adj.get(id)!.push(other);
        if (!adj.get(other)!.includes(id)) adj.get(other)!.push(id);
      }
    }
    adjacency[layer] = ids.map((id) => adj.get(id)!);
  }

  const topLayerIds = presentAt[top];
  return {
    points: withLevels,
    layers: top + 1,
    presentAt,
    adjacency,
    entry: topLayerIds[0],
  };
}

/** One narrated, inspectable step of a search. `note` explains *why*. */
export type SearchStep =
  | { kind: 'entry'; layer: number; id: number; dist: number; note: string }
  | {
      kind: 'greedy';
      layer: number;
      from: number;
      to: number;
      dist: number;
      evaluated: number[];
      note: string;
    }
  | { kind: 'descend'; fromLayer: number; toLayer: number; id: number; note: string }
  | {
      kind: 'expand';
      layer: number;
      origin: number;
      evaluated: number[];
      kept: number[];
      note: string;
    }
  | { kind: 'terminate'; layer: number; note: string }
  | { kind: 'result'; ids: number[]; dists: number[]; note: string };

export interface SearchTrace {
  query: Vec2;
  k: number;
  ef: number;
  steps: SearchStep[];
  /** Every node whose distance was computed, in first-evaluation order. */
  visitedNodes: number[];
  distanceEvaluations: number;
  topK: number[];
  topKDists: number[];
  /** Traversed edges as [layer, fromId, toId] in walk order. */
  walk: Array<{ layer: number; a: number; b: number }>;
}

export interface SearchOptions {
  k: number;
  /** Beam width for the base layer (paper's `ef`). */
  ef: number;
  /** Optional payload-style predicate; excluded ids are never returned. */
  filter?: (id: number) => boolean;
}

/**
 * SEARCH-layered per Malkov & Yashunin §4.2, instrumented into steps:
 *  - layers above the base: greedy 1-NN descent (ef = 1);
 *  - base layer: ef-wide beam — expand the closest unexpanded candidate,
 *    evaluate its neighbors, keep the best `ef` seen, stop when the nearest
 *    unexpanded candidate is farther than the worst kept result;
 *  - the top `k` of the final beam is the answer, compared against
 *    `exactSearch` by the caller for recall.
 */
export function hnswSearch(graph: HnswGraph, query: Vec2, opts: SearchOptions): SearchTrace {
  const { k, ef, filter } = opts;
  const allowed = (id: number) => !filter || filter(id);
  const steps: SearchStep[] = [];
  const visited: number[] = [];
  const seen = new Set<number>();
  const walk: SearchTrace['walk'] = [];
  let distanceEvaluations = 0;

  const d = (id: number) => {
    distanceEvaluations++;
    if (!seen.has(id)) {
      seen.add(id);
      visited.push(id);
    }
    return dist2(query, graph.points[id]);
  };

  const top = graph.layers - 1;
  let ep = graph.entry;
  let epDist = d(ep);
  steps.push({
    kind: 'entry',
    layer: top,
    id: ep,
    dist: epDist,
    note: `Enter at node ${ep}, the highest-layer entry point (distance ${epDist.toFixed(4)}). Upper layers are tiny, so few hops cover the space.`,
  });

  for (let layer = top; layer >= 1; layer--) {
    const layerIdx = graph.presentAt[layer].indexOf(ep) >= 0 ? layer : -1;
    if (layerIdx < 0) continue;
    for (;;) {
      const idxInLayer = graph.presentAt[layer].indexOf(ep);
      const neighbors = graph.adjacency[layer][idxInLayer].filter(allowed);
      const evaluated = [...neighbors];
      let bestNeighbor = -1;
      let bestDist = epDist;
      for (const n of neighbors) {
        const dn = d(n);
        if (dn < bestDist) {
          bestDist = dn;
          bestNeighbor = n;
        }
      }
      if (bestNeighbor < 0) break;
      steps.push({
        kind: 'greedy',
        layer,
        from: ep,
        to: bestNeighbor,
        dist: bestDist,
        evaluated,
        note: `Greedy descent on layer ${layer}: of the evaluated neighbors, node ${bestNeighbor} is closest to the query — move there. Each hop multiplies the covered distance, which is why HNSW needs so few comparisons.`,
      });
      walk.push({ layer, a: ep, b: bestNeighbor });
      ep = bestNeighbor;
      epDist = bestDist;
    }
    if (layer > 1) {
      steps.push({
        kind: 'descend',
        fromLayer: layer,
        toLayer: layer - 1,
        id: ep,
        note: `Layer ${layer} is exhausted (no neighbor is closer). Drop to layer ${layer - 1}, which is denser and contains node ${ep} again — identity is preserved across layers.`,
      });
    }
  }

  // Base layer: ef-wide beam search. The filter (when present) gates what can
  // be *returned*, not what can be *traversed* — matching Qdrant's filtered
  // HNSW behavior: the walk may cross non-matching nodes, which is exactly why
  // highly selective filters need payload-aware indexing to stay fast.
  const baseIds = graph.presentAt[0];
  const baseIndexOf = new Map(baseIds.map((id, i) => [id, i]));
  const candidates: Array<{ id: number; dist: number }> = [{ id: ep, dist: epDist }];
  const results: Array<{ id: number; dist: number }> = allowed(ep)
    ? [{ id: ep, dist: epDist }]
    : [];
  const visitedBase = new Set<number>([ep]);

  while (candidates.length > 0) {
    candidates.sort((a, b) => a.dist - b.dist);
    const c = candidates.shift()!;
    const worst =
      results.length > 0
        ? results.reduce((w, r) => (r.dist > w.dist ? r : w), results[0])
        : undefined;
    if (worst && results.length >= ef && c.dist > worst.dist) {
      steps.push({
        kind: 'terminate',
        layer: 0,
        note: `Stop: the closest unexpanded candidate (node ${c.id}, ${c.dist.toFixed(4)}) is farther than the worst kept result (node ${worst.id}, ${worst.dist.toFixed(4)}). Nothing unvisited can enter the top-${k}.`,
      });
      break;
    }
    const idx = baseIndexOf.get(c.id)!;
    const neighbors = graph.adjacency[0][idx].filter((n) => !visitedBase.has(n));
    if (neighbors.length === 0) continue;
    const kept: number[] = [];
    for (const n of neighbors) {
      visitedBase.add(n);
      const dn = d(n);
      // Every evaluated neighbor joins the traversal frontier...
      candidates.push({ id: n, dist: dn });
      // ...but only filter-passing nodes can enter the result beam.
      if (allowed(n) && !results.some((r) => r.id === n)) {
        results.push({ id: n, dist: dn });
        kept.push(n);
        results.sort((a, b) => a.dist - b.dist);
        if (results.length > ef) results.pop();
      }
    }
    steps.push({
      kind: 'expand',
      layer: 0,
      origin: c.id,
      evaluated: [...neighbors],
      kept,
      note: filter
        ? `Expand node ${c.id} on the base layer: evaluate ${neighbors.length} neighbors; traverse all of them, but only filter-passing nodes (${kept.length}) can enter the result beam (ef=${ef}).`
        : `Expand node ${c.id} on the base layer: evaluate ${neighbors.length} neighbors, keep the ones that beat the current beam. The beam width ef=${ef} bounds both work and accuracy.`,
    });
  }

  results.sort((a, b) => a.dist - b.dist);
  const topK = results.slice(0, k);
  steps.push({
    kind: 'result',
    ids: topK.map((r) => r.id),
    dists: topK.map((r) => r.dist),
    note:
      topK.length === 0
        ? `No matching nodes were reachable under the filter — an empty result is a valid outcome.`
        : `Result: nodes ${topK.map((r) => r.id).join(', ')} — the k=${k} nearest of the ef=${ef} beam survivors. This is an *approximate* answer; compare it with exactSearch for recall.`,
  });

  return {
    query,
    k,
    ef,
    steps,
    visitedNodes: visited,
    distanceEvaluations,
    topK: topK.map((r) => r.id),
    topKDists: topK.map((r) => r.dist),
    walk,
  };
}

export interface ExactResult {
  ids: number[];
  dists: number[];
}

/** Brute-force k-NN baseline over all points (optionally filtered). */
export function exactSearch(
  points: ToyVector[],
  query: Vec2,
  k: number,
  filter?: (id: number) => boolean,
): ExactResult {
  const ranked = points
    .filter((p) => !filter || filter(p.id))
    .map((p) => ({ id: p.id, dist: dist2(query, p) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, k);
  return { ids: ranked.map((r) => r.id), dists: ranked.map((r) => r.dist) };
}

/** Fraction of exact top-k results that the approximate search found. */
export function recall(approx: number[], exact: number[]): number {
  if (exact.length === 0) return 1;
  const hit = new Set(approx);
  let found = 0;
  for (const id of exact) if (hit.has(id)) found++;
  return found / exact.length;
}
