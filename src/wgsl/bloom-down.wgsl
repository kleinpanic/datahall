//! WGSL module for the datahall bloom chain: half -> quarter downsample.
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
