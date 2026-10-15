#!/usr/bin/env node
/**
 * gpu-smoke -- headless GPU verification for datahall's real shader modules.
 *
 * Renders the production WGSL (src/wgsl/*.wgsl) through vgpu/node (Dawn) on
 * whatever adapter the machine exposes, asserts on actual pixels, and saves
 * PNG snapshots to test-results/gpu/.
 *
 *   node scripts/gpu-smoke.mjs                     # auto adapter discovery
 *   VGPU_ADAPTER=software node scripts/gpu-smoke.mjs  # force deterministic CPU pixels
 *
 * First-time setup on a machine without a usable driver:
 *   npx vgpu doctor                    # JSON verdict + exact fixes
 *   npx vgpu install-software-renderer # portable CPU renderer (explicit consent)
 *
 * Docs: https://vgpu.sh/docs/get-started/node.md
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { init, effect, target } from 'vgpu/node';
import { prepareShader } from '@vgpu/wgsl/prepare';

const W = 320;
const H = 180;
const OUT = new URL('../test-results/gpu/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

/** Load a production shader module and prepare it (parse + reflect) once. */
const wgsl = (name) =>
  prepareShader(readFileSync(new URL(`../src/wgsl/${name}`, import.meta.url), 'utf8'));

/** 0.6.x read API with a fallback to the older plain read(). */
async function readTarget(t) {
  try {
    return await t.color.read({ mipLevel: 0, region: 'all' });
  } catch {
    try {
      return await t.color.read();
    } catch {
      return await t.read();
    }
  }
}

function savePng(name, t, pixels) {
  const png = new PNG({ width: t.size[0], height: t.size[1] });
  png.data.set(pixels);
  writeFileSync(`${OUT}${name}.png`, PNG.sync.write(png));
}

function lumAt(px, x, y, stride) {
  const i = (y * stride + x) * 4;
  return px[i] + px[i + 1] + px[i + 2];
}

const gpu = await init();
try {
  // 1. GpuScene backdrop renders with real content (vignette + grid + reticle).
  const bgSrc = wgsl('gpu-scene-bg.wgsl');
  const sceneT = target(gpu, { size: [W, H] });
  const bgA = effect(gpu, bgSrc, { set: { params: { time: 1.25, qx: 0.1, qy: 0.0 } } });
  bgA.draw(sceneT);
  const px1 = await readTarget(sceneT);
  if (px1[((H >> 1) * W + (W >> 1)) * 4 + 3] !== 255) {
    throw new Error('scene bg alpha not opaque');
  }
  if (lumAt(px1, W >> 1, H >> 1, W) === lumAt(px1, 0, 0, W)) {
    throw new Error('scene bg is flat — vignette/grid missing');
  }
  savePng('gpu-scene-bg', sceneT, px1);

  // 2. Animation: different time + query position must produce different pixels.
  const sceneT2 = target(gpu, { size: [W, H] });
  const bgB = effect(gpu, bgSrc, { set: { params: { time: 2.75, qx: 0.2, qy: 0.1 } } });
  bgB.draw(sceneT2);
  const px2 = await readTarget(sceneT2);
  let identical = px1.length === px2.length;
  for (let i = 0; identical && i < px1.length; i++) if (px1[i] !== px2[i]) identical = false;
  if (identical) throw new Error('scene bg identical across time — animation uniform ignored');
  savePng('gpu-scene-bg-t2', sceneT2, px2);

  // 3. Bloom bright pass extracts the bright spot from a source target.
  const spotSrc = prepareShader(`
    @fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
      let d = distance(uv, vec2f(0.5));
      return vec4f(vec3f(1.0) * (1.0 - smoothstep(0.0, 0.25, d)), 1.0);
    }
  `);
  const srcT = target(gpu, { size: [W, H] });
  effect(gpu, spotSrc).draw(srcT);
  const brightT = target(gpu, { size: [W >> 1, H >> 1] });
  const bright = effect(gpu, wgsl('bloom-bright.wgsl'));
  bright.set({ src_tex: srcT });
  bright.draw(brightT);
  const bpx = await readTarget(brightT);
  let lit = 0;
  for (let i = 0; i < bpx.length; i += 4) if (bpx[i] + bpx[i + 1] + bpx[i + 2] > 30) lit++;
  if (lit === 0) throw new Error('bright pass produced nothing from a bright source');
  savePng('bloom-bright', brightT, bpx);

  // 4. Blur module (params-driven direction) compiles and spreads the spot.
  const blurT = target(gpu, { size: [W >> 1, H >> 1] });
  const blur = effect(gpu, wgsl('bloom-blur.wgsl'), {
    set: { params: { dirx: 1, diry: 0 } },
  });
  blur.set({ src_tex: brightT });
  blur.draw(blurT);
  const fpx = await readTarget(blurT);
  let blurLit = 0;
  for (let i = 0; i < fpx.length; i += 4) if (fpx[i] + fpx[i + 1] + fpx[i + 2] > 10) blurLit++;
  if (blurLit === 0) throw new Error('blur pass produced nothing');
  savePng('bloom-blur', blurT, fpx);

  // 5. GpuFlow modules: backdrop renders; trail decay actually decays.
  const flowBgT = target(gpu, { size: [W, H] });
  const flowBg = effect(gpu, wgsl('gpu-flow-bg.wgsl'), {
    set: { params: { time: 0.5, stages: 4 } },
  });
  flowBg.draw(flowBgT);
  const flowFadeT = target(gpu, { size: [W, H] });
  const flowFade = effect(gpu, wgsl('flow-fade.wgsl'), {
    set: { src_tex: flowBgT, params: { decay: 0.5 } },
  });
  flowFade.draw(flowFadeT);
  const fpx2 = await readTarget(flowFadeT);
  const flowPx = await readTarget(flowBgT);
  let sum2 = 0;
  for (let i = 0; i < fpx2.length; i += 4) sum2 += fpx2[i] + fpx2[i + 1] + fpx2[i + 2];
  let sum1 = 0;
  for (let i = 0; i < flowPx.length; i += 4) sum1 += flowPx[i] + flowPx[i + 1] + flowPx[i + 2];
  if (sum2 === 0 || sum2 >= sum1) throw new Error('flow fade did not decay the source');
  savePng('flow-fade', flowFadeT, fpx2);

  const adapter = gpu.adapter ? JSON.stringify(gpu.adapter) : '"auto"';
  console.log(`GPU_SMOKE_OK adapter=${adapter} frames=6 out=${OUT}`);
} finally {
  // Stops Dawn's polling so the process exits on its own.
  gpu.dispose();
}
