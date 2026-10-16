import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'mongodb',
  name: 'MongoDB',
  tagline: 'A document database: BSON collections, WiredTiger B+ trees, replica sets.',
  summary:
    'MongoDB stores JSON-like BSON documents in collections and serves them through the WiredTiger storage engine, which keeps collections and indexes as B+ trees with page-level MVCC and snapshot checkpoints. Documents group what a relational schema would spread across joins; indexes remain ordinary B+ trees over document fields.',
  paradigm: 'client-server',
  concurrency: 'mvcc',
  storage: 'heap-btree',
  families: ['document'],
  deploymentModel: 'client-server',
  storageEngines: ['b-plus-tree'],
  indexTypes: ['btree', 'hash', 'full-text'],
  workloads: ['oltp', 'hybrid'],
  language: 'C++',
  initialRelease: 2009,
  license: 'SSPL-1.0',
  accent: '#00ffe1',
  highlights: [
    { label: 'Model', value: 'BSON documents in collections' },
    { label: 'Engine', value: 'WiredTiger: B+ trees + MVCC' },
    { label: 'Durability', value: 'journal + snapshot checkpoints' },
    { label: 'Scale', value: 'replica sets + sharded clusters' },
  ],
  features: [
    {
      title: 'Documents, not rows',
      detail:
        'A document embeds nested arrays and sub-objects, so one logical entity reads and writes as one unit. The physical cost is paid at index and update time: field updates may move a document across B+ tree pages.',
    },
    {
      title: 'WiredTiger B+ trees',
      detail:
        'Collections and indexes are B+ trees over on-disk pages with per-page copy-on-write; readers get snapshot isolation while writers produce new page versions.',
    },
    {
      title: 'Journal + checkpoints',
      detail:
        'Writes are journaled; every 60 seconds (default) WiredTiger checkpoints a consistent snapshot of the data. Recovery restores the last checkpoint and replays the journal.',
    },
    {
      title: 'Indexes are B+ trees too',
      detail:
        'Single-field, compound, hashed, and text indexes are all tree structures over document fields; query plans choose between index scans and collection scans exactly like a relational planner.',
    },
  ],
  sections: [
    {
      heading: 'The logical model: nested documents',
      paragraphs: [
        'A document is the unit of storage and retrieval. Where a relational design normalizes an order into orders and order_items tables, MongoDB stores the line items inside the order document. That removes one class of join but moves multi-entity queries and multi-document consistency to explicit operations ($lookup, multi-document transactions).',
        'Physically each BSON document gets a RecordId; the collection is a B+ tree keyed by RecordId, and every index is another B+ tree keyed by the indexed field(s) with RecordIds as values — the same shape a relational index would have over a heap.',
      ],
      code: '// insert + indexed query\ndb.orders.insertOne({ _id: 1, customer: "ann", total: 42, items: [{sku: "x", qty: 2}] })\ndb.orders.createIndex({ customer: 1 })\ndb.orders.find({ customer: "ann" })',
      codeLanguage: 'javascript',
    },
    {
      heading: 'The physical model: WiredTiger pages',
      paragraphs: [
        'WiredTiger manages data in on-disk pages of a B+ tree. Updates do not mutate a page: the modified page gets new versions, and readers pinned to older snapshots (MVCC) keep their view until they end. Checkpoints serialize a consistent tree image to disk; the journal covers everything since.',
        'This is a client-server document database, not a storage engine: the mongod process owns durability, replication (oplog), and query execution. Distinguish it from RocksDB in the next exhibit — that one is a library you embed; this one is a server you deploy.',
      ],
    },
    {
      heading: 'Reads: the planner is familiar',
      paragraphs: [
        'The query planner compares candidate plans (index scan vs collection scan) and caches winners. An explain() output shows IXSCAN/COLLSCAN stages with keysExamined and docsExamined — the same concepts as a relational plan, named differently.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'gpu-scene',
      title: 'MongoDB — document grid field (live GPU scene)',
      description:
        'A live WebGPU particle field tinted to this exhibit. Plays only with WebGPU and no reduced-motion preference; a static storyboard renders for everyone else.',
      scene: 'hnsw-layers',
      points: 420,
      seed: 4242,
      fps: 30,
      hue: 40,
    },
    {
      kind: 'pipeline',
      mode: 'read',
      database: 'generic',
      title: 'Read path: query → planner → index/collection B+ tree → document',
      description:
        'A find() goes through the planner, which picks an index B+ tree scan or a collection scan, then fetches full documents by RecordId.',
      caption:
        'WiredTiger serves pages under MVCC snapshots; the server layer applies document-level concurrency.',
      concepts: ['query planner', 'IXSCAN', 'COLLSCAN', 'RecordId'],
      sourceRefs: [
        {
          label: 'MongoDB: Query Plans',
          href: 'https://www.mongodb.com/docs/manual/core/query-plans/',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'btree-split',
      variant: 'default',
      title: 'B+ tree insert with a leaf split (WiredTiger shape)',
      description:
        'Insert a key into a two-level B+ tree: route from the root, overflow the leaf, split it, and copy the separator up — the same mechanics WiredTiger performs per page.',
      caption:
        'Teaching model: max 3 keys per node. WiredTiger page sizes, checkpointing, and concurrency control differ; the split rule shown is the general B+ rule.',
      concepts: ['B+ tree', 'leaf split', 'separator', 'fanout'],
      sourceRefs: [
        {
          label: 'MongoDB: WiredTiger Storage Engine',
          href: 'https://www.mongodb.com/docs/manual/core/wiredtiger/',
        },
        {
          label: 'Comer (1979), Ubiquitous B-Tree',
          href: 'https://dl.acm.org/doi/10.1145/356770.356776',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'Compound index shape over 5M documents',
      description:
        'Root, internal, and leaf levels for a compound (customer, date) index at WiredTiger page sizes.',
      levels: [
        { level: 0, nodes: 1, fanout: 64 },
        { level: 1, nodes: 64, fanout: 130 },
        { level: 2, nodes: 8320, fanout: 0 },
      ],
      cardinality: 5000000,
      selectivity: 0.02,
      caption:
        'Illustrative tree for ~5M keys with ~130 entries per leaf page. Real shapes depend on key sizes and WiredTiger page configuration.',
      concepts: ['fanout', 'compound index', 'leaf pages'],
      sourceRefs: [
        {
          label: 'MongoDB: Indexes',
          href: 'https://www.mongodb.com/docs/manual/indexes/',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'MongoDB: WiredTiger Storage Engine',
      href: 'https://www.mongodb.com/docs/manual/core/wiredtiger/',
    },
    { label: 'MongoDB: Indexes', href: 'https://www.mongodb.com/docs/manual/indexes/' },
    { label: 'MongoDB: Replication', href: 'https://www.mongodb.com/docs/manual/replication/' },
  ],
};
