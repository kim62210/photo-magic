/**
 * Vignette + Light Leak 프래그먼트 셰이더 (확장 버전).
 *
 * 기존 adjust.frag의 비네트는 단순 mid-darken이었지만, 이 셰이더는
 *   - 강도(±) — 음수면 화이트 비네트
 *   - 중점 X/Y
 *   - 반경 / 페더
 *   - 색상 (RGB)
 * 라이트 릭은 6가지 프리셋을 화면 좌표 기반 그라디언트로 합성한다.
 */

export const VIGNETTE_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_texture;
uniform float u_amount;       // -1..1 (negative = white vignette)
uniform vec2  u_center;       // 0..1
uniform float u_radius;       // 0.2..1.5
uniform float u_feather;      // 0.05..0.6
uniform vec3  u_color;        // rgb (default 0,0,0)

uniform int   u_leakType;     // 0..6 (0 = none)
uniform float u_leakIntensity; // 0..1

vec3 leakColor(int type) {
  if (type == 1) return vec3(1.0, 0.55, 0.30);  // top-left orange
  if (type == 2) return vec3(0.95, 0.50, 0.25); // right warm streak
  if (type == 3) return vec3(0.55, 0.30, 0.65); // bottom purple
  if (type == 4) return vec3(0.95, 0.85, 0.55); // golden hour top
  if (type == 5) return vec3(0.40, 0.65, 0.85); // cool blue side
  if (type == 6) return vec3(0.95, 0.40, 0.50); // pink corner
  return vec3(0.0);
}

vec2 leakOrigin(int type) {
  if (type == 1) return vec2(0.0, 0.0);
  if (type == 2) return vec2(1.0, 0.5);
  if (type == 3) return vec2(0.5, 1.0);
  if (type == 4) return vec2(0.5, 0.0);
  if (type == 5) return vec2(0.0, 0.5);
  if (type == 6) return vec2(1.0, 1.0);
  return vec2(0.5, 0.5);
}

void main() {
  vec3 c = texture(u_texture, v_uv).rgb;

  // Vignette
  if (abs(u_amount) > 0.001) {
    vec2 d = v_uv - u_center;
    // aspect-corrected distance
    d.x *= 1.0;
    float r = length(d);
    float inner = max(0.05, u_radius - u_feather);
    float outer = u_radius + u_feather;
    float t = smoothstep(inner, outer, r);
    float strength = abs(u_amount) * t;
    if (u_amount > 0.0) {
      // dark vignette tinted by u_color (default black)
      c = mix(c, u_color, strength);
    } else {
      // white/light vignette
      vec3 light = mix(u_color, vec3(1.0), 0.7);
      c = mix(c, light, strength);
    }
  }

  // Light leak
  if (u_leakType > 0 && u_leakIntensity > 0.001) {
    vec2 origin = leakOrigin(u_leakType);
    vec3 lc = leakColor(u_leakType);
    float dist = distance(v_uv, origin);
    float leak = 1.0 - smoothstep(0.05, 0.85, dist);
    leak = pow(leak, 1.4);
    c += lc * leak * u_leakIntensity * 0.6;
  }

  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}
`;

export const LIGHT_LEAK_TYPES = [
  { id: 0, label: '없음' },
  { id: 1, label: '좌상단 오렌지' },
  { id: 2, label: '우측 따뜻한 스트릭' },
  { id: 3, label: '하단 퍼플' },
  { id: 4, label: '상단 골든아워' },
  { id: 5, label: '좌측 쿨 블루' },
  { id: 6, label: '우하 핑크' },
] as const;
