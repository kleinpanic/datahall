# Source Policy

datahall teaches database internals from publicly available sources. Every
factual claim in an exhibit must be traceable to a primary or widely-cited
source.

## Acceptable sources

1. **Vendor documentation** — sqlite.org, postgresql.org/docs, mariadb.com/kb,
   lance-format.github.io, qdrant.tech/documentation. Highest weight.
2. **Source code** — the database's own Git repository, MIT/GPL permissively
   licensed. Cited by commit hash.
3. **Academic papers** — for MVCC, WAL, B-trees, R-trees, HNSW, IVF-PQ.
4. **Authoritative technical books** — Database Internals (Alex Petrov),
   Designing Data-Intensive Applications (Kleppmann), etc.
5. **Reputable engineering blogs** — by maintainers of the database or by
   well-known DB engineers with verifiable history.

## Unacceptable

- Stack Overflow / Reddit answers without underlying source
- LLM-generated content that has not been independently verified
- Marketing pages or vendor blogs that are not technically reviewed

## Citation format

Each exhibit will eventually end with a references list. Suggested format:

> `[PostgresDocs] PostgreSQL 17 Server Administration — Chapter 27:
Reliability and the WAL — postgresql.org/docs/17/wal.html`

## Review

Phase 1 ships as a "first cut." Each exhibit should be sanity-checked
against primary docs before being labeled "shipped."
