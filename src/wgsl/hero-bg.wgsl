//! GpuHero backdrop: slow-drifting simplex nebula, vignette. Built on the
//! official @vgpu/wgsl-std library — imported and resolved through the same
//! WGSL module pipeline as every other scene shader.
import { fbmSimplex2d } from "@vgpu/wgsl-std/noise/simplex";

struct Params { time: f32 }
@group(0) @binding(0) var<uniform> params: Params;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let drift = vec2f(params.time * 0.015, params.time * -0.008);
  let n1 = fbmSimplex2d(uv * 3.0 + drift, 4, 2.0, 0.5);
  let n2 = fbmSimplex2d(uv * 6.0 - drift * 1.5, 3, 2.0, 0.55);
  let nebula = clamp(n1 * 0.5 + n2 * 0.5, -1.0, 1.0) * 0.5 + 0.5;
  var col = mix(vec3f(0.012, 0.018, 0.028), vec3f(0.035, 0.10, 0.105), nebula);
  col += vec3f(0.16, 0.10, 0.03) * pow(max(n2, 0.0), 3.0) * 0.6;
  let vign = 1.0 - 0.35 * smoothstep(0.35, 0.95, distance(uv, vec2f(0.5)));
  return vec4f(col * vign, 1.0);
}
