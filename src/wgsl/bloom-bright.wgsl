//! WGSL module for the datahall bloom chain: bright-pass extract.
//! Bound by name (src_tex) to the scene target; rendered at half resolution.
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
