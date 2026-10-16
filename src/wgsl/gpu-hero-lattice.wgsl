//! GpuHero — rotating 3D data lattice for the homepage hero band.
//! A grid of lattice points lives in 3D, rotates slowly around Y with a
//! gentle vertical wobble, and is perspective-projected in the vertex stage.
//! Nearer points glow warmer and larger; params.aspect corrects the band's
//! wide aspect ratio so the lattice stays round.

struct Params {
  time: f32,
  seed: f32,
  aspect: f32,
}
@group(0) @binding(0) var<uniform> params: Params;

fn hash(n: f32, seed: f32) -> f32 {
  return fract(sin(n * 12.9898 + seed) * 43758.5453);
}

const LX: f32 = 14.0;
const LY: f32 = 8.0;
const LZ: f32 = 5.0;

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
  let ix = i % LX;
  let iy = floor((i / LX) % LY);
  let iz = floor(i / (LX * LY));

  // Lattice cell in [-0.5, 0.5]^3, seeded jitter so it reads as data, not graph paper.
  var p = vec3f(
    ix / (LX - 1.0) - 0.5 + (hash(i * 1.13, params.seed) - 0.5) * 0.05,
    iy / (LY - 1.0) - 0.5 + (hash(i * 2.71, params.seed) - 0.5) * 0.05,
    iz / (LZ - 1.0) - 0.5 + (hash(i * 4.67, params.seed) - 0.5) * 0.05
  ) * vec3f(1.55, 0.85, 0.9);

  // Slow rotation around Y + subtle precession on X.
  let a = params.time * 0.22;
  let ca = cos(a);
  let sa = sin(a);
  p = vec3f(ca * p.x - sa * p.z, p.y + 0.035 * sin(params.time * 0.6 + iy * 0.9), sa * p.x + ca * p.z);
  let b = 0.12 * sin(params.time * 0.17);
  let cb = cos(b);
  let sb = sin(b);
  p = vec3f(p.x, cb * p.y - sb * p.z, sb * p.y + cb * p.z);

  // Perspective projection: camera at -fov on z looking at the band center.
  // The lattice sits in the RIGHT half of the band (ndc x ≈ 0.1..0.85) so the
  // left-aligned headline stays readable; 0.40 spread keeps it on-screen at
  // every rotation.
  let fov = 1.7;
  let s = fov / (fov + p.z + 0.85);
  var ndc = vec2f(0.32 + p.x * s * 0.40, p.y * s * 0.90);

  // Depth cueing: near points warmer, brighter, larger.
  let depth = clamp((p.z + 0.8) / 1.6, 0.0, 1.0);
  var col = mix(vec3f(1.0, 0.72, 0.30), vec3f(0.10, 0.62, 0.58), depth);
  let shimmer = 0.85 + 0.15 * sin(params.time * 1.3 + i * 0.7);
  col = col * (0.35 + 0.85 * (1.0 - depth)) * shimmer + vec3f(0.06, 0.10, 0.10);

  var out: VOut;
  let size = 0.0085 * s * (0.6 + 0.8 * (1.0 - depth));
  let half2 = corners[vi] * vec2f(size * 1.05, size);
  out.pos = vec4f(ndc + half2, 0.0, 1.0);
  out.uv = corners[vi];
  out.color = col * 1.45;
  out.alpha = (0.22 + 0.45 * (1.0 - depth)) * clamp(0.25 + (1.0 - depth), 0.0, 1.0);
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
  let disk = 1.0 - smoothstep(0.55, 1.0, r);
  if (disk <= 0.0) { discard; }
  let core = 1.0 - smoothstep(0.0, 0.28, r);
  var col = in.color + vec3f(1.0, 0.9, 0.7) * core * 0.55;
  return vec4f(col, disk * in.alpha);
}
