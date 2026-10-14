/**
 * vgpu-bloom -- the vgpu.sh house look for datahall: an HDR bloom chain.
 *
 * https://vgpu.sh
 *
 * scene target (rgba16float) -> bright pass (half res) -> separable blur
 * -> downsample (quarter res) -> blur -> composite (scene + bloom,
 * ACES-ish tonemap, gentle vignette) onto the output surface. All taps
 * use textureLoad, so no samplers are involved; every pass is a vgpu
 * fullscreen effect bound to the previous target by name.
 */
import type { Frame, Surface, Target } from 'vgpu';

/** Texture format type without relying on ambient WebGPU globals in lib code. */
type TextureFormat = Target['format'];
import type { GpuContext, VgpuModule } from './vgpu-runtime';

// LDR bloom targets: rgba16float HDR chains crash software rasterizers
// (SwiftShader/lavapipe) under multi-mount load; bgra8unorm keeps the look
// at a fraction of the bandwidth.
const HDR: TextureFormat = 'bgra8unorm';

const BRIGHT_WGSL = /* wgsl */ `
@group(0) @binding(0) var src_tex: texture_2d<f32>;

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let sd = vec2i(textureDimensions(src_tex));
  let c = vec2f(vec2i(pos.xy)) * 2.0;
  var acc = vec3f(0.0);
  for (var j = 0; j < 2; j = j + 1) {
    for (var i = 0; i < 2; i = i + 1) {
      let p = clamp(vec2i(c) + vec2i(i, j), vec2i(0), sd - vec2i(1));
      acc = acc + textureLoad(src_tex, p, 0).rgb;
    }
  }
  let col = acc * 0.25;
  let l = dot(col, vec3f(0.299, 0.587, 0.114));
  let w = smoothstep(0.42, 1.0, l);
  return vec4f(col * w, 1.0);
}
`;

const BLUR_WGSL = /* wgsl */ `
@group(0) @binding(0) var src_tex: texture_2d<f32>;

struct Params {
  dirx: f32,
  diry: f32,
}
@group(0) @binding(1) var<uniform> params: Params;

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let sd = vec2i(textureDimensions(src_tex));
  let p = vec2i(pos.xy);
  let dir = vec2i(i32(params.dirx), i32(params.diry));
  var acc = vec3f(0.0);
  var wsum = 0.0;
  for (var k = -4; k <= 4; k = k + 1) {
    let q = clamp(p + dir * k, vec2i(0), sd - vec2i(1));
    let w = exp(-0.125 * f32(k * k));
    acc = acc + textureLoad(src_tex, q, 0).rgb * w;
    wsum = wsum + w;
  }
  return vec4f(acc / wsum, 1.0);
}
`;

const DOWN_WGSL = /* wgsl */ `
@group(0) @binding(0) var src_tex: texture_2d<f32>;

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let sd = vec2i(textureDimensions(src_tex));
  let d = vec2i(pos.xy);
  var acc = vec3f(0.0);
  for (var j = 0; j < 2; j = j + 1) {
    for (var i = 0; i < 2; i = i + 1) {
      let p = clamp(d * 2 + vec2i(i, j), vec2i(0), sd - vec2i(1));
      acc = acc + textureLoad(src_tex, p, 0).rgb;
    }
  }
  return vec4f(acc * 0.25, 1.0);
}
`;

const COMPOSITE_WGSL = /* wgsl */ `
@group(0) @binding(0) var scene_tex: texture_2d<f32>;
@group(0) @binding(1) var bloom1_tex: texture_2d<f32>;
@group(0) @binding(2) var bloom2_tex: texture_2d<f32>;

struct Params {
  strength: f32,
  time: f32,
}
@group(0) @binding(3) var<uniform> params: Params;

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let sd = vec2i(textureDimensions(scene_tex));
  let p = clamp(vec2i(pos.xy), vec2i(0), sd - vec2i(1));
  let scene = textureLoad(scene_tex, p, 0).rgb;
  let b1d = vec2i(textureDimensions(bloom1_tex));
  let b1 = textureLoad(bloom1_tex, clamp(vec2i(pos.xy) / 2, vec2i(0), b1d - vec2i(1)), 0).rgb;
  let b2d = vec2i(textureDimensions(bloom2_tex));
  let b2 = textureLoad(bloom2_tex, clamp(vec2i(pos.xy) / 4, vec2i(0), b2d - vec2i(1)), 0).rgb;
  let breathe = 0.92 + 0.08 * sin(params.time * 0.7);
  var col = scene + (b1 * 0.85 + b2 * 1.15) * params.strength * breathe;
  // ACES-ish filmic tonemap keeps the bloom from clipping harshly.
  col = clamp((col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14), vec3f(0.0), vec3f(1.0));
  let uv = vec2f(pos.xy) / vec2f(sd);
  let v = 1.0 - 0.22 * smoothstep(0.55, 1.05, distance(uv, vec2f(0.5)));
  return vec4f(col * v, 1.0);
}
`;

export interface BloomChain {
  /** HDR target the scene content renders into (before post-processing). */
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

  const bright = vgpu.effect(gpu, BRIGHT_WGSL);
  const blurH1 = vgpu.effect(gpu, BLUR_WGSL);
  const blurV1 = vgpu.effect(gpu, BLUR_WGSL);
  const down = vgpu.effect(gpu, DOWN_WGSL);
  const blurH2 = vgpu.effect(gpu, BLUR_WGSL);
  const blurV2 = vgpu.effect(gpu, BLUR_WGSL);
  const composite = vgpu.effect(gpu, COMPOSITE_WGSL);

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
