/**
 * Unsharp Mask 프래그먼트 셰이더 (3×3 가우시안 근사 + 차이 부스트).
 *
 * uniform:
 *   u_texture     : 원본
 *   u_texelSize   : (1/w, 1/h)
 *   u_amount      : 0..2 (적정 0..1.5)
 *   u_radius      : 픽셀 반경 (1..3 권장 — 큰 반경은 별도 다운샘플 패스 필요)
 *   u_threshold   : 0..1 (작은 차이는 무시)
 */

export const SHARPEN_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_texture;
uniform vec2 u_texelSize;
uniform float u_amount;
uniform float u_radius;
uniform float u_threshold;

vec3 sampleAt(vec2 offset) {
  return texture(u_texture, v_uv + offset * u_texelSize * u_radius).rgb;
}

void main() {
  vec3 c = texture(u_texture, v_uv).rgb;
  if (u_amount < 0.001) {
    outColor = vec4(c, 1.0);
    return;
  }

  // 3×3 gaussian (1 2 1; 2 4 2; 1 2 1) / 16
  vec3 acc =
    sampleAt(vec2(-1.0, -1.0)) * 1.0 +
    sampleAt(vec2( 0.0, -1.0)) * 2.0 +
    sampleAt(vec2( 1.0, -1.0)) * 1.0 +
    sampleAt(vec2(-1.0,  0.0)) * 2.0 +
    sampleAt(vec2( 0.0,  0.0)) * 4.0 +
    sampleAt(vec2( 1.0,  0.0)) * 2.0 +
    sampleAt(vec2(-1.0,  1.0)) * 1.0 +
    sampleAt(vec2( 0.0,  1.0)) * 2.0 +
    sampleAt(vec2( 1.0,  1.0)) * 1.0;
  vec3 blurred = acc / 16.0;

  vec3 diff = c - blurred;
  vec3 mask = step(vec3(u_threshold), abs(diff));
  vec3 sharp = c + diff * u_amount * mask;
  outColor = vec4(clamp(sharp, 0.0, 1.0), 1.0);
}
`;
