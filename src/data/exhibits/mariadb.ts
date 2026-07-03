import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'mariadb',
  name: 'MariaDB',
  tagline:
    'The community fork of MySQL: pluggable engines, MVCC InnoDB, and columnar storage for analytics.',
  summary:
    'MariaDB is a binary-compatible fork of MySQL that retains the MySQL client protocol and SQL dialect while replacing the storage engine layer with a more permissive set: InnoDB (default, MVCC), Aria (crash-safe MyISAM), ColumnStore (columnar, distributed), and Spider (sharding). The optimizer and parser are extended versions of MySQL’s.',
  paradigm: 'client-server',
  concurrency: 'mvcc',
  storage: 'heap-btree',
  language: 'C++',
  initialRelease: 2009,
  license: 'GPLv2',
  accent: '#ff5d8f',
  highlights: [
    { label: 'Default engine', value: 'InnoDB (MVCC)' },
    { label: 'Pluggable storage', value: 'InnoDB, Aria, ColumnStore' },
    { label: 'Replication', value: 'async + semi-sync + Galera' },
    { label: 'Compatibility', value: 'MySQL wire protocol' },
  ],
  features: [
    {
      title: 'InnoDB MVCC',
      detail:
        'InnoDB keeps up to 128 rollback segments of undo logs. Each row has a 6-byte transaction ID and a 7-byte roll pointer; old versions are read by following the chain.',
    },
    {
      title: 'Pluggable engines',
      detail:
        'A query plan can be served by any engine for any table. A single SELECT can join an InnoDB table to a ColumnStore table to a Spider-sharded remote table.',
    },
    {
      title: 'Galera cluster',
      detail:
        'A certification-based replication plugin that gives multi-master synchronous replication with conflict detection and zero data loss.',
    },
    {
      title: 'Optimistic row-level locking',
      detail:
        'Next-key locks and gap locks under REPEATABLE READ prevent phantoms; READ COMMITTED skips gap locks for higher throughput.',
    },
  ],
  sections: [
    {
      heading: 'How InnoDB stores rows',
      paragraphs: [
        'A row in InnoDB lives on a 16 KiB page inside a tablespace (usually one file per table, configurable). Each row carries a 6-byte DB_TRX_ID and a 7-byte DB_ROLL_PTR. The roll pointer is the address of the undo log record that can reconstruct the previous version.',
        'When a transaction updates a row, InnoDB writes a new row version in the clustered-index B-tree (which is the table) and inserts an undo record. Other transactions that started before the commit read the undo chain to find the version visible at their snapshot.',
      ],
    },
    {
      heading: 'The query path',
      paragraphs: [
        'MariaDB ships a cost-based optimizer borrowed and extended from MySQL. SQL enters the parser, becomes a parse tree, then a resolved query block, then a plan. The optimizer applies join reordering, subquery unnesting, and condition pushdown before handing the plan to the executor.',
        'The executor pulls rows through a Volcano-style iterator API. The same operator interface serves every storage engine, which is what makes the pluggable-engine model work.',
      ],
      code: 'CREATE TABLE events (\n  id BIGINT PRIMARY KEY AUTO_INCREMENT,\n  payload JSON,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  INDEX (created_at)\n) ENGINE=InnoDB ROW_FORMAT=DYNAMIC;',
      codeLanguage: 'sql',
    },
    {
      heading: 'ColumnStore for analytics',
      paragraphs: [
        'ColumnStore is a separate engine that stores each column in its own file and skips irrelevant columns at read time. It runs across multiple servers and is the MariaDB answer to ClickHouse / Snowflake. You load data into a ColumnStore table, query it with the same SQL, and get column-pruned scans served by parallel workers.',
      ],
    },
  ],
  diagrams: [
    {
      component: 'MvccTimeline',
      title: 'MVCC snapshot timeline',
      description:
        'InnoDB keeps undo chains; each transaction walks them to find the version visible at its snapshot.',
    },
    {
      component: 'Replication',
      title: 'Async + semi-sync replication',
      description:
        'A primary streams binary logs to multiple replicas; Galera can extend this to multi-master.',
    },
  ],
};
