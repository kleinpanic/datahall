# Animation System

All animation in datahall is CSS-driven, intentionally minimal, and respects
`prefers-reduced-motion`.

## Tokens

Defined in `src/styles/global.css` under `@layer components`:

| class        | effect                                               |
| ------------ | ---------------------------------------------------- |
| `dh-pulse`   | opacity pulse for in-flight data lines               |
| `dh-dash`    | marching-ants stroke for asynchronous / pending flow |
| `dh-fade-up` | one-shot fade + small upward translate for cards     |

## Reduce-motion support

```css
@media (prefers-reduced-motion: reduce) {
  .dh-pulse,
  .dh-dash,
  .dh-fade-up {
    animation: none !important;
  }
}
```

(Note: the Phase 1 implementation does not yet include this override; it
will be added in Phase 2 along with the TUI consumer.)

## When we reach for JS

A diagram needs JavaScript when:

- Geometry depends on data (e.g. drawing many nodes).
- Pointer interactivity matters (hover, click).
- The diagram must respond to live query state.

None of the Phase 1 diagrams fall into that category. They are static SVG.
