import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'rocksdb',
  name: 'RocksDB',
  tagline: 'An embedded LSM key-value engine built for flash and in-memory workloads.',
  summary:
    'RocksDB is an embedded persistent key-value store derived from LevelDB and tuned for fast storage. Writes append to a WAL and a memtable; flushes produce immutable SST runs; background compaction merges them by level. It is a library, not a server: the process embedding it owns persistence and recovery.',
  paradigm: 'embedded-kv',
  concurrency: 'single-writer-mvcc',
  storage: 'log-structured',
  families: ['key-value', 'lsm-log-structured'],
  deploymentModel: 'embedded',
  storageEngines: ['lsm-tree'],
  indexTypes: ['btree', 'hash'],
  workloads: ['oltp', 'embedded'],
  language: 'C++',
  initialRelease: 2011,
  license: 'GPL-2.0 / Apache-2.0',
  accent: '#5cffb1',
  highlights: [
    { label: 'Write path', value: 'WAL + memtable → immutable SST' },
    { label: 'Read path', value: 'memtable → L0 → lower levels, newest first' },
    { label: 'Compaction', value: 'leveled, size-tiered, FIFO' },
    { label: 'Embedded', value: 'library, no server process' },
  ],
  features: [
    {
      title: 'Log-structured storage',
      detail:
        'Every write lands in a WAL and the active memtable. Full memtables are flushed as sorted string tables (SSTs); existing files are never edited in place.',
    },
    {
      title: 'Column families',
      detail:
        'Keyspaces are grouped into column families, each with its own memtables and SST trees but sharing the WAL — independent write workloads without cross-family interference.',
    },
    {
      title: 'Tunable everything',
      detail:
        'Write buffer sizes, level counts, compaction style, block cache, and bloom-filter bits per key are configuration, which is why RocksDB anchors so many storage products.',
    },
    {
      title: 'Single-writer MVCC',
      detail:
        'Writes serialize through one write thread by default; readers see consistent memtable/SST state via sequence numbers. A transaction API adds optimistic and pessimistic modes.',
    },
  ],
  sections: [
    {
      heading: 'The write path is an append',
      paragraphs: [
        'A put appends one record to the WAL and one entry to the active memtable, then returns. The memtable is a skiplist keyed by user key with a sequence number, so repeated puts to the same key coalesce in memory and only the newest version eventually survives compaction.',
        'When the memtable reaches its write-buffer size it becomes immutable, a new memtable takes over, and a background flush sorts it into an L0 SST file. Flushes never rewrite existing files — immutability is what makes recovery and concurrency simple.',
      ],
      code: '# rocksdb write path, conceptually\nput(key, value):\n  wal.append(seq, key, value)\n  memtable.insert(seq, key, value)\n  if memtable.full(): schedule_flush()',
      codeLanguage: 'text',
    },
    {
      heading: 'The read path pays for that',
      paragraphs: [
        'A get consults, in order: the active memtable, immutable memtables awaiting flush, L0 files newest-first, then each lower level. The first version of the key found wins; a tombstone stops the search with "not found". Bloom filters per SST skip files that cannot contain the key.',
        'This newest-first chain is LSM read amplification: a lookup may touch many structures. Compaction exists to bound it — lower levels hold fewer, larger runs covering disjoint key ranges.',
      ],
    },
    {
      heading: 'Compaction: the LSM bargain',
      paragraphs: [
        'Leveled compaction merges overlapping L0 files plus a key range of the next level, dropping shadowed versions and expired tombstones, and rewriting the result as new files. The cost shows up as write amplification: one logical write may be rewritten several times across levels.',
        'The walkthrough below traces one key through memtable, flush, tombstone, and compaction end to end. Distinguish this embedded engine from a database server: RocksDB has no query language, no network protocol, and no replica logic of its own — engines like Cassandra and (historically) CockroachDB embed it or its ideas.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'gpu-scene',
      title: 'RocksDB — LSM strata field (live GPU scene)',
      description:
        'A live WebGPU particle field tinted to this exhibit. Plays only with WebGPU and no reduced-motion preference; a static storyboard renders for everyone else.',
      scene: 'hnsw-layers',
      points: 420,
      seed: 4211,
      fps: 30,
      hue: 210,
    },
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: put → WAL → memtable → flush → SST',
      description:
        'Every write appends to the WAL and the memtable; full memtables become immutable L0 SST runs. Nothing on disk is ever edited in place.',
      caption:
        'Embedded engine model: no server, no query layer — the host process calls put/get directly.',
      concepts: ['WAL', 'memtable', 'SST', 'immutability'],
      sourceRefs: [
        {
          label: 'RocksDB wiki: Write Path',
          href: 'https://github.com/facebook/rocksdb/wiki/RocksDB-Overview',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'lsm-compaction',
      variant: 'default',
      title: 'LSM end to end: put, flush, tombstone, compaction',
      description:
        'Watch one key family move through memtable, immutable runs, newest-first lookups, a tombstone delete, and a compaction that drops shadowed values.',
      caption:
        'Teaching model: RocksDB-flavored memtable + L0 runs + one merged L1 run. Real level counts, compaction triggers, and tombstone GC timing are configuration-dependent.',
      concepts: ['LSM', 'tombstone', 'compaction', 'read amplification'],
      sourceRefs: [
        {
          label: 'RocksDB wiki: Compaction',
          href: 'https://github.com/facebook/rocksdb/wiki/Compaction',
        },
        {
          label: "O'Neil et al. (1996), The Log-Structured Merge-Tree",
          href: 'https://www.cs.umb.edu/~poneil/lsmpaper.pdf',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'bloom-filter',
      variant: 'default',
      title: 'Bloom filters: cheap “definitely not here” answers',
      description:
        'Insert three keys into a 24-bit bloom filter, then look up a true hit, a certain absence, and a genuine false positive — the exact tradeoff RocksDB makes per SST file.',
      caption:
        'Teaching model: 24 bits, k=3 display-friendly hashes. RocksDB uses ~10 bits per key with blocked bloom filters tuned per level.',
      concepts: ['bloom filter', 'false positive rate', 'read amplification'],
      sourceRefs: [
        {
          label: 'RocksDB wiki: Bloom Filters',
          href: 'https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'LSM shape under leveled compaction',
      description:
        'Level sizes grow by a fanout ratio per level; L0 holds the few overlapping files straight from flushes.',
      levels: [
        { level: 0, nodes: 4, fanout: 0 },
        { level: 1, nodes: 8, fanout: 10 },
        { level: 2, nodes: 80, fanout: 10 },
        { level: 3, nodes: 800, fanout: 10 },
      ],
      cardinality: 50000000,
      selectivity: 0.5,
      caption:
        'Illustrative shape for a leveled tree with a size ratio of 10 — L0 files overlap; levels below hold disjoint ranges. Actual level counts are configuration.',
      concepts: ['level fanout', 'read amplification', 'size ratio'],
      sourceRefs: [
        {
          label: 'RocksDB wiki: Leveled Compaction',
          href: 'https://github.com/facebook/rocksdb/wiki/Leveled-Compaction',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'RocksDB wiki: Overview',
      href: 'https://github.com/facebook/rocksdb/wiki/RocksDB-Overview',
    },
    {
      label: "O'Neil et al. (1996), The Log-Structured Merge-Tree (LSM-Tree)",
      href: 'https://www.cs.umb.edu/~poneil/lsmpaper.pdf',
    },
    { label: 'rocksdb.org', href: 'https://rocksdb.org/' },
  ],
};
