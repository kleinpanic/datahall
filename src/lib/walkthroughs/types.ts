/**
 * Shared types for datahall's deterministic walkthrough traces.
 *
 * A walkthrough answers, for one method: what is the input, what state exists
 * before, what changes at each step, why that step, and what is the output.
 * Traces are pure and deterministic: the server renders the final state for
 * no-JS visitors, and the client replays the identical step list.
 *
 * Rendering contract (see Walkthrough.astro):
 *  - SVG/HTML elements that participate in the replay carry `data-wt="key"`.
 *  - Each step lists the keys it *reveals*; the client shows the cumulative
 *    union of reveals up to the current step. Keys never revealed anywhere
 *    stay permanently visible (structure).
 */

export interface WtStep {
  /** Short label shown in the step indicator. */
  title: string;
  /** Why this step: the algorithm's reasoning, not decoration. */
  note: string;
  /** Element keys revealed when this step becomes current. */
  reveal: string[];
}

export interface WtTrace {
  /** Which walkthrough mode this trace drives. */
  mode: string;
  /** What is shown + explicit teaching-model caveats, printed on the visual. */
  intro: string;
  steps: WtStep[];
  /** Final inspectable state: measurements of the run, as label/value pairs. */
  summary: Array<[string, string]>;
}
