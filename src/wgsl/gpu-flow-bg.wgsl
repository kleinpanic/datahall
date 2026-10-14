//! GpuFlow backdrop: panel-dark vignette with faint grid and pulsing stage
//! gate lines at each stage boundary (params.stages).
struct Params { time: f32, stages: f32 }
@group(0) @binding(0) var<uniform> params: Params;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let d = distance(uv, vec2f(0.5));
  var col = mix(vec3f(0.043, 0.055, 0.075), vec3f(0.020, 0.026, 0.036), smoothstep(0.1, 0.9, d));
  let grid = step(0.9985, fract(uv.x * 36.0)) + step(0.9985, fract(uv.y * 10.0));
  col += vec3f(0.04, 0.07, 0.08) * grid * 0.30;
  let n = max(i32(params.stages + 0.5), 1);
  for (var k: i32 = 1; k < n; k = k + 1) {
    let fx = f32(k) / f32(n);
    let g = smoothstep(0.004, 0.0, abs(uv.x - fx));
    let pulse = 0.6 + 0.4 * sin(params.time * 1.6 + f32(k) * 1.3);
    col += vec3f(0.0, 0.55, 0.50) * g * 0.10 * pulse;
  }
  return vec4f(col, 1.0);
}
