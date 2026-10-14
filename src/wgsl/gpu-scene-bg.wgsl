//! GpuScene backdrop: panel-dark vignette, faint grid, and the amber query
//! reticle that follows the CPU-computed query position (params.qx/qy).
struct Params { time: f32, qx: f32, qy: f32 }
@group(0) @binding(0) var<uniform> params: Params;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let aspect = 16.0 / 9.0;
  let d = distance(uv, vec2f(0.5));
  let bg = mix(vec3f(0.055, 0.070, 0.090), vec3f(0.016, 0.022, 0.030), smoothstep(0.15, 0.85, d));
  let q = vec2f(params.qx, params.qy) * 0.5 + vec2f(0.5, 0.5);
  let rq = distance(vec2f(uv.x * aspect, uv.y), vec2f(q.x * aspect, q.y));
  let pulse = 0.5 + 0.5 * sin(params.time * 2.2);
  var ring = smoothstep(0.014, 0.004, abs(rq - (0.022 + 0.008 * pulse)));
  ring += 0.35 * smoothstep(0.030, 0.0, rq);
  var col = bg + vec3f(1.0, 0.85, 0.55) * ring * 0.85;
  let grid = step(0.9985, fract(uv.x * 40.0)) + step(0.9985, fract(uv.y * 22.5));
  col += vec3f(0.05, 0.08, 0.09) * grid * 0.35;
  return vec4f(col, 1.0);
}
