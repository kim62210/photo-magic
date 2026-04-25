/**
 * Beauty shaders — GLSL ES 3.00 fragment shaders for the multi-pass beauty pipeline.
 *
 * 모든 셰이더는 공통 프리앰블에서 `u_skinMask` 1-channel 텍스처를 받아
 * 얼굴 영역 외부는 원본을 그대로 통과시킨다 (spec: smoothing restricted to face region).
 *
 * 좌표계:
 *   - v_uv: 0..1, top-left 기준 (FULLSCREEN_VERT가 Y를 뒤집어 캔버스와 일치)
 *   - 마스크 알파 채널을 강도 가중치로 사용
 */

const PREAMBLE = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_texture;     // 입력 컬러
uniform sampler2D u_skinMask;    // 알파에 마스크 (0..1)
uniform float u_strength;        // 0..1 효과 강도
uniform vec2 u_pixelSize;        // 1.0 / vec2(width, height)

float sampleMask(vec2 uv) {
  return texture(u_skinMask, uv).a;
}
`;

/* ───────────────────────── Bilateral smoothing ─────────────────────────
 * 5×5 separable bilateral filter — edge-preserving blur.
 * 색거리 가중치(σ_color)와 공간 가중치(σ_space)를 곱해서 디테일을 살린다.
 * 마스크가 0인 영역에서는 원본을 통과한다.
 */
export const BILATERAL_SMOOTH_FRAG: string =
  PREAMBLE +
  /* glsl */ `
const int RADIUS = 2;        // 5x5 (총 25 샘플)
const float SIGMA_COLOR = 0.10;
const float SIGMA_SPACE = 2.0;

bool isSkinTone(vec3 rgb) {
  // 단순 HSV gate — 피부 톤만 블러 적용 (배경의 살구색 가구 보호)
  float maxc = max(rgb.r, max(rgb.g, rgb.b));
  float minc = min(rgb.r, min(rgb.g, rgb.b));
  float delta = maxc - minc;
  float h = 0.0;
  if (delta > 1e-5) {
    if (maxc == rgb.r) h = mod((rgb.g - rgb.b) / delta, 6.0);
    else if (maxc == rgb.g) h = (rgb.b - rgb.r) / delta + 2.0;
    else h = (rgb.r - rgb.g) / delta + 4.0;
    h *= 60.0;
  }
  float s = maxc < 1e-5 ? 0.0 : delta / maxc;
  float v = maxc;
  // 피부 톤 휴리스틱: H 0~50도, S 0.10~0.65, V 0.20~1.0
  bool hueOk = (h >= 0.0 && h <= 50.0) || h >= 340.0;
  bool satOk = s >= 0.10 && s <= 0.68;
  bool valOk = v >= 0.20;
  return hueOk && satOk && valOk;
}

void main() {
  vec4 src = texture(u_texture, v_uv);
  float mask = sampleMask(v_uv);
  if (mask <= 0.001 || u_strength <= 0.001) {
    fragColor = src;
    return;
  }

  vec3 center = src.rgb;
  vec3 sum = vec3(0.0);
  float wsum = 0.0;

  for (int dy = -RADIUS; dy <= RADIUS; dy++) {
    for (int dx = -RADIUS; dx <= RADIUS; dx++) {
      vec2 offset = vec2(float(dx), float(dy)) * u_pixelSize;
      vec3 c = texture(u_texture, v_uv + offset).rgb;
      float spatial = exp(-(float(dx*dx + dy*dy)) / (2.0 * SIGMA_SPACE * SIGMA_SPACE));
      vec3 diff = c - center;
      float color = exp(-dot(diff, diff) / (2.0 * SIGMA_COLOR * SIGMA_COLOR));
      float w = spatial * color;
      sum += c * w;
      wsum += w;
    }
  }

  vec3 blurred = wsum > 0.0 ? sum / wsum : center;
  // 피부 톤이 아니면 효과 약화 (배경 가구·옷의 살구색 보호)
  float toneGate = isSkinTone(center) ? 1.0 : 0.35;
  float k = clamp(u_strength * mask * toneGate, 0.0, 1.0);
  fragColor = vec4(mix(center, blurred, k), src.a);
}
`;

/* ───────────────────────── Whitening (YCbCr Y shift) ─────────────────
 * 피부 영역 luminance를 끌어올린다. Cb·Cr는 보존하여 색조 유지.
 * Soft-clamp Y ≤ 240/255 (spec: avoid over-saturation clipping).
 * u_strength는 최대 0.7 (UI 슬라이더 70% cap → 셰이더 0~0.7)
 */
export const WHITENING_FRAG: string =
  PREAMBLE +
  /* glsl */ `
const mat3 RGB_TO_YCBCR = mat3(
  0.299,    0.587,    0.114,
 -0.168736,-0.331264, 0.5,
  0.5,    -0.418688,-0.081312
);
const mat3 YCBCR_TO_RGB = mat3(
  1.0,     0.0,      1.402,
  1.0,    -0.344136,-0.714136,
  1.0,     1.772,    0.0
);

void main() {
  vec4 src = texture(u_texture, v_uv);
  float mask = sampleMask(v_uv);
  if (mask <= 0.001 || u_strength <= 0.001) {
    fragColor = src;
    return;
  }
  vec3 ycbcr = RGB_TO_YCBCR * src.rgb;
  // Y 0..1 → 가산식 화이트닝, 상한 240/255 = 0.941
  float lift = u_strength * 0.20 * mask;   // strength 0..1 → 최대 +0.20 Y
  float yShift = ycbcr.x + lift;
  ycbcr.x = min(yShift, 0.941);
  vec3 rgb = YCBCR_TO_RGB * vec3(ycbcr.x, ycbcr.y, ycbcr.z);
  fragColor = vec4(clamp(rgb, 0.0, 1.0), src.a);
}
`;

/* ───────────────────────── Eye enlarge ──────────────────────────────
 * 두 눈 중심 주변에서 UV displacement(중심 방향으로 픽셀 끌어당김)로 확대 효과.
 * u_eyeCenters: 두 눈 중심 정규화 좌표 (xy: 왼눈, zw: 오른눈)
 * u_strength 0..1 → 최대 0.30 (30%) 스케일 (spec: 0..30% scale)
 */
export const EYE_ENLARGE_FRAG: string =
  PREAMBLE +
  /* glsl */ `
uniform vec4 u_eyeCenters;       // (Lx, Ly, Rx, Ry)
uniform float u_eyeRadius;       // 정규화 반경

vec2 warpAround(vec2 uv, vec2 center, float radius, float scale) {
  vec2 d = uv - center;
  float dist = length(d);
  if (dist >= radius || radius < 1e-5) return uv;
  // smooth falloff: 중심에서 100% 효과, 가장자리에서 0
  float t = 1.0 - smoothstep(0.0, radius, dist);
  // 중심 방향으로 끌어당겨 sampling — 결과적으로 그 영역이 확대
  float k = scale * t;
  return center + d * (1.0 - k);
}

void main() {
  vec2 uv = v_uv;
  float scale = clamp(u_strength * 0.30, 0.0, 0.30);
  uv = warpAround(uv, u_eyeCenters.xy, u_eyeRadius, scale);
  uv = warpAround(uv, u_eyeCenters.zw, u_eyeRadius, scale);
  fragColor = texture(u_texture, uv);
}
`;

/* ───────────────────────── Mesh warp (face slim) ────────────────────
 * 턱선 8개 제어점 중심으로 얼굴 중심선(노즈 브릿지) 방향 끌어당겨 슬리밍.
 * u_jawPoints: vec2[8] (정규화)
 * u_faceCenter: 얼굴 중심 정규화 좌표 (코끝 또는 콧방울 평균)
 * u_strength 0..1 → 최대 변형 5% (spec: max 5% pixel distance)
 */
export const MESH_WARP_FRAG: string =
  PREAMBLE +
  /* glsl */ `
uniform vec2 u_faceCenter;
uniform vec2 u_jawPoints[8];
uniform float u_jawRadius;       // 정규화 반경

void main() {
  vec2 uv = v_uv;
  float maxDisp = u_strength * 0.05;   // 최대 5% 변위 (정규화)
  vec2 totalDisp = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    vec2 c = u_jawPoints[i];
    vec2 toCenter = u_faceCenter - c;
    float toCenterLen = length(toCenter);
    if (toCenterLen < 1e-5) continue;
    vec2 dir = toCenter / toCenterLen;
    vec2 d = uv - c;
    float dist = length(d);
    if (dist >= u_jawRadius) continue;
    float falloff = 1.0 - smoothstep(0.0, u_jawRadius, dist);
    totalDisp += dir * falloff * maxDisp;
  }
  // 8개 제어점 평균
  totalDisp /= 8.0;
  vec2 sampleUv = uv - totalDisp;
  fragColor = texture(u_texture, clamp(sampleUv, vec2(0.0), vec2(1.0)));
}
`;

/**
 * 패스-스루 셰이더 — pipeline에서 일부 효과가 0일 때 대체용.
 */
export const PASSTHROUGH_FRAG: string =
  PREAMBLE +
  /* glsl */ `
void main() {
  fragColor = texture(u_texture, v_uv);
}
`;
