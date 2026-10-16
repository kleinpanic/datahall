import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'elasticsearch',
  name: 'Elasticsearch',
  tagline:
    'A distributed search engine: inverted indexes, immutable Lucene segments, near-real-time.',
  summary:
    'Elasticsearch stores JSON documents in shards built on Apache Lucene. Text is analyzed into terms that fill an inverted index — term to document list — inside immutable segments. Writes go to an in-memory buffer and a transaction log, become a searchable segment on refresh, and segments merge in the background. Search is scatter-gather across shards.',
  paradigm: 'client-server',
  concurrency: 'snapshot-isolation',
  storage: 'log-structured',
  families: ['search'],
  deploymentModel: 'client-server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['full-text', 'btree', 'bitmap'],
  workloads: ['olap', 'analytics', 'hybrid'],
  language: 'Java',
  initialRelease: 2010,
  license: 'Elastic-2.0 / SSPL-1.0',
  accent: '#4aa8ff',
  highlights: [
    { label: 'Index', value: 'inverted: term → postings list' },
    { label: 'Storage', value: 'immutable Lucene segments' },
    { label: 'Visibility', value: 'refresh ≈ every 1s (near-real-time)' },
    { label: 'Scale', value: 'shards + replicas, scatter-gather' },
  ],
  features: [
    {
      title: 'The inverted index',
      detail:
        'An analyzer tokenizes and normalizes text; each unique term points to the list of documents containing it. Search intersects postings lists instead of scanning documents.',
    },
    {
      title: 'Immutable segments',
      detail:
        'New documents buffer in memory and land in a new segment on refresh; deletes are tombstone bits; background merges rewrite small segments into fewer large ones.',
    },
    {
      title: 'Aggregations',
      detail:
        'Doc-values column caches make group-bys and stats over matching documents fast — the analytics half of the engine next to full-text search.',
    },
    {
      title: 'Shards and replicas',
      detail:
        'An index is split into primary shards, each a self-contained Lucene instance, replicated for failover. Queries fan out to every shard of the index and merge.',
    },
  ],
  sections: [
    {
      heading: 'The inverted index: search built backwards',
      paragraphs: [
        'A relational index maps a row to its values so rows can be found by value; an inverted index maps each term to the documents that contain it, so text queries start from the matching documents. The analyzer splits text into terms (lowercased, stemmed), and the index stores term → [doc1, doc3, …] plus term positions for phrase queries.',
        'This is a different logical data representation from rows or documents: the unit of search is the term, and relevance scoring (BM25) ranks the postings candidates before results return.',
      ],
      code: 'PUT /articles\nPOST /articles/_doc\n{ "title": "LSM + merges" }\nGET /articles/_search\n{ "query": { "match": { "title": "merges" } } }',
      codeLanguage: 'json',
    },
    {
      heading: 'Segments: write once, merge later',
      paragraphs: [
        'Indexing writes to an in-memory buffer plus a transaction log; when the refresh interval fires (one second by default) the buffer becomes a new immutable Lucene segment and the documents become searchable — near-real-time, not immediate. Deletes flip tombstone bits; merges fold segments together and drop the tombstoned docs.',
        'The write path is unmistakably LSM-shaped: log, buffer, immutable run, background merge. The tradeoffs repeat too — merge cost and deleted-document space versus search speed.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Index path: document → analyzer → buffer → segment → refresh',
      description:
        'Documents are tokenized into terms, buffered, written as an immutable segment on refresh, and merged in the background. The transaction log covers the un-refreshed window.',
      caption: 'LSM shape, inverted-index payload.',
      concepts: ['analyzer', 'inverted index', 'refresh', 'segment merge'],
      sourceRefs: [
        {
          label: 'Elasticsearch: Near-real-time search',
          href: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/near-real-time.html',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'inverted-index',
      variant: 'default',
      title: 'Inverted index: build, then intersect a two-term AND',
      description:
        'Watch the analyzer fill four postings lists, then answer a two-term AND query by sorted intersection — exact matches only, the structure every search engine leads with.',
      caption:
        'Teaching model: 5 documents, 4 terms. Lucene adds scores, positions, and per-segment posting lists on top of the same shape.',
      concepts: ['inverted index', 'postings list', 'AND intersection'],
      sourceRefs: [
        {
          label: 'Elasticsearch: Full-text queries',
          href: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/full-text-queries.html',
        },
      ],
    },
    {
      kind: 'index-stats',
      title: 'Segment shape under merging',
      description:
        'Many small young segments collapse into fewer large ones; deleted documents are dropped at merge time.',
      levels: [
        { level: 0, nodes: 12, fanout: 0 },
        { level: 1, nodes: 4, fanout: 5 },
        { level: 2, nodes: 1, fanout: 0 },
      ],
      cardinality: 2500000,
      selectivity: 0.4,
      caption:
        'Illustrative segment tiers for a busy write index — real tier counts follow the merge policy and indexing rate.',
      concepts: ['segments', 'merge policy', 'tombstones'],
      sourceRefs: [
        {
          label: 'Elasticsearch: Segment merging',
          href: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-merge.html',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'Elasticsearch: Inverted index (Lucene)',
      href: 'https://www.elastic.co/blog/found-dive-into-lucene',
    },
    {
      label: 'Elastic docs: Modules — Indexing',
      href: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html',
    },
    { label: 'elastic.co', href: 'https://www.elastic.co/' },
  ],
};
