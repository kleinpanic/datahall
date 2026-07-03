import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'lancedb',
  name: 'LanceDB',
  tagline:
    'A serverless vector database built on the Lance columnar format: fast scans over multimodal data with embedded ANN indexes.',
  summary:
    'LanceDB is a serverless vector database whose file format (Lance) is a columnar container optimized for fast random access to large blobs (images, audio, video) plus vector search. It supports embedded use (Node, Python) and a server mode, and ships IVF-PQ and HNSW indexes that live inside the same file as the data.',
  paradigm: 'embedded-vector',
  concurrency: 'snapshot-isolation',
  storage: 'vector-columnar',
  language: 'Rust',
  initialRelease: 2023,
  license: 'Apache-2.0',
  accent: '#5cffb1',
  highlights: [
    { label: 'Storage', value: 'Lance columnar' },
    { label: 'Indexes', value: 'IVF-PQ, HNSW' },
    { label: 'Embedded + Server', value: 'Node, Python, Rust' },
    { label: 'Best for', value: 'multimodal RAG' },
  ],
  features: [
    {
      title: 'Lance columnar format',
      detail:
        'A row group per fragment, column-major storage inside each group, plus a row index for fast point lookups. Fragments can be added cheaply and the file is append-friendly.',
    },
    {
      title: 'Vector indexes inside the file',
      detail:
        'IVF-PQ and HNSW indexes are stored as part of the dataset. Queries run against the index without unpacking the full column.',
    },
    {
      title: 'Serverless or server',
      detail:
        'The same Rust core runs in-process (no socket, no daemon) or behind a REST API. Pick based on scale.',
    },
    {
      title: 'Multimodal friendly',
      detail:
        'Native support for image, audio, and video types via the Arrow ecosystem. Embeddings are just one more column.',
    },
  ],
  sections: [
    {
      heading: 'The Lance file',
      paragraphs: [
        'A Lance file is a directory of fragments plus metadata. Each fragment has N rows; inside a fragment, columns are stored as Arrow IPC chunks. A separate row index maps primary keys to fragment + offset. The result is a file that supports fast column scans (for vector search) and fast row lookups (for primary-key reads).',
        'Fragments can be added in O(1) and the file stays a single object for the consumer. This makes Lance popular for lakehouse-style data over S3 or local disk.',
      ],
    },
    {
      heading: 'ANN search',
      paragraphs: [
        'LanceDB ships IVF-PQ (good for very large datasets) and HNSW (better recall). Both are built into the Rust core; queries are dispatched there directly. The query plan is simple: load the index, traverse it, fetch the top-k rows from the column store by their row-id, return.',
      ],
      code: 'import lancedb\n\ndb = lancedb.connect("./.lancedb")\ntbl = db.create_table("docs", data=rows, mode="overwrite")\ntbl.create_index(num_partitions=256, num_sub_vectors=96)  # IVF-PQ\n\nresults = (\n  tbl.search([0.1, 0.2, 0.3, ...])\n    .metric("cosine")\n    .limit(10)\n    .to_pandas()\n)',
      codeLanguage: 'python',
    },
    {
      heading: 'Why serverless wins for many workloads',
      paragraphs: [
        'For RAG over a few million embeddings, the cost of running a separate Qdrant or Milvus cluster is hard to justify. LanceDB runs inside the same Python process as the rest of your pipeline: no socket, no auth, no separate ops surface. You pay for the Rust binary and the file. When you outgrow that, you turn on server mode without changing the data layout.',
      ],
    },
  ],
  diagrams: [
    {
      component: 'VectorIndex',
      title: 'HNSW layered graph',
      description:
        'A query enters the top layer, hops across neighbors, and drills down to the densest base layer for the top-k.',
    },
  ],
};
