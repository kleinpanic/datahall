import type { DatabaseEntry } from '../../lib/schema';

export const exhibit: DatabaseEntry = {
  slug: 'influxdb',
  name: 'InfluxDB',
  tagline: 'A time-series database: measurements, tags, and time-structured merge storage.',
  summary:
    'InfluxDB is purpose-built for timestamped data. Points are measurements with tag sets (indexed metadata), fields (values), and a timestamp. Storage follows an LSM shape adapted for time: writes hit a WAL and an in-memory cache, flush into immutable, time-partitioned TSM files, and compaction folds them while retention policies drop expired shards.',
  paradigm: 'server',
  concurrency: 'snapshot-isolation',
  storage: 'log-structured',
  families: ['time-series'],
  deploymentModel: 'client-server',
  storageEngines: ['lsm-tree'],
  indexTypes: ['brin', 'hash'],
  workloads: ['time-series', 'analytics', 'olap'],
  language: 'Rust',
  initialRelease: 2013,
  license: 'MIT / Apache-2.0',
  accent: '#ffde59',
  highlights: [
    { label: 'Model', value: 'measurement + tags + fields + time' },
    { label: 'Storage', value: 'TSM: immutable, time-partitioned' },
    { label: 'Lifecycle', value: 'retention policies + downsampling' },
    { label: 'Index', value: 'series index over tag sets' },
  ],
  features: [
    {
      title: 'Schema built for time',
      detail:
        'Tags are indexed metadata (host, region) that identify a series; fields are the values. cardinality = tags² combinations — the number that decides whether the index stays fast.',
    },
    {
      title: 'TSM files',
      detail:
        'Time-Structured Merge files store compressed, time-ordered columns per shard. Immutable after write, merged by compaction, dropped whole by retention — the file IS the time range.',
    },
    {
      title: 'Retention and downsampling',
      detail:
        'Retention policies evict whole shards when data ages out — dropping a file beats deleting rows. Continuous queries or tasks downsample raw points into summary measurements.',
    },
  ],
  sections: [
    {
      heading: 'The data model is the index strategy',
      paragraphs: [
        'Every point is (measurement, tag set, field set, timestamp). Tags are indexed: the series key measurement,tag-set identifies a distinct time series, and the index answers "which series exist" without touching field data. Fields are stored column-compressed per series inside TSM blocks.',
        'That split is the schema decision that matters: a tag with unbounded values (e.g. user_id) explodes series cardinality, while a field stays compressed and unindexed. Time-series schemas are designed around which columns you filter by and which you aggregate.',
      ],
      code: 'weather,location=us-midwest,season=summer temperature=82,humidity=71 1689000000000000000',
      codeLanguage: 'influx',
    },
    {
      heading: 'TSM: LSM adapted for time',
      paragraphs: [
        'Writes append to a WAL and an in-memory cache; when the cache fills, the points compress into immutable TSM files inside a time-partitioned shard. Compaction merges files and re-compresses. Queries touch only the shards whose time ranges intersect the query, and only the blocks for the requested fields.',
        'Dropping expired data is a file operation, not a row delete — retention policies delete whole shards. The pattern is LSM with time as the natural partition key.',
      ],
    },
  ],
  visuals: [
    {
      kind: 'gpu-scene',
      title: 'InfluxDB — time-series drift field (live GPU scene)',
      description:
        'A live WebGPU particle field tinted to this exhibit. Plays only with WebGPU and no reduced-motion preference; a static storyboard renders for everyone else.',
      scene: 'hnsw-layers',
      points: 420,
      seed: 4264,
      fps: 30,
      hue: 60,
    },
    {
      kind: 'pipeline',
      mode: 'write',
      database: 'generic',
      title: 'Write path: line protocol → WAL → cache → TSM → compaction',
      description:
        'Points append to the WAL and cache, flush into immutable time-partitioned TSM files, and compact in the background while retention drops aged-out shards.',
      caption: 'LSM shape with time as the partition key.',
      concepts: ['WAL', 'TSM', 'shard groups', 'compaction'],
      sourceRefs: [
        {
          label: 'InfluxDB: TSM storage engine',
          href: 'https://docs.influxdata.com/influxdb/v2/reference/internals/storage-engine/',
        },
      ],
    },
    {
      kind: 'time-series',
      title: 'Downsampled series vs raw',
      description:
        'Raw points at one-minute resolution and the five-minute mean the downsampling task writes — same shape, less storage, query-friendly summaries.',
      series: [
        {
          name: 'raw (1m)',
          points: [
            { t: 0, v: 21.1 },
            { t: 5, v: 21.6 },
            { t: 10, v: 20.8 },
            { t: 15, v: 22.4 },
            { t: 20, v: 23.0 },
            { t: 25, v: 21.9 },
          ],
        },
        {
          name: '5m mean (illustrative)',
          points: [
            { t: 2.5, v: 21.2 },
            { t: 12.5, v: 21.7 },
            { t: 22.5, v: 22.4 },
          ],
        },
      ],
      unit: '°C',
      caption:
        'Illustrative shapes for the downsampling pattern — not measured data. Retention keeps raw points briefly, summaries forever.',
      concepts: ['downsampling', 'retention', 'rollups'],
      sourceRefs: [
        {
          label: 'InfluxDB: Downsampling',
          href: 'https://docs.influxdata.com/influxdb/v2/process-data/manage-tasks/',
        },
      ],
    },
  ],
  sourceRefs: [
    {
      label: 'InfluxDB: Storage engine (TSM)',
      href: 'https://docs.influxdata.com/influxdb/v2/reference/internals/storage-engine/',
    },
    {
      label: 'InfluxDB: Schema design',
      href: 'https://docs.influxdata.com/influxdb/v2/write-data/best-practices/schema-design/',
    },
    { label: 'influxdata.com', href: 'https://www.influxdata.com/' },
  ],
};
