/**
 * Exhibit loader.
 *
 * Each exhibit is a plain TypeScript module that exports an `exhibit` value
 * conforming to `DatabaseEntry`. Importing this module validates every entry
 * eagerly; a malformed entry throws on import so the build fails immediately.
 *
 * The export `exhibits` is a frozen array sorted by `initialRelease` ascending.
 */

import { DatabaseEntry } from './schema';
import { exhibit as sqlite } from '../data/exhibits/sqlite';
import { exhibit as postgresql } from '../data/exhibits/postgresql';
import { exhibit as mariadb } from '../data/exhibits/mariadb';
import { exhibit as lancedb } from '../data/exhibits/lancedb';
import { exhibit as qdrant } from '../data/exhibits/qdrant';
import { exhibit as rocksdb } from '../data/exhibits/rocksdb';
import { exhibit as mongodb } from '../data/exhibits/mongodb';
import { exhibit as neo4j } from '../data/exhibits/neo4j';
import { exhibit as clickhouse } from '../data/exhibits/clickhouse';
import { exhibit as redis } from '../data/exhibits/redis';
import { exhibit as elasticsearch } from '../data/exhibits/elasticsearch';
import { exhibit as influxdb } from '../data/exhibits/influxdb';

const raw: ReadonlyArray<unknown> = [
  sqlite,
  postgresql,
  mariadb,
  lancedb,
  qdrant,
  rocksdb,
  mongodb,
  neo4j,
  clickhouse,
  redis,
  elasticsearch,
  influxdb,
];

const validated: ReadonlyArray<DatabaseEntry> = raw.map((entry, index) => {
  const result = DatabaseEntry.safeParse(entry);
  if (!result.success) {
    const label = (entry as { name?: string })?.name ?? `index ${index}`;
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid exhibit "${label}":\n${issues}`);
  }
  return result.data;
});

const slugs = new Set(validated.map((e) => e.slug));
if (slugs.size !== validated.length) {
  throw new Error('Duplicate exhibit slugs detected.');
}

export const exhibits: ReadonlyArray<DatabaseEntry> = Object.freeze(
  [...validated].sort((a, b) => a.initialRelease - b.initialRelease),
);

export function getExhibit(slug: string): DatabaseEntry | undefined {
  return exhibits.find((e) => e.slug === slug);
}

export function exhibitSlugs(): ReadonlyArray<string> {
  return exhibits.map((e) => e.slug);
}
