/**
 * HSL Selective Color 프래그먼트 셰이더.
 *
 * 동작:
 *   1. RGB → HSL 변환
 *   2. 8개 대역 중심 hue와의 각도 거리로 smoothstep(거리=30°에서 0)
 *   3. 가중치 합으로 hue/sat/lum 오프셋 누적
 *   4. HSL → RGB 변환
 */

export const HSL_SELECTIVE_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_texture;

// 8 targets × 3 (hue/sat/lum) — UI -1..1 정규화
uniform float u_adj[24];
// 8 hue centers (degrees)
uniform float u_centers[8];
// global enable
uniform float u_enabled;

const float BAND_WIDTH = 30.0;     // half-width in degrees
const float BAND_FALLOFF = 60.0;   // smoothstep end

vec3 rgb2hsl(vec3 c) {
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float l = (maxC + minC) * 0.5;
  float h = 0.0;
  float s = 0.0;
  float d = maxC - minC;
  if (d > 1e-5) {
    s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    if (maxC == c.r) {
      h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if (maxC == c.g) {
      h = (c.b - c.r) / d + 2.0;
    } else {
      h = (c.r - c.g) / d + 4.0;
    }
    h *= 60.0; // 0..360
  }
  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5)     return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 hsl) {
  float h = hsl.x / 360.0;
  float s = hsl.y;
  float l = hsl.z;
  if (s < 1e-5) return vec3(l);
  float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
  float p = 2.0 * l - q;
  return vec3(
    hue2rgb(p, q, h + 1.0/3.0),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1.0/3.0)
  );
}

float angleDist(float a, float b) {
  float d = abs(a - b);
  return min(d, 360.0 - d);
}

void main() {
  vec4 src = texture(u_texture, v_uv);
  if (u_enabled < 0.5) {
    outColor = src;
    return;
  }

  vec3 hsl = rgb2hsl(src.rgb);
  // 색이 거의 없는 픽셀은 영향 줄이기 (그레이 보호)
  float chromaGuard = smoothstep(0.02, 0.12, hsl.y);

  float hueShift = 0.0;
  float satMul = 0.0;   // additive shift in saturation (-1..1)
  float lumShift = 0.0; // additive shift in luminance (-1..1)
  float weightSum = 0.0;

  for (int i = 0; i < 8; i++) {
    float center = u_centers[i];
    float d = angleDist(hsl.x, center);
    float w = 1.0 - smoothstep(BAND_WIDTH, BAND_FALLOFF, d);
    if (w <= 0.0) continue;
    float adjH = u_adj[i*3 + 0];
    float adjS = u_adj[i*3 + 1];
    float adjL = u_adj[i*3 + 2];
    hueShift += w * adjH * 60.0; // ±60° max
    satMul   += w * adjS * 0.6;  // ±60% sat
    lumShift += w * adjL * 0.4;  // ±40% lum
    weightSum += w;
  }

  hueShift *= chromaGuard;
  satMul   *= chromaGuard;
  lumShift *= chromaGuard;

  float newH = mod(hsl.x + hueShift + 360.0, 360.0);
  float newS = clamp(hsl.y * (1.0 + satMul), 0.0, 1.0);
  float newL = clamp(hsl.z + lumShift, 0.0, 1.0);

  vec3 outRgb = hsl2rgb(vec3(newH, newS, newL));
  outColor = vec4(outRgb, src.a);
}
`;
