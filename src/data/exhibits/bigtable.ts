import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'bigtable',
  name: 'Google Bigtable',
  tagline:
    'The original wide-column store: tablets on a distributed lattice, the paper behind HBase and Cassandra.',
  summary:
    'Bigtable is Google wide-column storage system: rows sorted by key, split into tablets served by a single tablet server each, persisted into the SSTable file format, and coordinated through Chubby. Its 2006 paper defined the wide-column family — HBase and Cassandra are direct descendants of this design.',
  paradigm: 'server',
  concurrency: 'single-writer-mvcc',
  storage: 'log-structured',
  families: ['wide-column', 'lsm-log-structured'],
  deploymentModel: 'server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['btree', 'hash'],
  workloads: ['oltp', 'time-series', 'analytics'],
  language: 'C++',
  initialRelease: 2006,
  license: 'Proprietary (Google Cloud managed)',
  accent: '#4a90ff',
  highlights: [
    { label: 'Model', value: 'row key → column families → columns' },
    { label: 'Unit', value: 'tablets (~100-200 MB rows) per server' },
    { label: 'Storage', value: 'SSTable + memtable + tablet log' },
    { label: 'Coordination', value: 'Chubby lock service' },
  ],
  features: [
    {
      title: 'Tablets, one server each',
      detail:
        'Rows are lexicographically sorted and split into tablets; each tablet is served by exactly one tablet server at a time — simple single-writer ordering per tablet.',
    },
    {
      title: 'Column families',
      detail:
        'Columns group into families with one SSTable per family per tablet — access control and storage tuning happen at family granularity.',
    },
    {
      title: 'Timestamped cells',
      detail:
        'Every cell stores multiple versions keyed by timestamp; collection policies garbage-collect old versions automatically — the birthplace of "everything has a timestamp" storage.',
    },
    {
      title: 'SSTable + memtable',
      detail:
        'Writes log to a tablet log then land in a memtable; flushes produce immutable SSTables; merges compact them — the LSM shape, named here first.',
    },
  ],
  sections: [
    {
      heading: 'The paper that defined wide-column',
      paragraphs: [
        'The 2006 Bigtable paper introduced the vocabulary the whole NoSQL family inherited: row keys sorted lexicographically, column families as storage and access units, timestamped cells, tablets as distribution units, SSTables as the file format, and a memtable in front.',
        'Rows sharing a key prefix live contiguously — locality groups let you group hot families together. The data model is deliberately sparse: rows with no data for a family store nothing for it.',
      ],
      code: 'Row key: "com.cnn.www"\nFamilies: contents: , anchor: (sparse)\ncells: contents:html @ t3, anchor:CNN.com @ t9, ...',
      codeLanguage: 'text',
    },
    {
      heading: 'From paper to products',
      paragraphs: [
        'HBase replicated the design on Hadoop; Cassandra recombined Bigtable data model with Dynamo replication; Google Cloud Bigtable is the managed version of the original. Reading this exhibit explains all three.',
        'Single-tablet-single-server keeps ordering simple: cross-tablet transactions do not exist in the base design. The commit path per tablet is the classic LSM loop — log, memtable, flush, merge.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Tablet write path: log → memtable → flush → SSTable → merge',
      description:
        'Each tablet server keeps a commit log and memtable per tablet; flushes write SSTables per column family; MergingCompaction folds them.',
      caption: 'The original LSM write loop — named in this paper.',
      concepts: ['tablet', 'SSTable', 'memtable', 'column family'],
      sourceRefs: [
        {
          label: 'Chang et al. (2006), Bigtable paper',
          href: 'https://research.google/pubs/pub27898/',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'Tablet distribution across servers',
      description:
        'Tablets migrate between servers for load balance; the metadata layer (originally in Chubby) tracks placement.',
      levels: [
        { level: 0, nodes: 3, fanout: 0 },
        { level: 1, nodes: 24, fanout: 40 },
        { level: 2, nodes: 960, fanout: 0 },
      ],
      cardinality: 40000,
      selectivity: 0.2,
      caption:
        'Illustrative tablet counts for a mid-size cluster — placement is metadata, data is SSTables.',
      concepts: ['tablet servers', 'load balance', 'metadata'],
      sourceRefs: [
        {
          label: 'Chang et al. (2006), Bigtable paper §4',
          href: 'https://research.google/pubs/pub27898/',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'Chang et al. (2006), "Bigtable: A Distributed Storage System for Structured Data"',
      href: 'https://research.google/pubs/pub27898/',
    },
    { label: 'Google Cloud Bigtable docs', href: 'https://cloud.google.com/bigtable/docs' },
  ],
};
