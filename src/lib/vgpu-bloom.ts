/**
 * vgpu-bloom -- the vgpu.sh house look for datahall: an HDR bloom chain.
 *
 * https://vgpu.sh
 *
 * scene target -> bright pass (half res) -> separable blur -> downsample
 * (quarter res) -> blur -> composite (scene + bloom, ACES-ish tonemap,
 * gentle vignette) onto the output surface. All taps use textureLoad, so
 * no samplers are involved; every pass is a vgpu fullscreen effect bound
 * to the previous target by name.
 *
 * The WGSL lives in real shader modules under src/wgsl/ and is turned into
 * prepared `ShaderSource` artifacts at build time by `wgslVitePlugin`
 * (see astro.config.mjs) -- the browser never loads the WGSL parser.
 */
import type { Frame, Surface, Target } from 'vgpu';

/** Texture format type without relying on ambient WebGPU globals in lib code. */
type TextureFormat = Target['format'];
import type { GpuContext, VgpuModule } from './vgpu-runtime';
import brightShader from '../wgsl/bloom-bright.wgsl';
import blurShader from '../wgsl/bloom-blur.wgsl';
import downShader from '../wgsl/bloom-down.wgsl';
import compositeShader from '../wgsl/bloom-composite.wgsl';

// LDR bloom targets: rgba16float HDR chains crash software rasterizers
// (SwiftShader/lavapipe) under multi-mount load; bgra8unorm keeps the look
// at a fraction of the bandwidth.
const HDR: TextureFormat = 'bgra8unorm';

export interface BloomChain {
  /** Target the scene content renders into (before post-processing). */
  readonly scene: Target;
  prewarm(outputFormat: TextureFormat): Promise<void>;
  resize(size: readonly [number, number]): void;
  render(frame: Frame, output: Surface, opts?: BloomRenderOptions): void;
  destroy(): void;
}

export interface BloomRenderOptions {
  strength?: number;
  time?: number;
}

interface MutableTarget extends Target {
  destroy?(): void;
}

export function createBloomChain(
  vgpu: VgpuModule,
  gpu: GpuContext,
  size: readonly [number, number],
): BloomChain {
  const half = ([w, h]: readonly [number, number]) =>
    [Math.max(1, Math.floor(w / 2)), Math.max(1, Math.floor(h / 2))] as const;
  const quarter = ([w, h]: readonly [number, number]) =>
    [Math.max(1, Math.floor(w / 4)), Math.max(1, Math.floor(h / 4))] as const;

  const sceneT = vgpu.target(gpu, { size, format: HDR }) as MutableTarget;
  const h1 = vgpu.target(gpu, { size: half(size), format: HDR }) as MutableTarget;
  const h2 = vgpu.target(gpu, { size: half(size), format: HDR }) as MutableTarget;
  const q1 = vgpu.target(gpu, { size: quarter(size), format: HDR }) as MutableTarget;
  const q2 = vgpu.target(gpu, { size: quarter(size), format: HDR }) as MutableTarget;

  const bright = vgpu.effect(gpu, brightShader);
  const blurH1 = vgpu.effect(gpu, blurShader);
  const blurV1 = vgpu.effect(gpu, blurShader);
  const down = vgpu.effect(gpu, downShader);
  const blurH2 = vgpu.effect(gpu, blurShader);
  const blurV2 = vgpu.effect(gpu, blurShader);
  const composite = vgpu.effect(gpu, compositeShader);

  // Textures bind by name (official vgpu pattern); blur direction is fixed per instance.
  bright.set({ src_tex: sceneT });
  blurH1.set({ src_tex: h1, params: { dirx: 1, diry: 0 } });
  blurV1.set({ src_tex: h2, params: { dirx: 0, diry: 1 } });
  down.set({ src_tex: h1 });
  blurH2.set({ src_tex: q1, params: { dirx: 1, diry: 0 } });
  blurV2.set({ src_tex: q2, params: { dirx: 0, diry: 1 } });

  return {
    scene: sceneT,
    async prewarm(outputFormat: TextureFormat): Promise<void> {
      // Sequential on purpose: a burst of concurrent pipeline compilations
      // can crash software rasterizers while another mount is rendering.
      await bright.compile({ colors: [HDR] });
      await blurH1.compile({ colors: [HDR] });
      await blurV1.compile({ colors: [HDR] });
      await down.compile({ colors: [HDR] });
      await blurH2.compile({ colors: [HDR] });
      await blurV2.compile({ colors: [HDR] });
      await composite.compile({ colors: [outputFormat] });
    },
    resize(next: readonly [number, number]): void {
      sceneT.resize(next);
      const hn = half(next);
      const qn = quarter(next);
      h1.resize(hn);
      h2.resize(hn);
      q1.resize(qn);
      q2.resize(qn);
    },
    render(frame: Frame, output: Surface, opts: BloomRenderOptions = {}): void {
      const strength = opts.strength ?? 0.8;
      const time = opts.time ?? 0;
      frame.pass({ target: h1 }, (p) => p.draw(bright));
      frame.pass({ target: h2 }, (p) => p.draw(blurH1));
      frame.pass({ target: h1 }, (p) => p.draw(blurV1));
      frame.pass({ target: q1 }, (p) => p.draw(down));
      frame.pass({ target: q2 }, (p) => p.draw(blurH2));
      frame.pass({ target: q1 }, (p) => p.draw(blurV2));
      composite.set({
        scene_tex: sceneT,
        bloom1_tex: h1,
        bloom2_tex: q1,
        params: { strength, time },
      });
      frame.pass({ target: output }, (p) => p.draw(composite));
    },
    destroy(): void {
      for (const t of [sceneT, h1, h2, q1, q2]) t.destroy?.();
    },
  };
}
