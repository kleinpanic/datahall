//! GpuFlow instanced packet field: data packets streaming left-to-right in
//! lanes, tinted per stage segment, brightening at stage gates. Layout is
//! hash(params.seed) so one static pipeline serves any diagram seed.
struct Params { time: f32, stages: f32, seed: f32 }
@group(0) @binding(0) var<uniform> params: Params;

fn hash(n: f32, seed: f32) -> f32 {
  return fract(sin(n * 12.9898 + seed) * 43758.5453);
}

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
  @location(1) color: vec3f,
  @location(2) alpha: f32,
}

@vertex
fn vs_main(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
  var corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
    vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0)
  );
  let i = f32(ii);
  let nStages = max(params.stages, 1.0);

  let speed = 0.05 + hash(i * 5.1, params.seed) * 0.07;
  let x = fract(params.time * speed + hash(i * 1.7, params.seed));
  let lane = (hash(i * 2.3, params.seed) - 0.5);
  let y = 0.5 + lane * 0.44 + 0.02 * sin(params.time * 1.4 + i);
  let size = 0.007 + hash(i * 3.9, params.seed) * 0.009;

  // Per-stage-segment palette (teal / violet / amber / rose).
  let seg = floor(x * nStages);
  let cpick = hash(seg * 13.7 + 3.1, params.seed);
  var col = vec3f(0.17, 0.83, 0.75);
  if (cpick > 0.75) { col = vec3f(1.0, 0.70, 0.28); }
  else if (cpick > 0.5) { col = vec3f(0.49, 0.36, 1.0); }
  else if (cpick > 0.25) { col = vec3f(1.0, 0.36, 0.56); }

  // Fade at both ends; brighten while crossing a stage gate.
  var a = smoothstep(0.0, 0.05, x) * (1.0 - smoothstep(0.95, 1.0, x));
  let fx = fract(x * nStages);
  let gate = smoothstep(0.10, 0.0, min(fx, 1.0 - fx));
  a *= 0.55 + 0.45 * gate;

  var out: VOut;
  let half2 = corners[vi] * vec2f(size * 0.25, size);
  out.pos = vec4f(vec2f(x, y) * 2.0 - 1.0 + half2, 0.0, 1.0);
  out.uv = corners[vi];
  out.color = col * 1.5;
  out.alpha = a;
  return out;
}

struct FIn {
  @location(0) uv: vec2f,
  @location(1) color: vec3f,
  @location(2) alpha: f32,
}

@fragment
fn fs_main(in: FIn) -> @location(0) vec4f {
  let r = length(in.uv);
  let disk = 1.0 - smoothstep(0.70, 1.0, r);
  if (disk <= 0.0) { discard; }
  var col = in.color * (0.45 + 0.55 * (1.0 - r));
  return vec4f(col, disk * clamp(in.alpha, 0.0, 1.0));
}
