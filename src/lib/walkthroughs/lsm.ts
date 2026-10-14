/**
 * lsm -- Log-Structured Merge tree writes, lookups, tombstones, compaction.
 *
 * Teaching model: a memtable plus immutable sorted runs in L0 and one merged
 * L1 run, RocksDB-flavored. The trace shows the write path (WAL append +
 * memtable insert), flushes, a newest-first lookup chain, an overwrite, a
 * delete via tombstone, and a compaction that drops shadowed values and the
 * expired tombstone. Real engines differ: RocksDB flushes L0 files with
 * overlapping key ranges and compacts by level with size ratios, and its
 * tombstone garbage collection depends on the deepest level containing the
 * key (see the RocksDB exhibit's sourceRefs — rocksdb.org wiki, Merge
 * operator/compaction docs).
 *
 * Reference: O'Neil et al., "The Log-Structured Merge-Tree (LSM-Tree)" (1996).
 */

import type { WtTrace } from './types';

export type LsmVariant = 'delete' | 'overwrite';

export function lsmTrace(variant: LsmVariant = 'delete'): WtTrace {
  const common: WtTrace['steps'] = [
    {
      title: 'put(c = 5)',
      note: 'The write appends to the WAL (durability) and lands in the in-memory memtable. No disk read, no index update — this is why LSM writes are fast.',
      reveal: ['wt-lsm-wal', 'wt-lsm-mem-c5'],
    },
    {
      title: 'put(c = 7) overwrites in memory',
      note: 'The overwrite coalesces in the memtable: the older c = 5 never reaches storage. One WAL record per put, though — the log keeps both.',
      reveal: ['wt-lsm-mem-c7'],
    },
    {
      title: 'Flush → immutable run R3',
      note: 'When the memtable fills it is flushed as a sorted, immutable run. Writes go to a new file; nothing in place is ever mutated.',
      reveal: ['wt-lsm-r3'],
    },
    {
      title: 'lookup(c) — memtable hit',
      note: 'The lookup checks the memtable first: c = 7 found after touching one structure. Recency is checked first because newer values shadow older ones.',
      reveal: ['wt-lsm-lk1'],
    },
    {
      title: 'lookup(d) — miss, miss, hit',
      note: 'Memtable miss → R3 (newest run) miss → R2 hit, d = 4. Lookups may touch every level — the LSM read-amplification tradeoff.',
      reveal: ['wt-lsm-lk2'],
    },
  ];

  if (variant === 'overwrite') {
    common.push({
      title: 'lookup(a) — the shadowing rule',
      note: 'Memtable miss → R3 miss → R2 miss → R1 hit, a = 1. The newest version wins; L1’s older a is unreachable shadow.',
      reveal: ['wt-lsm-lk4'],
    });
    return {
      mode: 'lsm-overwrite',
      intro:
        'LSM write and read paths with an overwrite: puts land in WAL + memtable, flushes create immutable runs, lookups walk structures newest-first. Teaching model: RocksDB-flavored memtable + L0 runs + one merged L1 run; real level counts and compaction triggers vary by configuration.',
      steps: common,
      summary: [
        ['puts', '2'],
        ['flushes', '1'],
        ['lookup(a) structures touched', '4'],
        ['versions of a in tree', '2 (newest shadows oldest)'],
      ],
    };
  }

  return {
    mode: 'lsm-compaction',
    intro:
      'LSM write path, newest-first lookup, a delete via tombstone, and a compaction. Teaching model: RocksDB-flavored memtable + L0 runs + one merged L1 run; real engines compact by level with size ratios and keep tombstones until they cannot shadow anything older.',
    steps: [
      ...common,
      {
        title: 'delete(c) — tombstone in memtable',
        note: 'A delete writes a tombstone marker, not an edit: LSM parts are immutable, so deletes must shadow older versions until compaction removes them.',
        reveal: ['wt-lsm-mem-tomb'],
      },
      {
        title: 'Flush → run R4 (tombstone)',
        note: 'The tombstone flushes into run R4. On disk now: R4 {c = ⊥}, R3 {c = 7}, R2, R1 — newest first.',
        reveal: ['wt-lsm-r4'],
      },
      {
        title: 'lookup(c) — tombstone wins',
        note: 'Memtable miss → R4 has the tombstone: stop. “Not found (deleted)” — the older c = 7 in R3 is shadowed and never read.',
        reveal: ['wt-lsm-lk3'],
      },
      {
        title: 'Compact L0 + L1',
        note: 'Compaction merges R1–R4 with L1 in one key-sorted pass: c = 3 and c = 7 are dropped (a newer tombstone shadows them), and the tombstone itself is dropped because no older run below can hold another c.',
        reveal: ['wt-lsm-l1-after'],
      },
      {
        title: 'Result',
        note: 'Lookup cost returns to 2 structures; disk holds one version per key. Compaction trades write amplification for read speed — the LSM bargain.',
        reveal: ['wt-lsm-summary'],
      },
    ],
    summary: [
      ['puts', '2'],
      ['deletes', '1 (tombstone)'],
      ['flushes', '2'],
      ['compaction dropped', 'c = 7 (shadowed) + expired tombstone'],
      ['lookup(c) after compaction', '2 structures, not found'],
    ],
  };
}

/** Static model for the renderer: structures before and after. */
export function lsmRenderModel(): {
  memInitial: string[];
  runsInitial: Array<{ id: string; label: string; items: string[] }>;
  l1Initial: string[];
  l1After: string[];
} {
  return {
    memInitial: ['c = 5', 'c = 7', 'c = ⊥ (tombstone)'],
    runsInitial: [
      { id: 'R1', label: 'R1 (L0, oldest)', items: ['a = 1', 'c = 3'] },
      { id: 'R2', label: 'R2 (L0)', items: ['b = 2', 'd = 4'] },
    ],
    l1Initial: ['e = 9'],
    l1After: ['a = 1', 'b = 2', 'd = 4', 'e = 9'],
  };
}
