//! GpuScene instanced point field: the hnsw-layers scene. Layer assignment
//! and layout come from hash(params.seed) so one static pipeline serves any
//! mount seed; layer visibility cycles over a 12 s loop.
struct Params { time: f32, qx: f32, qy: f32, seed: f32 }
@group(0) @binding(0) var<uniform> params: Params;

fn hash(n: f32, seed: f32) -> f32 {
  return fract(sin(n * 12.9898 + seed) * 43758.5453);
}

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) glow: f32,
  @location(2) layer: f32,
}

@vertex
fn vs_main(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
    vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0)
  );
  let i = f32(ii);
  let px = hash(i * 2.0, params.seed) * 1.8 - 0.9;
  let py = hash(i * 2.0 + 1.0, params.seed) * 1.0 - 0.5;
  let lr = hash(i * 3.0 + 7.31, params.seed);
  var layer = 0.0;
  var size = 0.009;
  if (lr > 0.965) { layer = 2.0; size = 0.026; }
  else if (lr > 0.86) { layer = 1.0; size = 0.015; }

  let cyc = params.time % 12.0;
  var vis = 1.0;
  if (layer < 1.5 && layer > 0.5) { vis = smoothstep(3.0, 4.5, cyc); }
  else if (layer < 0.5) { vis = smoothstep(6.5, 8.0, cyc); }
  vis *= 1.0 - smoothstep(11.2, 11.9, cyc);

  let d = distance(vec2f(px, py), vec2f(params.qx, params.qy));
  let near = 1.0 - smoothstep(0.02, 0.34, d);
  let pulse = 0.72 + 0.28 * sin(params.time * 2.2);

  var out: VOut;
  let half2 = corners[vi] * vec2f(size * 0.5625, size);
  out.pos = vec4f(vec2f(px, py) + half2, 0.0, 1.0);
  out.uv = corners[vi];
  out.glow = (near * pulse + 0.22 + 0.30 * layer) * vis;
  out.layer = layer;
  return out;
}

struct FIn {
  @location(0) uv: vec2f,
  @location(1) glow: f32,
  @location(2) layer: f32,
}

@fragment
fn fs_main(in: FIn) -> @location(0) vec4f {
  let r = length(in.uv);
  let disk = 1.0 - smoothstep(0.80, 1.0, r);
  if (disk <= 0.0) { discard; }
  var col = vec3f(0.16, 0.62, 0.56);
  if (in.layer > 1.5) { col = vec3f(1.0, 0.70, 0.28); }
  else if (in.layer > 0.5) { col = vec3f(0.49, 0.36, 1.0); }
  col = col * (0.30 + 0.70 * in.glow) + vec3f(1.0) * in.glow * 0.30;
  return vec4f(col * 1.7, disk * clamp(0.18 + in.glow, 0.0, 1.0));
}
