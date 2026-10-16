import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'couchdb',
  name: 'Apache CouchDB',
  tagline:
    'An append-only document database: B-tree indexes, MVCC revisions, masterless replication.',
  summary:
    'CouchDB stores JSON documents in append-only copy-on-write B-trees — nothing is ever edited in place, so readers never block writers. Every document carries a _rev revision; updates create new versions that compaction later prunes. Databases synchronize bidirectionally with an incremental, conflict-aware replication protocol.',
  paradigm: 'server',
  concurrency: 'multi-process-mvcc',
  storage: 'log-structured',
  families: ['document'],
  deploymentModel: 'client-server',
  storageEngines: ['b-plus-tree'],
  indexTypes: ['btree'],
  workloads: ['oltp', 'hybrid'],
  language: 'Erlang',
  initialRelease: 2005,
  license: 'Apache-2.0',
  accent: '#8fce5a',
  highlights: [
    { label: 'Model', value: 'JSON documents, MVCC revisions' },
    { label: 'Storage', value: 'append-only copy-on-write B-tree' },
    { label: 'Indexes', value: 'MapReduce views, incremental' },
    { label: 'Sync', value: 'masterless replication, conflict papers' },
  ],
  features: [
    {
      title: 'Append-only B-trees',
      detail:
        'Updates write new nodes and a new root; old structure stays intact until compaction. Crash safety falls out of the design — a torn write leaves the previous root valid.',
    },
    {
      title: 'MVCC revisions',
      detail:
        'Every update bumps _rev. Concurrent writers create conflicting branches that the replication protocol surfaces as real conflicts — apps resolve, CouchDB never silently picks.',
    },
    {
      title: 'Incremental MapReduce views',
      detail:
        'Views compute over the B-tree and update incrementally as the tree grows — indexes that cost O(changes) to maintain, not O(database).',
    },
    {
      title: 'Eventual, conflict-aware sync',
      detail:
        'Replication copies document revisions between databases, detects concurrent edits, and materializes conflicts for application resolution.',
    },
  ],
  sections: [
    {
      heading: 'Append-only changes everything',
      paragraphs: [
        'Because the storage is copy-on-write, a crash can only ever leave a partially written new tree — the previous root is untouched. Compare with in-place engines that need WAL replay to guarantee the same invariant.',
        'Revisions make concurrency explicit: two clients updating the same document produce two branches with a shared ancestor. Reads specify which revision to trust; conflicts are first-class documents, not silent overwrites.',
      ],
      code: 'PUT /db/order-42\n{ "customer": "ann", "total": 42 }\n→ 201 { "rev": "1-abc123" }\n\nPUT /db/order-42\n{ "customer": "ann", "total": 45 }\n→ 409 (needs ?rev=1-abc123)',
      codeLanguage: 'http',
    },
    {
      heading: 'Views that grow with the tree',
      paragraphs: [
        'MapReduce views index documents into B-tree-backed key/value rows. Because documents are immutable, a view only recomputes for changed document IDs — incremental by construction.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: document → append B-tree nodes → new root → replication',
      description:
        'Updates append new tree nodes and swap the root pointer; compaction reclaims old versions. Replication syncs revisions and surfaces conflicts.',
      caption: 'Crash safety by construction: torn writes leave the old root valid.',
      concepts: ['append-only', 'MVCC revisions', 'compaction', 'replication'],
      sourceRefs: [
        {
          label: 'CouchDB: Storage layout',
          href: 'https://docs.couchdb.org/en/stable/intro/overview.html',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'B-tree growth and compaction',
      description:
        'Append-only tree size over document versions, before and after compaction reclaims superseded nodes.',
      levels: [
        { level: 0, nodes: 1, fanout: 0 },
        { level: 1, nodes: 4, fanout: 120 },
        { level: 2, nodes: 480, fanout: 0 },
      ],
      cardinality: 48000,
      selectivity: 0.1,
      caption:
        'Illustrative tree for 48K document versions — compaction rewrites live data into a fresh tree and drops the rest.',
      concepts: ['compaction', 'copy-on-write', 'fill factor'],
      sourceRefs: [
        {
          label: 'CouchDB: Compaction',
          href: 'https://docs.couchdb.org/en/stable/maintenance/compaction.html',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'CouchDB docs: Overview',
      href: 'https://docs.couchdb.org/en/stable/intro/overview.html',
    },
    {
      label: 'CouchDB docs: Replication/conflicts',
      href: 'https://docs.couchdb.org/en/stable/replication/conflicts.html',
    },
    { label: 'couchdb.apache.org', href: 'https://couchdb.apache.org/' },
  ],
};
