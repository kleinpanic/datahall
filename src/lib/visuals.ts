/**
 * Visual module registry (renderer-side).
 *
 * Each `Visual.kind` is mapped to an Astro component here. The
 * `VisualModuleRenderer` reads this registry to dispatch a typed visual
 * payload to its component. Unknown kinds are rendered as a graceful
 * placeholder in dev/test (and a clear console warning); the schema test
 * suite catches unregistered kinds at build time.
 *
 * The KIND-and-legacy-naming metadata lives in `visuals-registry.ts` (kept
 * side-effect free of `.astro` imports so it can be imported from vitest),
 * and the legacy `kind: 'diagram'` shim lives in `visuals-legacy.ts`.
 */

import AnatomyPipeline from '../components/visuals/AnatomyPipeline.astro';
import DatabaseFamilyMap from '../components/visuals/DatabaseFamilyMap.astro';
import GpuScene from '../components/visuals/GpuScene.astro';
import LegendPanel from '../components/visuals/LegendPanel.astro';
import PageMicroscope from '../components/visuals/PageMicroscope.astro';
import VectorIndexPlayground from '../components/visuals/VectorIndexPlayground.astro';
import WalTimeline from '../components/visuals/WalTimeline.astro';

// Data-driven metric kinds (server-rendered, no client JS)
import GpuMetrics from '../components/visuals/GpuMetrics.astro';
import TimeSeries from '../components/visuals/TimeSeries.astro';
import IndexStats from '../components/visuals/IndexStats.astro';
import QueryPlan from '../components/visuals/QueryPlan.astro';

import {
  VISUAL_KINDS,
  type RegisteredVisualKind,
  isRegisteredKind,
  registeredKinds,
} from './visuals-registry';
import {
  LEGACY_DIAGRAMS,
  LEGACY_DIAGRAM_NAMES,
  getLegacyDiagram,
  getLegacyDiagramFactory,
} from './visuals-legacy';

export { VISUAL_KINDS, type RegisteredVisualKind, LEGACY_DIAGRAM_NAMES };

// Astro .astro default exports are factory functions; we don't depend on a
// specific public type. Use a permissive structural alias.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstroComponent = (props: Record<string, any>) => any;

/**
 * Map of `kind` -> renderer. `kind: "diagram"` is special: it dispatches
 * by the legacy `component` field, so old `{ kind: "diagram", component: "SqliteFileFormat" }`
 * entries keep working without an enum lookup.
 */
export const VISUAL_REGISTRY: Readonly<Record<RegisteredVisualKind, AstroComponent | null>> =
  Object.freeze({
    // `diagram` is special-cased by `VisualModuleRenderer` itself, which
    // dispatches via the legacy `component` field. We deliberately do not
    // register a renderer for it here to avoid a circular import between
    // `VisualModuleRenderer.astro` and this module.
    diagram: null,
    pipeline: AnatomyPipeline as unknown as AstroComponent,
    'page-microscope': PageMicroscope as unknown as AstroComponent,
    'wal-timeline': WalTimeline as unknown as AstroComponent,
    'vector-index': VectorIndexPlayground as unknown as AstroComponent,
    'family-map': DatabaseFamilyMap as unknown as AstroComponent,
    legend: LegendPanel as unknown as AstroComponent,
    'gpu-scene': GpuScene as unknown as AstroComponent,
    'gpu-metrics': GpuMetrics as unknown as AstroComponent,
    'time-series': TimeSeries as unknown as AstroComponent,
    'index-stats': IndexStats as unknown as AstroComponent,
    'query-plan': QueryPlan as unknown as AstroComponent,
  });

/** Get the renderer for a kind. `null` if unregistered or special-cased. */
export function getVisualRenderer(kind: string): AstroComponent | null {
  if (isRegisteredKind(kind)) {
    return VISUAL_REGISTRY[kind];
  }
  return null;
}

// Re-export legacy helpers for callers.
export { getLegacyDiagram, getLegacyDiagramFactory };
// The `LEGACY_DIAGRAMS` map is implementation detail but exposed as `Readonly` for tests.
export { LEGACY_DIAGRAMS };

/**
 * Exhaustive `kind` list. Used by the schema test to assert every kind
 * declared in `schema.ts` has a registered renderer.
 */
export { registeredKinds };
