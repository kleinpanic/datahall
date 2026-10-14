import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'neo4j',
  name: 'Neo4j',
  tagline: 'A property-graph database with index-free adjacency and Cypher traversals.',
  summary:
    'Neo4j stores data as nodes connected by typed, directed relationships, each carrying properties. Fixed-size record files keep node and relationship records side by side, so traversing from one node to its neighbors is a pointer chase, not an index lookup — Neo4j calls this index-free adjacency. Cypher expresses queries as graph patterns the engine walks.',
  paradigm: 'client-server',
  concurrency: 'mvcc',
  storage: 'heap-btree',
  families: ['graph'],
  deploymentModel: 'client-server',
  storageEngines: ['b-plus-tree'],
  indexTypes: ['btree', 'full-text'],
  workloads: ['oltp', 'olap'],
  language: 'Java',
  initialRelease: 2007,
  license: 'GPL-3.0 (Community) / Commercial',
  accent: '#7c5cff',
  highlights: [
    { label: 'Model', value: 'nodes + directed relationships + properties' },
    { label: 'Query', value: 'Cypher pattern matching' },
    { label: 'Traversal', value: 'index-free adjacency (pointer chase)' },
    { label: 'Indexes', value: 'range (B-tree) + full-text (Lucene)' },
  ],
  features: [
    {
      title: 'Property graph model',
      detail:
        'Nodes and relationships both carry arbitrary properties. Relationships are typed, directed, and stored as first-class records — not foreign keys resolved through an index.',
    },
    {
      title: 'Record store files',
      detail:
        'The store directory keeps fixed-size records (neostore): nodes, relationships, properties, each in its own file. A relationship record physically links the IDs of its two nodes plus the previous/next relationship of each.',
    },
    {
      title: 'Cypher traversals',
      detail:
        'MATCH (a:Person)-[:KNOWS*1..3]->(b) declares a pattern; the runtime expands frontiers over the record-linked graph, honoring direction and hop limits from the pattern.',
    },
    {
      title: 'Indexes where they belong',
      detail:
        'Starting points come from B-tree range indexes or Lucene full-text indexes; everything after the first hop uses adjacency pointers. Joins as repeated index lookups are what graph databases are built to avoid.',
    },
  ],
  sections: [
    {
      heading: 'The logical model: a property graph',
      paragraphs: [
        'Relational models normalize entities into tables and connect them with foreign keys resolved at query time. A property graph stores the connection itself: an order KNOWS-product relationship is a physical record between two nodes, readable in one hop, with its own properties (quantity, since).',
        'Recursive and variable-depth questions — friend-of-friend, dependency chains, shortest route — change cost class completely: SQL needs recursive CTEs with per-iteration joins; a traversal follows existing pointers.',
      ],
      code: '// Cypher: colleagues-of-colleagues who like the same product\nMATCH (me:Person {id: 1})-[:KNOWS*1..2]-(other:Person),\n      (other)-[:LIKED]->(p:Product)<-[:LIKED]-(me)\nRETURN other, count(p) AS shared ORDER BY shared DESC LIMIT 5',
      codeLanguage: 'cypher',
    },
    {
      heading: 'The physical model: index-free adjacency',
      paragraphs: [
        'Each node record carries the address of its first relationship; each relationship record carries the addresses of the next/previous relationship for both of its endpoints. Traversing from a node to its neighbors is following these record pointers — no index is consulted per hop. That is what "index-free adjacency" means in Neo4j’s documentation, and it is why traversal cost tracks the size of the result frontier, not the size of the graph.',
        'B-tree indexes still exist — for finding starting nodes by property value. The walkthrough below shows the traversal itself: a breadth-first expansion with a FIFO frontier, where direction comes from the pattern and the visited set guarantees termination on cyclic graphs.',
      ],
    },
    {
      heading: 'Writes and durability',
      paragraphs: [
        'Writes go to a logical log before the record files are updated; recovery replays the log. Concurrent transactions lock the records they touch (write conflicts) while readers work on snapshots — document-level isolation vocabulary does not map cleanly here, and Neo4j’s manual describes its exact read-committed semantics per version.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'pipeline',
      mode: 'query',
      database: 'generic',
      title: 'Traversal path: Cypher pattern → index start → pointer hops → results',
      description:
        'A pattern query starts from indexed anchor nodes, then expands across relationship records via adjacency pointers until the pattern is satisfied.',
      caption: 'One index lookup at the start; every later hop follows stored pointers.',
      concepts: ['traversal', 'frontier', 'record pointers', 'starting point index'],
      sourceRefs: [
        {
          label: 'Neo4j docs: Graph database internals',
          href: 'https://neo4j.com/docs/graph-databases-manual/current/',
        },
      ],
    },
    {
      kind: 'walkthrough',
      mode: 'graph-bfs',
      variant: 'default',
      title: 'Breadth-first traversal on a directed graph',
      description:
        'Expand a FIFO frontier from node A across directed relationships: direction per hop, visited-set termination, and the shortest-path property of BFS — the mechanics under Cypher variable-length patterns.',
      caption:
        'Generic BFS on a 6-node toy graph; Neo4j’s runtime adds its own expansion strategies and path evaluators on top of the same principles.',
      concepts: ['BFS', 'frontier', 'directed edges', 'shortest path'],
      sourceRefs: [
        {
          label: 'Neo4j docs: Cypher path patterns',
          href: 'https://neo4j.com/docs/cypher-manual/current/patterns/',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'Neo4j docs: Storage internals (record files, index-free adjacency)',
      href: 'https://neo4j.com/docs/operations-manual/current/database-internals/',
    },
    {
      label: 'Neo4j Cypher Manual: Patterns',
      href: 'https://neo4j.com/docs/cypher-manual/current/patterns/',
    },
    { label: 'neo4j.com', href: 'https://neo4j.com/' },
  ],
};
