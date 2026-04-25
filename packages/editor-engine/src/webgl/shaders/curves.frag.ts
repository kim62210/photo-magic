/**
 * Tone-Curves 프래그먼트 셰이더.
 * 4개의 1D LUT(R/G/B/Luminance)를 256x1 텍스처로 받아 픽셀별 채널 매핑을 수행한다.
 *
 * 적용 순서:
 *   1. R/G/B 각각 1D LUT 적용 (master는 이미 채널 LUT에 합성돼 있다고 가정)
 *   2. luminance LUT 적용 — 새 휘도와 기존 휘도 차이를 균등하게 분배해서
 *      색상은 유지하면서 톤만 이동시킨다.
 */

export const CURVES_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_texture;
uniform sampler2D u_lutR;
uniform sampler2D u_lutG;
uniform sampler2D u_lutB;
uniform sampler2D u_lutLum;
uniform float u_useLum; // 0.0 or 1.0

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float sampleLut(sampler2D lut, float v) {
  // 256x1 LUT — 절반 픽셀 인셋으로 보간 안정화
  float u = clamp(v, 0.0, 1.0);
  u = u * (255.0 / 256.0) + (0.5 / 256.0);
  return texture(lut, vec2(u, 0.5)).r;
}

void main() {
  vec4 src = texture(u_texture, v_uv);
  vec3 c = src.rgb;

  c.r = sampleLut(u_lutR, c.r);
  c.g = sampleLut(u_lutG, c.g);
  c.b = sampleLut(u_lutB, c.b);

  if (u_useLum > 0.5) {
    float l0 = dot(c, LUMA);
    float l1 = sampleLut(u_lutLum, l0);
    float delta = l1 - l0;
    c += vec3(delta);
  }

  outColor = vec4(clamp(c, 0.0, 1.0), src.a);
}
`;
