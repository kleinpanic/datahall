/**
 * vgpu-runtime -- shared client runtime for datahall's GPU visuals.
 *
 * https://vgpu.sh
 *
 * One page = one GPU context. Every mount (gpu-scene, gpu-flow, and the
 * HNSW playground) draws from the same `init()`; a failed init degrades
 * all mounts to their static fallbacks together instead of leaving a mix
 * of working and errored canvases. The vgpu module itself stays dynamic
 * so non-WebGPU visitors never download it.
 *
 * `mountGpuScene()` is the single lifecycle controller shared by every
 * mount. It guarantees, for each mount:
 *
 *  - boot is deferred until the mount is near the viewport;
 *  - the readable static fallback stays until a frame has verifiably
 *    completed on the GPU (`Frame.done`), and is restored after any
 *    failure, device loss, or a `prefers-reduced-motion` change;
 *  - rendering pauses while the mount is off-screen or the tab hidden;
 *  - every observer, listener, loop, and render target is released when
 *    the mount disconnects.
 */

import type { Clock, Frame, Surface } from 'vgpu';

export type VgpuModule = typeof import('vgpu');
export type GpuContext = Awaited<ReturnType<VgpuModule['init']>>;

/**
 * Singletons live on globalThis so every bundled script chunk (each Astro
 * component script gets its own chunk) shares one vgpu module instance and
 * one GPU context. Multiple `init()` calls on one page can destroy each
 * other's devices -- this guarantees exactly one.
 */
interface GpuGlobal {
  __DATAGHALL_VGPU__?: Promise<VgpuModule>;
  __DATAGHALL_GPU__?: Promise<GpuContext>;
  __DATAGHALL_BOOT_Q__?: Promise<unknown>;
}
const g = globalThis as GpuGlobal;

export function loadVgpu(): Promise<VgpuModule> {
  g.__DATAGHALL_VGPU__ ??= import('vgpu');
  return g.__DATAGHALL_VGPU__;
}

/** Single shared GPU context for the page (created lazily, held for the page lifetime). */
export function sharedGpu(): Promise<GpuContext> {
  g.__DATAGHALL_GPU__ ??= loadVgpu().then((vgpu) => vgpu.init());
  return g.__DATAGHALL_GPU__;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function browserHasWebGpu(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Serializes mount bootstraps across every script chunk: one mount sets up
 * (surface, pipelines, prewarm) at a time. Software rasterizers crash when
 * pipeline compilation bursts overlap an active render loop, and even on
 * real GPUs this avoids first-frame jank.
 */
export function serializeBoot<T>(fn: () => Promise<T>): Promise<T> {
  const q = (g.__DATAGHALL_BOOT_Q__ ??= Promise.resolve());
  const run = q.then(fn, fn);
  g.__DATAGHALL_BOOT_Q__ = run.catch(() => undefined);
  return run;
}

/** Why a mount left (or never entered) GPU mode. */
export type FallbackReason = 'unsupported' | 'reduced-motion' | 'error' | 'device-lost';

/** Per-mount renderer returned by the component's `build` callback. */
export interface GpuMountRenderer {
  /** Encode one frame. Called only while the mount is active and on-screen. */
  render(frame: Frame, timeSeconds: number): void;
  destroy(): void;
}

/** Everything a `build` callback may use; owned by the controller, not the component. */
export interface GpuMountContext {
  vgpu: VgpuModule;
  gpu: GpuContext;
  surface: Surface;
  clock: Clock;
}

export interface GpuMountOptions {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  fps: number;
  /** Create pipelines and return the renderer. Runs serialized, near-viewport only. */
  build(ctx: GpuMountContext): Promise<GpuMountRenderer>;
  /** Called exactly once, after the first submitted frame has completed on the GPU. */
  onActive(): void;
  /** Restore the readable static fallback. May be called multiple times across reasons. */
  onFallback(reason: FallbackReason): void;
}

interface Boot {
  stopLoop(): void;
  renderer: GpuMountRenderer;
  surface: Surface;
}

/**
 * Lifecycle controller for one GPU mount. See module docs for the guarantees.
 * Safe to call unconditionally: without WebGPU or under reduced motion it
 * reports the fallback and keeps watching for preference changes.
 */
export function mountGpuScene(opts: GpuMountOptions): void {
  const { el, canvas } = opts;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!browserHasWebGpu()) {
    opts.onFallback('unsupported');
    return;
  }

  let disposed = false;
  let booted = false;
  let activated = false;
  let deviceLossRetried = false;
  let boot: Boot | null = null;
  const cleanups: Array<() => void> = [];
  const onCleanup = (fn: () => void) => cleanups.push(fn);

  function teardown(): void {
    if (boot) {
      boot.stopLoop();
      boot.renderer.destroy();
      boot.surface.dispose();
      boot = null;
    }
    activated = false;
    booted = false;
  }

  function fallback(reason: FallbackReason): void {
    teardown();
    opts.onFallback(reason);
  }

  async function bootNow(): Promise<void> {
    if (disposed || booted) return;
    booted = true;
    try {
      await serializeBoot(async () => {
        if (disposed) return;
        const vgpu = await loadVgpu();
        const gpu = await sharedGpu();
        if (disposed) return;

        // One live surface per canvas (VGPU-SURFACE-DUPLICATE otherwise).
        const surface = vgpu.surface(gpu, canvas, { dpr: [1, 2] });
        const clock = vgpu.clock(gpu);
        const renderer = await opts.build({ vgpu, gpu, surface, clock });

        let deviceLost = false;

        const loopHandle = vgpu.frameLoop(
          gpu,
          (frame) => {
            // Off-screen or hidden tab: skip encoding entirely.
            if (deviceLost || !mountVisible || document.visibilityState === 'hidden') return;
            try {
              renderer.render(frame, clock.time);
              if (!activated) {
                activated = true;
                // "Successful frame actually rendered": resolve on GPU completion.
                frame.done
                  .then(() => {
                    if (!disposed && !deviceLost) opts.onActive();
                  })
                  .catch(() => undefined);
              }
            } catch (err) {
              console.warn('[vgpu] render tick failed:', err);
              fallback('error');
            }
          },
          { fps: opts.fps },
        );

        // Device loss: restore the fallback, then try one full re-boot (driver reset).
        void (gpu.gpu.lost as Promise<unknown>).then(() => {
          if (disposed) return;
          console.warn('[vgpu] device lost:', el.dataset.vgpuLabel ?? el);
          deviceLost = true;
          // The shared context's device is gone; drop the cached promise so a
          // re-boot creates a fresh device instead of reusing a dead one.
          g.__DATAGHALL_GPU__ = undefined;
          fallback('device-lost');
          if (!deviceLossRetried) {
            deviceLossRetried = true;
            window.setTimeout(() => void bootNearViewport(), 250);
          }
        });

        boot = {
          stopLoop: () => loopHandle.stop(),
          renderer,
          surface,
        };
      });
    } catch (err) {
      console.warn('[vgpu] mount failed:', err);
      fallback('error');
    }
  }

  // ---- viewport: defer boot until near the viewport, skip frames off-screen
  let mountVisible = true;
  let seenNearViewport = false;
  const nearWatchers: Array<() => void> = [];
  if (typeof IntersectionObserver === 'undefined') {
    seenNearViewport = true;
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        mountVisible = entries.some((e) => e.isIntersecting);
        if (mountVisible && !seenNearViewport) {
          seenNearViewport = true;
          for (const wake of nearWatchers.splice(0)) wake();
        }
      },
      { rootMargin: '160px' },
    );
    io.observe(el);
    onCleanup(() => io.disconnect());
  }

  function whenNearViewport(): Promise<void> {
    if (seenNearViewport || disposed) return Promise.resolve();
    return new Promise((resolve) => nearWatchers.push(resolve));
  }

  async function bootNearViewport(): Promise<void> {
    await whenNearViewport();
    await bootNow();
  }

  // ---- reduced motion, including live preference changes -----------------
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotionPrefChange = () => {
    if (disposed) return;
    if (mq.matches) {
      if (booted) fallback('reduced-motion');
    } else if (!booted) {
      void bootNearViewport();
    }
  };
  mq.addEventListener('change', onMotionPrefChange);
  onCleanup(() => mq.removeEventListener('change', onMotionPrefChange));

  // ---- pause when the tab is hidden -------------------------------------
  // rAF stalls while hidden, and the frame callback additionally checks
  // document.visibilityState before encoding. No listener needed; keeping
  // this block as the documented pause contract for the controller.

  // ---- release everything when the mount leaves the DOM ------------------
  const mo = new MutationObserver(() => {
    if (!el.isConnected) {
      disposed = true;
      teardown();
      for (const fn of cleanups) fn();
      mo.disconnect();
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  if (mq.matches) {
    opts.onFallback('reduced-motion');
    return;
  }
  void bootNearViewport();
}

/**
 * IntersectionObserver-backed visibility flag. Returns a getter the frame
 * loop consults to skip encoding while the mount is off-screen.
 * (Retained for mount scripts that manage their own loops.)
 */
export function watchVisibility(el: HTMLElement): () => boolean {
  let visible = true;
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
      },
      { rootMargin: '80px' },
    );
    io.observe(el);
  }
  return () => visible;
}
