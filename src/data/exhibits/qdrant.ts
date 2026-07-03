import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'qdrant',
  name: 'Qdrant',
  tagline:
    'A Rust-native vector database with payload filtering, HNSW indexes, and distributed consensus.',
  summary:
    'Qdrant is a server-mode vector database written in Rust that pairs HNSW or scalar-quantized indexes with arbitrary JSON-style payload filters. It supports single-node embedded use, a replicated cluster mode (Raft), and a sharded cluster mode. Storage is split into vectors, payload, and an HNSW index, all on disk.',
  paradigm: 'server-vector',
  concurrency: 'lock-free',
  storage: 'vector-columnar',
  language: 'Rust',
  initialRelease: 2021,
  license: 'Apache-2.0',
  accent: '#f5a623',
  highlights: [
    { label: 'Index', value: 'HNSW + scalar quantization' },
    { label: 'Payload', value: 'filter on any field' },
    { label: 'Modes', value: 'embedded, single, cluster' },
    { label: 'API', value: 'gRPC + REST' },
  ],
  features: [
    {
      title: 'Filter + vector in one query',
      detail:
        'Each vector carries a JSON payload. Queries can combine a k-NN search with arbitrary filter expressions (e.g. price < 50 AND category = "books"). The index consults the payload store before scoring.',
    },
    {
      title: 'HNSW with quantization',
      detail:
        'Vectors are stored as f32 or as scalar-quantized int8. The HNSW graph is built once and updated incrementally; quantized mode cuts memory by 4x with a small recall loss.',
    },
    {
      title: 'Distributed consensus',
      detail:
        'In cluster mode, nodes replicate state via Raft. The query router forwards each request to the nodes that own the relevant shards, then merges the top-k.',
    },
    {
      title: 'Disk-backed by default',
      detail:
        'Vectors and HNSW indexes are mapped to memory-mapped files. Cold data lives on disk; warm data sits in the page cache.',
    },
  ],
  sections: [
    {
      heading: 'The three on-disk stores',
      paragraphs: [
        'Qdrant separates its data into three stores. The vector store holds raw (or quantized) vectors in a columnar layout keyed by point ID. The payload store is a custom LSM-like key/value store keyed by point ID with field values. The HNSW store is the graph: lists of neighbor IDs at each level per point.',
        'A search starts by evaluating the payload filter to a bitmap of candidate point IDs, then traverses the HNSW graph constrained to that bitmap. This is what makes filtered vector search fast.',
      ],
    },
    {
      heading: 'Filtered k-NN',
      paragraphs: [
        'The classic Qdrant query is "find the 10 nearest neighbors of v, where category = books and price < 50." The execution plan is: resolve the filter to a candidate set, run HNSW search inside that set, return the top-k.',
        'The HNSW graph traversal is lock-free per point, which lets Qdrant scale concurrent searches without a global mutex.',
      ],
      code: 'from qdrant_client import QdrantClient\nfrom qdrant_client.http import models\n\nclient = QdrantClient("localhost", port=6333)\n\nhits = client.search(\n  collection_name="books",\n  query_vector=embedding,\n  query_filter=models.Filter(\n    must=[\n      models.FieldCondition(key="category", match=models.MatchValue(value="books")),\n      models.FieldCondition(key="price", range=models.Range(lt=50)),\n    ]\n  ),\n  limit=10,\n  with_payload=True,\n)',
      codeLanguage: 'python',
    },
    {
      heading: 'Embedded mode',
      paragraphs: [
        'Since 1.0, Qdrant can run in-process inside a Python or Node application: no separate server, no socket. This is the same Rust binary, just linked directly. You get the same HNSW implementation, the same filter engine, and you save the network round trip per query.',
      ],
    },
  ],
  diagrams: [
    {
      component: 'VectorIndex',
      title: 'HNSW graph traversal',
      description:
        'Top layer gives a coarse nearest neighbor; descent into the base layer yields the final top-k.',
    },
  ],
};
