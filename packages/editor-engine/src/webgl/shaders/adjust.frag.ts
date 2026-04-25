/**
 * 색조정 + 3D LUT + 그레인 + 비네트 단일 패스 프래그먼트 셰이더.
 *
 * 적용 순서 (spec 요구사항):
 *   1. exposure
 *   2. contrast
 *   3. temperature / tint
 *   4. highlights / shadows  (luma masked)
 *   5. saturation
 *   6. vibrance              (skin protection)
 *   7. LUT (3D)              with intensity blend
 *   8. grain
 *   9. vignette
 */

export const ADJUST_FRAG = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler3D;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_texture;
uniform sampler3D u_lutTexture;
uniform float u_useLut;     // 0.0 or 1.0
uniform float u_lutIntensity;

// Adjustments expected normalized to roughly [-1, 1] before upload.
uniform float u_exposure;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_vibrance;
uniform float u_temperature;
uniform float u_tint;
uniform float u_highlights;
uniform float u_shadows;

// Effects
uniform float u_grain;
uniform float u_grainSeed;
uniform float u_vignette;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 applyExposure(vec3 c, float e) {
  return c * pow(2.0, e);
}

vec3 applyContrast(vec3 c, float k) {
  return mix(vec3(0.5), c, 1.0 + k);
}

vec3 applyTemperature(vec3 c, float t, float tint) {
  // warmth: +R/-B, tint: +G/-G (magenta vs green axis)
  c.r += t * 0.10;
  c.b -= t * 0.10;
  c.g += tint * 0.06;
  return c;
}

vec3 applyHighlightsShadows(vec3 c, float hi, float sh) {
  float l = dot(c, LUMA);
  // smooth high mask (mid -> 1 above 0.5), low mask (mid -> 1 below 0.5)
  float hiMask = smoothstep(0.5, 1.0, l);
  float shMask = 1.0 - smoothstep(0.0, 0.5, l);
  c += hi * 0.25 * hiMask;
  c += sh * 0.25 * shMask;
  return c;
}

vec3 applySaturation(vec3 c, float s) {
  float l = dot(c, LUMA);
  return mix(vec3(l), c, 1.0 + s);
}

vec3 applyVibrance(vec3 c, float v) {
  // boost less-saturated pixels more; protect skin (red-orange dominant) softly.
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float sat = maxC - minC;
  float skin = clamp(c.r - max(c.g, c.b) + 0.2, 0.0, 1.0);
  float skinProtect = mix(1.0, 0.4, skin);
  float amount = v * (1.0 - sat) * skinProtect;
  float l = dot(c, LUMA);
  return mix(vec3(l), c, 1.0 + amount);
}

vec3 applyLut(vec3 c, float intensity) {
  vec3 q = clamp(c, 0.0, 1.0);
  // small inset to avoid bilinear bleed at edges (matches 64-cube unrolled in renderer.ts)
  float n = 64.0;
  q = q * (n - 1.0) / n + 0.5 / n;
  vec3 lutColor = texture(u_lutTexture, q).rgb;
  return mix(c, lutColor, intensity);
}

float filmGrainNoise(vec2 uv, float seed) {
  // monochrome grain — film looks closer to luma noise than RGB noise.
  return hash21(uv * 1024.0 + seed) - 0.5;
}

float vignetteMask(vec2 uv, float strength) {
  vec2 d = uv - 0.5;
  float r = length(d) * 1.4142;
  float v = smoothstep(0.4, 1.0, r);
  return 1.0 - v * strength;
}

void main() {
  vec3 c = texture(u_texture, v_uv).rgb;

  c = applyExposure(c, u_exposure);
  c = applyContrast(c, u_contrast);
  c = applyTemperature(c, u_temperature, u_tint);
  c = applyHighlightsShadows(c, u_highlights, u_shadows);
  c = applySaturation(c, u_saturation);
  c = applyVibrance(c, u_vibrance);

  if (u_useLut > 0.5) {
    c = applyLut(c, u_lutIntensity);
  }

  // Grain — strongest in mid-tones, very weak in pure black/white (film behaviour).
  if (u_grain > 0.001) {
    float l = dot(clamp(c, 0.0, 1.0), LUMA);
    float midWeight = 1.0 - pow(abs(l - 0.5) * 2.0, 2.0);
    float n = filmGrainNoise(v_uv, u_grainSeed);
    c += vec3(n) * u_grain * 0.35 * midWeight;
  }

  // Vignette
  if (u_vignette > 0.001) {
    c *= vignetteMask(v_uv, u_vignette);
  }

  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`;
