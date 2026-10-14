//! WGSL module for the datahall bloom chain: separable 9-tap blur.
//! One instance per axis; direction comes in through params.
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
