# Animation System

All animation in datahall is CSS-driven, intentionally minimal, and respects
`prefers-reduced-motion` — with one deliberate exception: the WebGPU scenes
(see below).

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

`VisualModuleRenderer.astro` additionally ships a renderer-level override
that pins `animation-duration` / `transition-duration` to ~0 for everything
inside a mounted visual, so no visual kind can opt out of reduced motion.

## When we reach for JS

A diagram needs JavaScript when:

- Geometry depends on data (e.g. drawing many nodes).
- Pointer interactivity matters (hover, click).
- The diagram must respond to live query state.

Most visuals stay static SVG. The one current exception is `gpu-scene`.

## WebGPU scenes (vgpu)

`gpu-scene` visuals (rendered by `GpuScene.astro`) animate via
[vgpu](https://vgpu.sh), a WebGPU compute/graphics runtime. The rules:

1. **Server-first:** a static SVG storyboard is rendered from the same
   deterministic hash the WGSL shader uses, so the visual is complete before
   any script runs.
2. **Conditional boot:** the client script only initializes vgpu when
   `navigator.gpu` exists **and** the visitor has not requested
   `prefers-reduced-motion: reduce`. Under reduced motion or without WebGPU
   the static storyboard is the final render — no spinner, no flicker.
3. **Graceful failure:** any vgpu/WebGPU error leaves the storyboard in place;
   the e2e smoke test asserts both the canvas attachment and the fallback SVG.

Full mount contract, shader layout, and telemetry kinds:
[`vgpu-visuals.md`](vgpu-visuals.md).
