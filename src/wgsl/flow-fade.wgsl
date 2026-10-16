//! GpuFlow trail decay: copies the previous frame's trail buffer multiplied
//! by a decay factor. Drawn without blending — plain overwrite — so the
//! write target always holds exactly "decayed trails".
@group(0) @binding(0) var src_tex: texture_2d<f32>;

struct Params {
  decay: f32,
}
@group(0) @binding(1) var<uniform> params: Params;

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let sd = vec2i(textureDimensions(src_tex));
  let p = clamp(vec2i(pos.xy), vec2i(0), sd - vec2i(1));
  // Clamp so accumulating trails can never blow out to white streaks.
  let col = min(textureLoad(src_tex, p, 0).rgb * params.decay, vec3f(1.6));
  return vec4f(col, 1.0);
}
