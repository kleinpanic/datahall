/**
 * skiplist -- skip-list memtable operations as a deterministic trace.
 *
 * Teaching model: the skip list inside an LSM memtable (RocksDB-flavored),
 * 3 levels, six keys with fixed heights. The trace walks a real search path
 * level by level (greedy right, then drop), inserts key 42 with a promoted
 * height, and links it at both levels. In the real engine the insert height
 * comes from coin flips — expected O(log n) — and the whole structure is
 * flushed to an SST as one sorted run.
 *
 * Reference: Pugh (1990), "Skip Lists: A Probabilistic Alternative to
 * Balanced Trees"; rocksdb.org wiki, MemTable.
 */

import type { WtTrace } from './types';

export const SKIP_KEYS = [12, 23, 34, 45, 56, 67];
/** Deterministic heights: 12→3, 23→1, 34→2, 45→1, 56→2, 67→1. */
export const SKIP_HEIGHTS: Record<number, number> = { 12: 3, 23: 1, 34: 2, 45: 1, 56: 2, 67: 1 };

/** Keys present at one level, in order. */
export function skipLevelKeys(level: number): number[] {
  return SKIP_KEYS.filter((k) => SKIP_HEIGHTS[k] > level);
}

export interface SkipRenderModel {
  levels: Array<{ level: number; keys: number[] }>;
  newNode: { key: number; height: number };
  searchPath: Array<{ level: number; from: number | 'head'; to: number | null }>;
}

/** Static render model: level rows plus the search path for key 42. */
export function skipRenderModel(): SkipRenderModel {
  return {
    levels: [2, 1, 0].map((level) => ({ level, keys: skipLevelKeys(level) })),
    newNode: { key: 42, height: 2 },
    searchPath: [
      { level: 2, from: 'head', to: 12 },
      { level: 2, from: 12, to: null },
      { level: 1, from: 12, to: 34 },
      { level: 1, from: 34, to: null },
      { level: 0, from: 34, to: 45 },
    ],
  };
}

export function skipListTrace(flavor: 'lsm' | 'redis' = 'lsm'): WtTrace {
  const lsmIntro =
    'The memtable inside an LSM engine is a skip list: sorted keys held at random heights, so a search greedily hops right on high levels and drops down only when it must. Teaching model: 3 levels, six keys, fixed heights; the real engine draws heights from coin flips and keeps write order via a single writer.';
  const redisIntro =
    'A Redis sorted set is a skip list: members held at random heights ordered by score, so ZRANGE and ZRANK hop right on high levels and drop down only when they must. Teaching model: 3 levels, six members, fixed heights; the real engine draws heights from coin flips.';
  const flushNote =
    flavor === 'lsm'
      ? 'Search visited 5 nodes across 3 levels instead of scanning 7. The memtable remains a live sorted map until it fills — then the flush (see the LSM walkthrough) freezes it into an SST.'
      : 'Search visited 5 nodes across 3 levels instead of scanning 7. The zset stays a live sorted structure — persistence is the AOF/RDB story at the server level, not a flush.';
  return {
    mode: 'skiplist-memtable',
    intro: flavor === 'lsm' ? lsmIntro : redisIntro,
    steps: [
      {
        title: 'Search 42 — start at the top',
        note: 'The search enters at the highest level. Greedy rule: move right while the next key is smaller than 42. From the head, node 12 is the first (and only) stop on L2.',
        reveal: ['wt-sl-l2-12', 'wt-sl-hop-2-head'],
      },
      {
        title: 'L2 exhausted — drop to L1',
        note: '42 > 12 and nothing follows 12 on L2, so the search drops to L1 at node 12. Each drop multiplies the candidates considered — this is where the logarithmic search comes from.',
        reveal: ['wt-sl-l1-12'],
      },
      {
        title: 'L1: hop 12 → 34, stop before 56',
        note: '34 < 42 so advance; 56 > 42 so stop. Node 34 is the closest key below 42 on L1 — the insertion point is somewhere right of it.',
        reveal: ['wt-sl-l1-34', 'wt-sl-hop-1-12-34'],
      },
      {
        title: 'L0: 34 → 45 finds the gap',
        note: 'On the base level 45 > 42 stops the scan: the gap is (34, 45). Base-level scans are short because higher levels did the coarse work.',
        reveal: ['wt-sl-l0-34', 'wt-sl-l0-45', 'wt-sl-hop-0-34-45'],
      },
      {
        title: 'insert(42) — coin flips say height 2',
        note: 'The new node gets a height from repeated coin flips: 42 lands on levels 0 and 1. Expected O(log n) search comes precisely from these random heights — no rebalancing, ever.',
        reveal: ['wt-sl-new-0', 'wt-sl-new-1'],
      },
      {
        title: 'Link at both levels',
        note: 'L0: 34 → 42 → 45. L1: 34 → 42 → 56. Two pointer swaps per level. The memtable stays sorted, so a later flush emits one sorted run directly.',
        reveal: ['wt-sl-link-0', 'wt-sl-link-1'],
      },
      {
        title: 'Result',
        note: flushNote,
        reveal: ['wt-sl-summary'],
      },
    ],
    summary: [
      ['search path', 'head → L2:12 → L1:34 → L0: gap (34, 45)'],
      ['nodes visited', '5 of 7'],
      ['new node 42', 'height 2 (levels 0 + 1)'],
      ['pointer swaps', '4'],
      ['flush', 'memtable → sorted SST run'],
    ],
  };
}
