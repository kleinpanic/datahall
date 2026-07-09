/**
 * Legacy diagram component registry -- `kind: 'diagram'` shim.
 *
 * Kept in its own file so that `visuals-registry.ts` (and the tests that
 * import it) do not pull in `.astro` components via vite's import-analysis
 * pipeline.
 */

import SqliteFileFormat from '../components/diagrams/SqliteFileFormat.astro';
import MvccTimeline from '../components/diagrams/MvccTimeline.astro';
import Replication from '../components/diagrams/Replication.astro';
import VectorIndex from '../components/diagrams/VectorIndex.astro';
import { LEGACY_DIAGRAM_NAMES } from './visuals-registry';

// Astro .astro default exports are factory functions; we don't depend on a
// specific public type. Use a permissive structural alias.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AstroComponent = (props: Record<string, any>) => any;

/** Legacy zero-prop diagram components, keyed by their PascalCase name. */
export const LEGACY_DIAGRAMS: Readonly<Record<string, AstroComponent>> = Object.freeze({
  SqliteFileFormat: SqliteFileFormat as unknown as AstroComponent,
  MvccTimeline: MvccTimeline as unknown as AstroComponent,
  Replication: Replication as unknown as AstroComponent,
  VectorIndex: VectorIndex as unknown as AstroComponent,
});

/** Get the legacy diagram component by PascalCase name. `null` if unknown. */
export function getLegacyDiagram(name: string): AstroComponent | null {
  return LEGACY_DIAGRAMS[name] ?? null;
}

/** Alias for getLegacyDiagram used by VisualModuleRenderer. */
export function getLegacyDiagramFactory(name: string): AstroComponent | null {
  return getLegacyDiagram(name);
}

// Re-export the names list so the existing import paths still work.
export { LEGACY_DIAGRAM_NAMES };
