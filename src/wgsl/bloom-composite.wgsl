//! WGSL module for the datahall bloom chain: scene + bloom composite with
//! ACES-ish filmic tonemap and a gentle vignette.
@group(0) @binding(0) var scene_tex: texture_2d<f32>;
@group(0) @binding(1) var bloom1_tex: texture_2d<f32>;
@group(0) @binding(2) var bloom2_tex: texture_2d<f32>;

struct Params {
  strength: f32,
  time: f32,
}
@group(0) @binding(3) var<uniform> params: Params;

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let sd = vec2i(textureDimensions(scene_tex));
  let p = clamp(vec2i(pos.xy), vec2i(0), sd - vec2i(1));
  let scene = textureLoad(scene_tex, p, 0).rgb;
  let b1d = vec2i(textureDimensions(bloom1_tex));
  let b1 = textureLoad(bloom1_tex, clamp(vec2i(pos.xy) / 2, vec2i(0), b1d - vec2i(1)), 0).rgb;
  let b2d = vec2i(textureDimensions(bloom2_tex));
  let b2 = textureLoad(bloom2_tex, clamp(vec2i(pos.xy) / 4, vec2i(0), b2d - vec2i(1)), 0).rgb;
  let breathe = 0.92 + 0.08 * sin(params.time * 0.7);
  var col = scene + (b1 * 0.85 + b2 * 1.15) * params.strength * breathe;
  // ACES-ish filmic tonemap keeps the bloom from clipping harshly.
  col = clamp((col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14), vec3f(0.0), vec3f(1.0));
  let uv = vec2f(pos.xy) / vec2f(sd);
  let v = 1.0 - 0.22 * smoothstep(0.55, 1.05, distance(uv, vec2f(0.5)));
  return vec4f(col * v, 1.0);
}
