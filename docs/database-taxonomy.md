# Database Taxonomy

datahall covers five databases across three paradigms, chosen to give a
reader a mental model for the most important storage-engine families in
production today.

## Relational — embedded

- **SQLite** — single-file, serverless, bytecoded VM, WAL-based concurrency.

## Relational — client/server (process-based)

- **PostgreSQL** — MVCC in place, cost-based planner, extensible catalog.
- **MariaDB** — pluggable engines (InnoDB, Aria, ColumnStore), Galera cluster.

## Vector / AI-native

- **LanceDB** — columnar Lance format, IVF-PQ + HNSW, embedded-first.
- **Qdrant** — Rust-native, HNSW with payload filtering, distributed consensus.

## Family map

```
relational / SQL
├── embedded  ────────────► SQLite
└── client/server  ─────► PostgreSQL, MariaDB

vector / similarity
├── embedded  ────────────► LanceDB
└── server  ─────────────► Qdrant
```

## Out of scope for Phase 1

- Key/value (RocksDB, LevelDB, BadgerDB)
- Wide-column (Cassandra, ScyllaDB, HBase)
- Document (MongoDB, Couchbase)
- Graph (Neo4j, Memgraph)
- Time-series (InfluxDB, TimescaleDB)
- Search (Elasticsearch, Meilisearch)

These families will be considered in later phases.
