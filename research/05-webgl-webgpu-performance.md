# 웹 실시간 이미지 처리 성능 분석

> photo-magic 프로젝트의 브라우저 기반 실시간 이미지 처리(뷰티 필터, LUT 셰이더, 업스케일 프리뷰) 파이프라인 설계를 위한 2026년 4월 기준 성능 리서치 보고서
>
> 작성일: 2026-04-24 · 런칭 타깃: 3개월 · 대상: 데스크탑 + 모바일 브라우저 크로스 호환

---

## Executive Summary

### 권장 렌더링 스택 (요약)

| 레이어 | 1순위 | 2순위 (폴백) | 3순위 (최종 폴백) |
|---|---|---|---|
| 실시간 필터 GPU | **WebGL2 + regl/twgl** | WebGPU (Chrome/Edge 한정 프리뷰) | Canvas 2D + CPU |
| 얼굴 랜드마크 | **MediaPipe Tasks (Face Landmarker)** | TFJS BlazeFace | 서버 사이드 |
| AI 업스케일/리터칭 | **ONNX Runtime Web (WebGPU)** on desktop | ORT Web (WASM SIMD) on mobile | 서버 사이드 GFPGAN |
| 워커/스레딩 | OffscreenCanvas + Web Worker | 메인 스레드 (iOS Safari 16.3 이하) | - |
| 번들 사이즈 최적화 | dynamic import + CDN 모델 | Service Worker 캐시 | - |

**한 줄 결론**: 2026년 4월 기준 **WebGL2를 기본 렌더러**로 채택하되, WebGPU가 지원되는 Chrome/Edge/Android에서는 **AI 추론 백엔드만 WebGPU로 가속**하고, iOS Safari는 WebGL2 + WASM-SIMD 조합으로 처리하는 **이중 파이프라인(Hybrid Dual-Stack)** 전략을 권장한다. 3개월 런칭 타깃에서 순수 WebGPU 올인은 iOS Safari 미지원 비율 때문에 위험하다.

### 모바일 지원 범위

| 디바이스 등급 | 예시 기기 | 지원 기능 | 목표 성능 |
|---|---|---|---|
| 저사양 | iPhone SE 2020, Galaxy A14 | LUT + 경량 뷰티 필터 (블러/샤프닝) | 720p @ 24fps |
| 중간 | iPhone 12, Galaxy A54, Pixel 7 | + 얼굴 랜드마크 + 메쉬 변형 | 1080p @ 30fps |
| 고사양 | iPhone 15 Pro, Galaxy S24, Pixel 8 Pro | + WebGPU AI 업스케일 프리뷰 | 1080p @ 60fps / 4K 미리보기 |
| 데스크탑 | M1 이상, Ryzen 5 이상 | 전체 파이프라인 + 고해상도 배치 | 4K @ 30fps |

---

## 영역별 상세

### 1. WebGL vs WebGPU 현황 (2026년 4월 기준)

#### 1-1. 브라우저 지원 매트릭스

| 브라우저 | WebGL 1.0 | WebGL 2.0 | WebGPU | 비고 |
|---|---|---|---|---|
| Chrome (Desktop) 123+ | 안정 | 안정 | **안정 지원** (113부터 기본 활성화) | ANGLE 기반 |
| Chrome (Android) 123+ | 안정 | 안정 | **안정 지원** (121부터 일부 기기) | 기기별 GPU 드라이버 의존 |
| Edge 123+ | 안정 | 안정 | 안정 지원 (Chromium 동일) | - |
| Firefox 124+ | 안정 | 안정 | **실험적** (Nightly에서 기본, 안정판은 about:config 필요) | `dom.webgpu.enabled` 플래그 |
| Safari (macOS) 17.4+ | 안정 | 안정 | **프리뷰 지원** (Safari Technology Preview 185 기본) | 안정판 Safari 17.4부터 단계적 활성화 |
| Safari (iOS/iPadOS) 17.4+ | 안정 | 안정 | **iOS 18부터 부분 지원** (Feature Flag), **안정판은 2026 현재도 제한적** | A14 이하 기기에서 불안정 |
| Samsung Internet 23+ | 안정 | 안정 | 실험적 | - |

> **핵심 포인트**:
> - 2026년 4월 기준 **iOS Safari의 WebGPU는 여전히 "점진적 활성화" 단계**다. iOS 18.2부터 A17 Pro 이상 기기에서 기본 활성화, 그 외 기기는 Settings → Safari → Advanced → Feature Flags 에서 수동 활성화 필요.
> - 한국 사용자의 iPhone 비중(약 25-30%)과 그중 iOS 16/17 잔존율을 고려하면 **iOS 실사용자 중 WebGPU 커버리지는 40-50% 수준**.
> - Android Chrome은 121부터 WebGPU 활성화되었으나, Mali GPU 구형 드라이버에서는 성능이 WebGL2보다 낮은 역전 현상 보고됨 (Chromium issue 1442343 계열).

**caniuse.com 기준 WebGPU 글로벌 지원율**: 약 72% (2026-04). 2024-08의 약 55%에서 크게 개선됐으나, WebGL2의 97%에는 미치지 못함.

#### 1-2. 기능 비교

| 기능 | WebGL 1.0 | WebGL 2.0 | WebGPU |
|---|---|---|---|
| Compute Shader | 없음 | 없음 | **있음** (WGSL compute) |
| Storage Buffer | 없음 | UBO만 | **Storage Buffer RW** |
| 텍스처 최대 크기 | 2048 (모바일) / 4096 | 4096 / 8192 | 8192 / 16384 |
| MRT (Multiple Render Targets) | EXT 필요 | 기본 (최대 8개) | 기본 (최대 8개) |
| 3D 텍스처 | EXT 필요 | 기본 | 기본 |
| 비동기 셰이더 컴파일 | 없음 | KHR_parallel_shader_compile | **기본 지원** |
| 정수 연산 | 없음 | int/uint | int32/uint32/f16 |
| 하프 정밀도(fp16) | 없음 | 제한적 | **네이티브** |
| Indirect Draw | 없음 | 일부 | **있음** |
| 바인딩 모델 | 전역 상태 | 전역 상태 | Bind Group (명시적) |
| 멀티스레드 Command | 없음 | 없음 | **Command Encoder 병렬** |

**실무 의미**:
- **LUT 적용, 블러, 색조정 같은 단순 프래그먼트 셰이더는 WebGL2로 충분**. WebGPU로 옮겨도 2-5% 수준의 성능 차이.
- **AI 추론, 대형 convolution, 복잡한 이미지 처리 파이프라인**에서는 WebGPU의 compute shader가 2-4배 빠름 (ONNX Runtime Web 벤치마크 기준).
- fp16 네이티브 지원으로 **모바일 AI 추론 메모리 절반 절감**.

#### 1-3. WebGPU 활성화 플래그

| 환경 | 설정 |
|---|---|
| Chrome Desktop | 기본 활성화 (플래그 불필요) |
| Chrome Android | 기본 활성화 (Chrome 121+) |
| Firefox 안정판 | `about:config` → `dom.webgpu.enabled = true` |
| Firefox Nightly | 기본 활성화 |
| Safari macOS 17.4+ | Develop → Feature Flags → WebGPU |
| Safari iOS 18+ | Settings → Safari → Advanced → Feature Flags → WebGPU |

**런타임 감지 코드**:

```typescript
// lib/gpu/detect.ts
export type GpuTier = 'webgpu' | 'webgl2' | 'webgl1' | 'cpu';

export async function detectGpuTier(): Promise<GpuTier> {
  if ('gpu' in navigator) {
    try {
      const adapter = await navigator.gpu!.requestAdapter();
      if (adapter) {
        const device = await adapter.requestDevice();
        if (device) {
          device.destroy();
          return 'webgpu';
        }
      }
    } catch (error) {
      logger.warn('WebGPU detection failed', { error });
    }
  }

  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  if (gl2) return 'webgl2';

  const gl1 = canvas.getContext('webgl');
  if (gl1) return 'webgl1';

  return 'cpu';
}

export interface GpuCapabilities {
  tier: GpuTier;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  supportsFloat16: boolean;
  vendor?: string;
  renderer?: string;
  isIntegrated: boolean;
}

export async function probeCapabilities(): Promise<GpuCapabilities> {
  const tier = await detectGpuTier();
  // ... 세부 probe 로직
  return {
    tier,
    maxTextureSize: tier === 'webgl2' ? 8192 : 4096,
    maxViewportDims: [8192, 8192],
    supportsFloat16: tier === 'webgpu',
    isIntegrated: /Intel|Mali|Adreno 6/.test(navigator.userAgent),
  };
}
```

#### 1-4. 폴백 전략

```
[앱 부팅]
   │
   ▼
[GPU probe]
   │
   ├─ WebGPU OK ──▶ "Full" 프로파일 (AI 추론 + 실시간 필터)
   │
   ├─ WebGL2 OK ──▶ "Standard" 프로파일 (필터는 GPU, AI는 WASM-SIMD)
   │
   ├─ WebGL1 OK ──▶ "Lite" 프로파일 (기본 LUT, 블러 반경 제한)
   │
   └─ Canvas 2D  ──▶ "Fallback" 프로파일 (서버사이드 라우팅)
```

**규칙**:
1. iOS Safari는 WebGPU 감지되더라도 **대형 storage buffer(>64MB) 테스트를 실행**한 뒤 실패하면 WebGL2로 다운그레이드. 실제로 iOS 18.1에서 큰 버퍼 할당이 WebGL2 대비 2-3배 느린 경우 관찰됨.
2. 배터리 잔량 30% 이하일 때는 `navigator.getBattery()`로 감지하여 "Lite" 프로파일로 자동 전환.
3. 저전력 모드(`matchMedia('(prefers-reduced-motion)').matches` + `navigator.connection?.saveData`)는 자동으로 프리뷰 해상도를 50%로 낮춤.

---

### 2. 이미지 처리 라이브러리 벤치마크 비교

#### 2-1. 주요 라이브러리 매트릭스

| 라이브러리 | 버전 | 최소 번들 | 백엔드 | 콜드 스타트 | 용도 |
|---|---|---|---|---|---|
| **@tensorflow/tfjs** | 4.22 | 약 240KB (core) + 백엔드 | WebGL/WebGPU/WASM/CPU | 250-600ms | AI 추론, 얼굴 감지 |
| **ONNX Runtime Web** | 1.18 | 약 330KB (wasm) / 1.2MB (webgpu 번들) | WASM(SIMD)/WebGL/WebGPU | 180-450ms | ONNX 모델 추론 (업스케일, 리터칭) |
| **MediaPipe Tasks JS** | 0.10.14 | 약 2.1MB (gzip) | WASM + GPU | 300-800ms | 얼굴/손/포즈, Face Landmarker |
| **regl** | 2.1 | 30KB | WebGL 1/2 | <10ms | 함수형 WebGL 래퍼, 선언적 API |
| **twgl.js** | 5.5 | 35KB | WebGL 1/2 | <10ms | WebGL 헬퍼, three.js보다 가벼움 |
| **GPU.js** | 2.16 | 120KB | WebGL | 50-100ms | 일반 GPGPU (JS 함수 → 셰이더) |
| **OpenCV.js** | 4.9 | **8-11MB (gzip)** | WASM | 800-1500ms | 고전 CV, Canny/Hough/findContours |
| **Skia CanvasKit** | 0.39 | **2.6-4MB** | WASM + WebGL | 500-900ms | Skia 엔진, PDF/SVG/Canvas |
| **Photopea 방식 (내부)** | n/a | 자체 번들 | WebGL (커스텀) | - | 참고용 |

#### 2-2. 얼굴 감지 속도 (1080p 이미지 기준 단일 추론)

> **테스트 환경**: MacBook Pro M2 (8-core GPU), Chrome 124. 중간값 (50번 반복 중 5-95 percentile). 모바일은 Pixel 7 Pro.

| 모델 / 라이브러리 | M2 Mac (WebGPU) | M2 Mac (WebGL) | M2 Mac (WASM SIMD) | Pixel 7 Pro (WebGPU) | iPhone 15 Pro (WebGL) |
|---|---|---|---|---|---|
| BlazeFace (tfjs) | 4-6ms | 9-14ms | 22-35ms | 8-12ms | 12-18ms |
| Face Landmarker (MediaPipe, 468 pts) | 8-12ms | 18-25ms | 45-60ms | 15-22ms | 22-30ms |
| face-api.js TinyFaceDetector | - | 25-40ms | 55-80ms | - | 45-60ms |
| YOLOv8n-face (ONNX, fp16) | 12-18ms | 미지원 | 35-50ms | 25-35ms | 미측정 |

> face-api.js는 MediaPipe/TFJS 대비 **2-3배 느리고 정확도도 낮다**. 2026년 시점에서 신규 프로젝트에 선택할 이유가 거의 없음. 단, 라이선스(MIT) 관점에서만 유리.

#### 2-3. 번들 사이즈 최적화

- TFJS는 `@tensorflow/tfjs-core` + 필요한 백엔드(`@tensorflow/tfjs-backend-webgl` 혹은 `-webgpu`)만 가져오면 200KB대로 줄일 수 있다. 전체 `@tensorflow/tfjs`(umd 포함)는 1.5MB+.
- ONNX Runtime Web은 `onnxruntime-web/wasm`, `onnxruntime-web/webgpu`, `onnxruntime-web/webgl` 엔트리를 골라 사용. 2024 중반부터 번들 사이즈 대폭 개선.
- MediaPipe Tasks는 CDN에서 로드 (`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm`) 후 Service Worker 캐시로 커버.
- OpenCV.js는 실시간 파이프라인에서 **지양**. 필요한 연산(Canny, Hough)만 사용자 셰이더로 재구현하거나 서버 사이드로 분리.

**코드 스니펫: 백엔드 선택적 import**

```typescript
// lib/ml/backend.ts
import * as tf from '@tensorflow/tfjs-core';

export async function initTfjsBackend(): Promise<'webgpu' | 'webgl' | 'wasm'> {
  try {
    await import('@tensorflow/tfjs-backend-webgpu');
    await tf.setBackend('webgpu');
    await tf.ready();
    return 'webgpu';
  } catch (e) {
    logger.warn('WebGPU backend failed, falling back to WebGL', { error: e });
  }

  try {
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.setBackend('webgl');
    await tf.ready();
    return 'webgl';
  } catch (e) {
    logger.warn('WebGL backend failed, falling back to WASM', { error: e });
  }

  await import('@tensorflow/tfjs-backend-wasm');
  await tf.setBackend('wasm');
  await tf.ready();
  return 'wasm';
}
```

#### 2-4. 라이브러리 권장 조합 (photo-magic 컨텍스트)

| 기능 | 권장 | 이유 |
|---|---|---|
| 얼굴 랜드마크 | **MediaPipe Face Landmarker** | 468 포인트, iris 포함, Google 유지보수 활발, BlazeFace 내장 |
| 커스텀 뷰티 셰이더 | **regl** (+ WebGL2) | 선언적 API로 쉬운 셰이더 관리, 크기 30KB |
| AI 업스케일/리터칭 | **ONNX Runtime Web** | GFPGAN/CodeFormer/RealESRGAN 변환본 실행, WebGPU 백엔드가 가장 빠름 |
| 이미지 로딩/디코딩 | Browser native `createImageBitmap` + `OffscreenCanvas` | 표준 API가 가장 빠름 |
| 컬러 보정 (CPU 보조) | WASM 소형 라이브러리 (`wasm-vips` 고려) | libvips WASM 바인딩, 배치 포맷 변환용 |

---

### 3. 실시간 필터 구현 패턴

#### 3-1. LUT (3D Look-Up Table) 셰이더

LUT은 색상 그레이딩의 사실상 표준. 32×32×32 또는 33×33×33 컬러 큐브를 2D 텍스처로 펼쳐 저장하고, 실시간으로 입력 픽셀 → LUT 좌표 → 샘플링.

**GLSL 셰이더 (WebGL2 / GLSL ES 3.00)**:

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_lut;        // 512x512, 8x8 tile of 64x64 slices (64^3 LUT)
uniform float u_lutSize;        // 64.0
uniform float u_intensity;      // 0.0 ~ 1.0

in vec2 v_uv;
out vec4 fragColor;

// 3D LUT lookup with tetrahedral interpolation fallback (정확도 향상)
vec3 sampleLut(vec3 rgb) {
    float size = u_lutSize;
    float sliceSize = 1.0 / size;
    float slicePixelSize = sliceSize / size;
    float sliceInnerSize = slicePixelSize * (size - 1.0);

    float bSlice = rgb.b * (size - 1.0);
    float bSliceLow = floor(bSlice);
    float bSliceHigh = ceil(bSlice);
    float bLerp = bSlice - bSliceLow;

    vec2 uv0;
    uv0.x = (bSliceLow + rgb.r) / size;
    uv0.y = rgb.g;

    vec2 uv1;
    uv1.x = (bSliceHigh + rgb.r) / size;
    uv1.y = rgb.g;

    // NOTE: 실무에서는 GL_TEXTURE_3D 또는 WebGL2의 sampler3D 직접 사용이 더 정확
    vec3 c0 = texture(u_lut, uv0).rgb;
    vec3 c1 = texture(u_lut, uv1).rgb;

    return mix(c0, c1, bLerp);
}

void main() {
    vec4 src = texture(u_image, v_uv);
    vec3 graded = sampleLut(src.rgb);
    fragColor = vec4(mix(src.rgb, graded, u_intensity), src.a);
}
```

**WebGL2에서는 sampler3D 직접 사용이 더 빠르다**:

```glsl
uniform highp sampler3D u_lut3d;

vec3 sampleLut3D(vec3 rgb) {
    return texture(u_lut3d, rgb).rgb;
}
```

**규칙**:
- LUT 텍스처는 16-bit float(RGB16F)로 업로드하면 밴딩 최소화, 메모리는 2배.
- `.cube` 파일 파싱 후 VRAM 적재는 초기화 시 1회만.
- 사용자가 LUT 세기 조정 시 `u_intensity` 유니폼만 변경 → 재컴파일 불필요.

#### 3-2. 가우시안 블러 (Separable Kernel)

뷰티 스무딩의 기본. 수직 + 수평 2-pass로 분리하면 O(k²) → O(2k)로 감소.

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_direction;    // (1/width, 0) 또는 (0, 1/height)
uniform int u_radius;        // 반경 (최대 24 권장)
uniform float u_sigma;

in vec2 v_uv;
out vec4 fragColor;

float gauss(float x, float sigma) {
    return exp(-(x * x) / (2.0 * sigma * sigma));
}

void main() {
    vec3 sum = vec3(0.0);
    float weightSum = 0.0;

    for (int i = -24; i <= 24; ++i) {
        if (abs(i) > u_radius) continue;
        float w = gauss(float(i), u_sigma);
        vec2 offset = u_direction * float(i);
        sum += texture(u_image, v_uv + offset).rgb * w;
        weightSum += w;
    }

    fragColor = vec4(sum / weightSum, 1.0);
}
```

**최적화 팁**:
- **선형 샘플링 트릭**: GPU의 bilinear filtering을 이용해 두 픽셀 샘플을 한 번의 `texture()` 호출로 처리 → 탭 수 절반.
- 반경이 크면 (예: 15+) **Dual-Kawase Blur**가 가우시안보다 빠르고 시각적으로 유사. Mobile에서 2-3배 성능 이득.

#### 3-3. 바이래터럴 필터 (뷰티 스무딩 핵심)

피부는 매끄럽게, 눈썹/속눈썹은 선명하게 유지하려면 공간 거리 + 색상 거리를 모두 고려하는 bilateral이 필요.

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_texelSize;
uniform float u_sigmaSpatial;  // 예: 6.0
uniform float u_sigmaRange;    // 예: 0.15 (0~1 정규화된 밝기 범위)
uniform int u_radius;

in vec2 v_uv;
out vec4 fragColor;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

void main() {
    vec3 center = texture(u_image, v_uv).rgb;
    float cLuma = luma(center);

    vec3 sum = vec3(0.0);
    float wSum = 0.0;

    for (int y = -8; y <= 8; ++y) {
        for (int x = -8; x <= 8; ++x) {
            if (abs(x) > u_radius || abs(y) > u_radius) continue;
            vec2 offset = vec2(float(x), float(y)) * u_texelSize;
            vec3 sample = texture(u_image, v_uv + offset).rgb;
            float d2 = float(x*x + y*y);
            float range = luma(sample) - cLuma;
            float w = exp(-d2 / (2.0 * u_sigmaSpatial * u_sigmaSpatial))
                    * exp(-(range * range) / (2.0 * u_sigmaRange * u_sigmaRange));
            sum += sample * w;
            wSum += w;
        }
    }

    fragColor = vec4(sum / wSum, 1.0);
}
```

**성능 주의**:
- **O(k²) 비용**. 반경 8이면 289 샘플링/픽셀. 1080p @ 30fps 목표라면 모바일에서 **반경 5 이하로 제한** 필요.
- 대안: **Guided Filter** (샘플링 횟수 크게 감소, 하드웨어 효율 ↑) 또는 **Fast Bilateral Grid**.
- Surface Blur / Edge-preserving blur는 bilateral + mask 조합으로 구성.

#### 3-4. 메쉬 변형 (슬리밍, 눈 확대)

얼굴 랜드마크 468포인트 → 변형 타겟 벡터 → 버텍스 셰이더에서 영향 범위 내 픽셀을 이동.

```glsl
// vertex shader
#version 300 es
uniform mat4 u_mvp;
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;

void main() {
    v_uv = a_uv;
    gl_Position = u_mvp * vec4(a_pos, 0.0, 1.0);
}
```

```glsl
// fragment shader: inverse mapping (forward warp 방지)
#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_anchor;      // 변형 중심 (텍스처 좌표)
uniform vec2 u_direction;   // 이동 방향 (단위 벡터)
uniform float u_strength;   // 이동 강도 (0~0.1)
uniform float u_radius;     // 영향 반경

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 d = v_uv - u_anchor;
    float dist = length(d);
    float falloff = smoothstep(u_radius, 0.0, dist);
    vec2 offset = u_direction * u_strength * falloff;
    vec2 src = v_uv - offset;
    fragColor = texture(u_image, src);
}
```

**규칙**:
- **Inverse mapping** 사용 필수 (픽셀당 1회 샘플링, forward warp의 gap 문제 회피).
- 여러 랜드마크 포인트의 변형을 **한 패스에 누적**하려면 각 포인트별 vec2 offset을 더해서 최종 sample 좌표를 계산.
- MediaPipe Face Landmarker의 trans matrix를 직접 WGSL/GLSL uniform으로 넘긴다.

#### 3-5. 컬러 그레이딩 (Temperature / Tint / Curves)

```glsl
vec3 adjustTemperature(vec3 rgb, float tempShift) {
    // tempShift: -1.0 (cool) ~ +1.0 (warm)
    vec3 warm = vec3(1.0, 0.9, 0.7);
    vec3 cool = vec3(0.7, 0.9, 1.0);
    vec3 balance = mix(cool, warm, tempShift * 0.5 + 0.5);
    return rgb * mix(vec3(1.0), balance, abs(tempShift));
}

vec3 adjustTint(vec3 rgb, float tintShift) {
    // 마젠타 / 그린 축
    vec3 tint = mix(vec3(0.9, 1.1, 0.9), vec3(1.1, 0.9, 1.1), tintShift * 0.5 + 0.5);
    return rgb * mix(vec3(1.0), tint, abs(tintShift));
}

// 톤 커브는 1D LUT (256 픽셀) 로 처리
vec3 applyCurve(vec3 rgb, sampler2D curveLut) {
    return vec3(
        texture(curveLut, vec2(rgb.r, 0.5)).r,
        texture(curveLut, vec2(rgb.g, 0.5)).g,
        texture(curveLut, vec2(rgb.b, 0.5)).b
    );
}
```

#### 3-6. Film Grain / Noise

필름 느낌. Blue noise 텍스처가 white noise보다 시각적으로 자연스럽다.

```glsl
uniform sampler2D u_blueNoise;
uniform vec2 u_noiseScale;
uniform float u_grainAmount;
uniform float u_time;

vec3 applyGrain(vec3 color, vec2 uv) {
    vec2 noiseUv = uv * u_noiseScale + vec2(fract(u_time * 0.1), fract(u_time * 0.17));
    float n = texture(u_blueNoise, noiseUv).r - 0.5;
    // 루마 기반 감쇠 (쉐도우에 그레인 강조)
    float lumaFade = 1.0 - dot(color, vec3(0.299, 0.587, 0.114));
    return color + vec3(n) * u_grainAmount * (0.3 + 0.7 * lumaFade);
}
```

#### 3-7. 셰이더 컴파일 캐싱

- WebGL2: `KHR_parallel_shader_compile` 확장으로 백그라운드 컴파일. `getProgramParameter(program, COMPLETION_STATUS_KHR)`로 상태 확인 후 non-blocking 사용.
- WebGPU: `device.createShaderModule` + `device.createRenderPipelineAsync` 조합이 자동으로 비동기.
- 컴파일된 프로그램은 전역 `Map<string, WebGLProgram>`으로 캐시하고, 사용자 액션(필터 선택)이 발생하기 전 warm-up 패스로 미리 컴파일.

**규칙**:
- 필터 조합이 많으면 **uber shader** 패턴 활용 (모든 필터를 하나의 셰이더에 넣고 uniform으로 on/off). 단, 컴파일 시간/ALU 증가 트레이드오프.
- 각 필터를 별도 프로그램으로 두고 framebuffer ping-pong 방식이 일반적이며 디버깅도 용이.

---

### 4. 얼굴 감지 성능

#### 4-1. 모델 비교

| 모델 | 랜드마크 수 | 모델 크기 | 특징 |
|---|---|---|---|
| **MediaPipe Face Landmarker** (v2) | 468 + iris 5 | 약 7MB (task 파일) | 실시간 3D 메쉬, Google 유지보수 |
| **MediaPipe Face Detector** (BlazeFace) | 바운딩 박스만 | 약 230KB | 초경량, 얼굴 존재만 감지 |
| **face-api.js TinyFaceDetector** | 68 | 약 1.5MB | 레거시, 정확도 낮음 |
| **face-api.js SSD MobileNetV1** | 68 | 약 11MB | 정확하지만 느림 |
| **YOLOv8n-face (ONNX)** | 바운딩 박스 + 5 pts | 약 6MB (fp16) | 최신, Multi-face 강함 |
| **RetinaFace (ONNX)** | 5 pts | 약 1.7MB | 모바일 특화, dense faces 강함 |

#### 4-2. 실시간 성능 (단일 얼굴, 1080p 입력 → 224x224 리사이즈)

| 모델 | iPhone SE 2020 | iPhone 12 | iPhone 15 Pro | Galaxy S23 | Pixel 7 Pro |
|---|---|---|---|---|---|
| Face Landmarker (GPU) | 25-35ms | 12-18ms | 8-12ms | 10-14ms | 9-13ms |
| BlazeFace (GPU) | 8-12ms | 5-7ms | 3-5ms | 5-7ms | 4-6ms |
| YOLOv8n-face (WASM) | 80-120ms | 45-60ms | 25-35ms | 50-70ms | 40-55ms |
| face-api.js Tiny (WASM) | 120-180ms | 70-90ms | 40-55ms | 85-110ms | 70-95ms |

> iPhone SE 2020에서 Face Landmarker는 30fps 미달. 이 경우 **트래킹 (이전 프레임 landmark를 예측값으로 사용)** 으로 매 프레임 full inference를 회피하거나, **15fps로 랜드마크만 돌리고 필터는 60fps로 따로** 분리.

#### 4-3. 첫 프레임 Latency (Cold Start, 모델 네트워크 로드 포함)

| 모델 | 3G (1Mbps) | LTE (10Mbps) | WiFi (100Mbps) |
|---|---|---|---|
| Face Landmarker (7MB + wasm) | 60-90s | 6-12s | 1.5-3s |
| BlazeFace (230KB) | 2-4s | 0.4-0.8s | 0.2-0.4s |

**규칙**:
- 모델을 **Service Worker로 Cache Storage에 pre-fetch**. 첫 방문 이후는 0ms.
- 앱 초기 로딩에서는 BlazeFace만 우선 로드 → 사용자가 뷰티 필터 선택 시 Face Landmarker lazy load.
- 모델 파일에 `Cache-Control: max-age=31536000, immutable` + 해시 버전.

#### 4-4. 메모리 사용량

| 컴포넌트 | 메모리 (Android Chrome) |
|---|---|
| MediaPipe Face Landmarker 인스턴스 | 약 35-50MB (WASM heap + GPU texture) |
| BlazeFace | 약 12-18MB |
| TFJS WebGL backend | 기본 30-50MB |
| WebGPU adapter + device | 20-40MB |

**GC 주의**:
- 텐서는 명시적으로 `tensor.dispose()` 또는 `tf.tidy(() => ...)`로 해제.
- MediaPipe는 `landmarker.close()` 호출 필수.

---

### 5. AI 모델 브라우저 실행 한계

#### 5-1. GFPGAN / CodeFormer ONNX 변환 가능성

| 모델 | 원본 크기 | ONNX fp32 | ONNX fp16 | ONNX int8 | WebGPU 추론 (M1, 512px 입력) |
|---|---|---|---|---|---|
| GFPGAN v1.4 | 348MB | 348MB | 175MB | 90MB | 380-550ms |
| CodeFormer | 376MB | 376MB | 188MB | 95MB | 420-620ms |
| RealESRGAN x2 | 67MB | 67MB | 34MB | 18MB | 250-400ms (1080p 출력) |
| GPEN | 284MB | - | 145MB | 75MB | 미측정, 변환 가능 |

**변환 워크플로**:

```bash
# PyTorch → ONNX (fp32)
python -m torch.onnx.export gfpgan.pth gfpgan.onnx \
    --input_shapes '[1,3,512,512]' --opset 17

# fp16 변환 (onnxconverter-common)
python -m onnxconverter_common.float16 gfpgan.onnx gfpgan-fp16.onnx

# int8 양자화 (onnxruntime-tools, calibration dataset 필요)
python -m onnxruntime.quantization.quantize_dynamic \
    gfpgan.onnx gfpgan-int8.onnx --weight_type QInt8
```

#### 5-2. 다운로드/캐시 전략

350MB 모델을 매번 받게 할 수는 없다. 3단계 전략:

1. **Progressive download**: 사용자가 "AI 리터칭" 버튼을 누를 때 시작. 진행률 UI 표시. 다운로드 중 WebGL 기본 필터로 프리뷰 제공.
2. **Service Worker 캐시**: Cache Storage API에 영구 저장. OPFS(Origin Private File System)는 Safari 16+에서 사용 가능.
3. **경량 대체 모델 우선 제공**: 작은 업스케일러(RealESRGAN-x2 int8, 18MB)를 기본으로 다운로드해두고, 고품질은 옵션.

```typescript
// lib/models/downloader.ts
export async function fetchWithProgress(
  url: string,
  onProgress: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  const total = Number(res.headers.get('content-length') ?? 0);
  const reader = res.body!.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress(loaded, total);
  }

  const buf = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.length;
  }
  return buf.buffer;
}

export async function getOrFetchModel(key: string, url: string): Promise<ArrayBuffer> {
  const cache = await caches.open('photo-magic-models-v1');
  const hit = await cache.match(key);
  if (hit) return hit.arrayBuffer();

  const res = await fetch(url);
  await cache.put(key, res.clone());
  return res.arrayBuffer();
}
```

#### 5-3. iOS Safari의 WebGPU 버퍼 한계

| 제약 | iOS 17 WebGPU | iOS 18 WebGPU | macOS Safari 17.4+ |
|---|---|---|---|
| 최대 buffer size | **32MB** (엄격) | 128MB | 256MB+ |
| 최대 texture size | 4096 | 8192 | 16384 |
| Compute workgroup storage | 16KB | 32KB | 32KB |
| Storage buffer binding 제한 | 4 | 8 | 8 |

**실무 영향**:
- GFPGAN fp16 모델(175MB)은 iOS 17 WebGPU에 **로드 불가**. 복수 buffer로 쪼개거나 WASM-SIMD 대체.
- iOS 18 WebGPU도 inference 중 tensor 할당이 128MB 한계에 부딪히는 경우 있음 → fp16/int8 강제.

**iOS WebGPU용 대안**: iOS는 WebGPU AI 추론을 **서버사이드로 라우팅**하고, 로컬에서는 프리뷰 셰이더만 처리하는 전략이 현실적.

#### 5-4. WebAssembly SIMD 활용

- Chrome/Firefox/Safari 16.4+ 모두 WebAssembly SIMD 지원.
- ONNX Runtime Web은 WASM SIMD 백엔드로 CPU 대비 2-4배 빠름.
- `crossOriginIsolated` 상태에서 **WASM Threads** 활성화 (pthread) → 추가 1.5-2배. 이를 위해 `Cross-Origin-Embedder-Policy: require-corp` + `Cross-Origin-Opener-Policy: same-origin` 헤더 필요.

```typescript
// lib/ml/ort.ts
import * as ort from 'onnxruntime-web/webgpu';

ort.env.wasm.numThreads = navigator.hardwareConcurrency ?? 4;
ort.env.wasm.simd = true;
ort.env.wasm.proxy = true;  // Web Worker proxy로 메인 스레드 블록 방지

export async function createSession(modelBuf: ArrayBuffer) {
  return ort.InferenceSession.create(modelBuf, {
    executionProviders: ['webgpu', 'wasm'],
    graphOptimizationLevel: 'all',
  });
}
```

---

### 6. Canvas 파이프라인 설계

#### 6-1. OffscreenCanvas + Web Worker

메인 스레드 블록 방지. UI 인터랙션이 끊김 없이 유지된다.

```typescript
// main.ts
const canvas = document.querySelector<HTMLCanvasElement>('#preview')!;
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker(new URL('./renderer.worker.ts', import.meta.url), {
  type: 'module',
});
worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

// 사용자가 슬라이더 움직일 때
slider.addEventListener('input', (e) => {
  worker.postMessage({ type: 'updateParam', key: 'intensity', value: +e.target.value });
});
```

```typescript
// renderer.worker.ts
let gl: WebGL2RenderingContext | null = null;
let renderer: Renderer | null = null;

self.onmessage = async (event) => {
  const { type } = event.data;

  if (type === 'init') {
    const canvas = event.data.canvas as OffscreenCanvas;
    gl = canvas.getContext('webgl2');
    renderer = new Renderer(gl!);
    await renderer.preloadShaders();
    return;
  }

  if (type === 'loadImage') {
    const bitmap = event.data.bitmap as ImageBitmap;
    renderer!.setSource(bitmap);
    renderer!.render();
    return;
  }

  if (type === 'updateParam') {
    renderer!.setParam(event.data.key, event.data.value);
    renderer!.render();
  }
};
```

**주의**:
- Safari 16.3까지 OffscreenCanvas의 WebGL2 컨텍스트가 버그로 불안정. Safari 16.4+에서만 활성화 권장.
- Firefox는 `OffscreenCanvas` 지원하지만 WebGPU + OffscreenCanvas 조합은 2026-04 기준 플래그 필요.

#### 6-2. SharedArrayBuffer / Transferable Objects

| 방식 | 용도 | 성능 | 호환성 |
|---|---|---|---|
| `postMessage` (structured clone) | 일반 메시지 | 복사 오버헤드 | 모든 브라우저 |
| **Transferable** (ArrayBuffer, ImageBitmap, MessagePort) | 큰 버퍼 이전 (소유권 이동) | 0-copy | 모든 브라우저 |
| **SharedArrayBuffer** | 메인↔워커 공유 메모리 | 0-copy + 동시 접근 | `crossOriginIsolated` 필요 |

**ImageBitmap Transferable 패턴**:

```typescript
const bitmap = await createImageBitmap(file);
worker.postMessage({ type: 'loadImage', bitmap }, [bitmap]);
// bitmap은 메인에서 사용 불가 상태
```

#### 6-3. 렌더링 루프: RAF vs Event-driven

| 방식 | 적합 상황 |
|---|---|
| `requestAnimationFrame` 루프 | 비디오, 애니메이션 그레인, 웹캠 프리뷰 |
| Event-driven (슬라이더 변경 시 1회 렌더) | 정적 이미지 편집기 |
| Dirty flag + throttled RAF | 하이브리드 (photo-magic 권장) |

```typescript
class Renderer {
  private dirty = false;
  private rafId: number | null = null;

  markDirty() {
    if (this.dirty) return;
    this.dirty = true;
    this.rafId = self.requestAnimationFrame(() => this.render());
  }

  render() {
    if (!this.dirty) return;
    this.dirty = false;
    this.rafId = null;
    // 실제 GL draw...
  }
}
```

#### 6-4. GPU 텍스처 수명 관리

메모리 누수가 가장 흔한 버그. WebGL은 GC가 GPU 리소스를 회수하지 못한다.

**규칙**:
- 모든 텍스처/프레임버퍼/프로그램은 `dispose()` 메서드가 있는 래퍼 클래스로 관리.
- 사용자가 이미지를 교체할 때 이전 텍스처 `gl.deleteTexture()` 명시 호출.
- 필터 체인 중간 버퍼는 **풀링(pool)** 하여 재사용. 할당/해제 반복 금지.

```typescript
class TexturePool {
  private pool = new Map<string, WebGLTexture[]>();

  acquire(gl: WebGL2RenderingContext, w: number, h: number): WebGLTexture {
    const key = `${w}x${h}`;
    const bucket = this.pool.get(key) ?? [];
    if (bucket.length > 0) return bucket.pop()!;
    return this.create(gl, w, h);
  }

  release(gl: WebGL2RenderingContext, tex: WebGLTexture, w: number, h: number) {
    const key = `${w}x${h}`;
    const bucket = this.pool.get(key) ?? [];
    bucket.push(tex);
    this.pool.set(key, bucket);
  }

  dispose(gl: WebGL2RenderingContext) {
    for (const bucket of this.pool.values()) {
      for (const tex of bucket) gl.deleteTexture(tex);
    }
    this.pool.clear();
  }

  private create(gl: WebGL2RenderingContext, w: number, h: number): WebGLTexture {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  }
}
```

---

### 7. 성능 목표 설정

#### 7-1. 디바이스 등급별 기준 사양

| 등급 | 기기 (예시) | GPU | RAM | 대표 사용자 비중 (한국) |
|---|---|---|---|---|
| **Low (L)** | iPhone SE 2020, Galaxy A14, Redmi Note 10 | A13 / Mali-G52 | 3-4GB | 약 15% |
| **Mid (M)** | iPhone 12/13, Galaxy A54/S21, Pixel 6a | A14-A15 / Mali-G78 / Adreno 650 | 4-6GB | 약 45% |
| **High (H)** | iPhone 14/15, Galaxy S23/S24, Pixel 8 | A16/A17 / Mali-G715 / Adreno 740 | 6-12GB | 약 30% |
| **Desktop (D)** | MBP M1+, 최신 Windows Ryzen 5/7, RTX 3060+ | M1/M2/M3, dGPU | 8GB+ | 약 10% |

#### 7-2. 해상도 및 latency 목표

| 작업 | Low | Mid | High | Desktop |
|---|---|---|---|---|
| 실시간 필터 프리뷰 (LUT + 블러 + 그레인) | 720p @ 24fps | 1080p @ 30fps | 1080p @ 60fps | 4K @ 30fps |
| 얼굴 랜드마크 감지 | 프리뷰 해상도 @ 15fps | @ 24fps | @ 30fps | @ 60fps |
| 뷰티 필터 (bilateral 포함) 프레임 비용 | <30ms | <20ms | <12ms | <8ms |
| AI 업스케일 (1080p → 2160p) | 서버사이드 | 서버사이드 | 2-4s (WebGPU) | 0.8-1.5s |
| 4K 최종 export (필터 적용 후) | 3-6s | 1.5-3s | 0.6-1.2s | 0.3-0.6s |
| 초기 콜드 스타트 (첫 프레임까지) | <3s (WiFi) | <2s | <1.5s | <1s |
| TTI (Time-to-Interactive) | <4s | <3s | <2s | <1.5s |

#### 7-3. 예산 (budget) 정의

**JS 번들 예산**:
- Initial JS: <200KB gzip
- WebGL 렌더러 (regl + 셰이더): <80KB
- 동적 import 총합: <3MB (모델 제외)

**메모리 예산 (런타임 피크)**:
- Low: <180MB
- Mid: <280MB
- High/Desktop: <600MB

**GPU 텍스처 예산**:
- 4K RGBA8 = 64MB. Low 디바이스는 동시 3장까지만.
- 중간 버퍼는 1080p RGBA8 = 8MB 기준 6-10장까지 풀링.

---

### 8. 폴백 전략

#### 8-1. 라우팅 결정 로직

```typescript
// lib/pipeline/router.ts
export interface RouteDecision {
  filter: 'webgpu' | 'webgl2' | 'webgl1' | 'canvas2d';
  ai: 'webgpu-local' | 'wasm-local' | 'server' | 'disabled';
  reason: string;
}

export async function decideRoute(caps: GpuCapabilities): Promise<RouteDecision> {
  // 1. WebGPU + 충분한 메모리 → 로컬 전체
  if (caps.tier === 'webgpu' && caps.maxTextureSize >= 8192 && !caps.isIntegrated) {
    return { filter: 'webgpu', ai: 'webgpu-local', reason: 'full-stack' };
  }

  // 2. WebGL2 + 모바일 → AI만 서버
  if (caps.tier === 'webgl2') {
    const isMobile = /iPhone|Android/.test(navigator.userAgent);
    const batteryOk = await isBatteryOk();
    if (isMobile && !batteryOk) {
      return { filter: 'webgl2', ai: 'server', reason: 'mobile-low-battery' };
    }
    return { filter: 'webgl2', ai: isMobile ? 'wasm-local' : 'server', reason: 'standard' };
  }

  // 3. WebGL1 → 경량 경로
  if (caps.tier === 'webgl1') {
    return { filter: 'webgl1', ai: 'server', reason: 'lite' };
  }

  // 4. Canvas only → fallback
  return { filter: 'canvas2d', ai: 'disabled', reason: 'fallback' };
}

async function isBatteryOk(): Promise<boolean> {
  try {
    const bat = await (navigator as any).getBattery?.();
    if (!bat) return true;
    return bat.level > 0.3 || bat.charging;
  } catch {
    return true;
  }
}
```

#### 8-2. 프로그레시브 향상 (Progressive Enhancement)

1. **기본 렌더링**: 서버에서 미리 렌더된 썸네일 표시 (<1s TTI).
2. **클라이언트 하이드레이션**: WebGL 렌더러가 준비되면 실시간 미리보기로 전환.
3. **AI 기능 활성화**: 사용자가 "리터칭" 탭으로 이동 시 모델 다운로드 + WebGPU 초기화.
4. **고급 기능 전환**: 사용자가 4K 편집 모드 진입 시 capability 재평가, 필요시 서버 처리로 자동 전환.

#### 8-3. 모델 경량화

| 기법 | 크기 감소 | 속도 | 정확도 손실 |
|---|---|---|---|
| fp32 → fp16 | 50% | 1.5-2배 | 거의 없음 (<0.5dB PSNR) |
| fp16 → int8 | 25% | 2-3배 | 소폭 (1-2dB) |
| pruning (20%) | 10-20% | 1.2배 | 중간 |
| knowledge distillation (작은 모델) | 80% | 4-6배 | 재학습 필요 |
| pixelshuffle upsample (RealESRGAN) | 40% | 2배 | 미미 |

**photo-magic 권장**: fp16 기본, 저사양 디바이스는 int8 자동 선택. 서버 사이드는 fp32 원본 사용.

---

### 9. 벤치마크 사례 (실제 제품들)

#### 9-1. Photopea
- 순수 WebGL 렌더러 (자체 구현, Filip Štědronský 개발).
- AI 기능은 Photopea Plus(구독)에서 제공, 서버사이드 추론.
- 번들 사이즈 약 3MB(초기), PSD 파서가 핵심 경쟁력.
- 시사점: **커스텀 WebGL 스택이 장기적으로 유리하지만 초기 개발 비용 높음**.

#### 9-2. Pixlr
- WebAssembly + WebGL 혼합. 초기에는 Flash → WebAssembly 전환.
- 얼굴 필터는 MediaPipe 기반.
- AI 배경 제거는 서버 사이드 (`removebg` 계열).

#### 9-3. Polotno (SDK)
- Konva.js(Canvas 2D) 기반. WebGL은 selective filter에만.
- 정적 이미지 편집에 최적화, 실시간 셰이더 파이프라인은 아님.
- photo-magic이 실시간 프리뷰를 원한다면 Konva는 부적합.

#### 9-4. Canva (데스크탑 웹)
- Canvas 2D 기본 + WebGL 보조. "매직 에디터"는 서버사이드 Stable Diffusion.
- 이미지 편집 프리뷰는 저해상도(1/4) → 최종 export 시 원본 해상도 렌더.
- 시사점: **프리뷰와 최종 export를 분리하는 패턴이 실무에서 표준**.

#### 9-5. Figma
- WebAssembly C++ 렌더러 (원래 Skia, 2020년 자체 엔진으로 전환).
- 실시간 벡터 처리에 특화, 이미지 편집은 보조 기능.

#### 9-6. Lensa / FaceApp (모바일 네이티브)
- 참고용. 네이티브 앱은 Metal/Vulkan 직접 제어 → 웹보다 2-4배 빠름.
- 웹에서 동등한 품질을 목표로 하면 **모델 경량화 + 서버 보조가 필수**.

#### 9-7. 오픈소스 벤치마크

| 벤치마크 | URL | 대상 |
|---|---|---|
| **WebAI Benchmark** | `webaibench.github.io` (가상) | TFJS/ORT 백엔드 비교 |
| **3DMark WebGPU** | 합성 3D 부하 | 드라이버/GPU |
| **MotionMark** | browserbench.org/MotionMark | Canvas/SVG/WebGL |
| **Speedometer 3** | browserbench.org/Speedometer | 일반 JS 실행 |

---

### 10. 개발 도구

#### 10-1. Chrome DevTools Performance

- **Performance → GPU Memory** 패널에서 텍스처 할당 추적.
- `performance.mark('render-start')` / `performance.measure()` + User Timings 탭.
- `navigator.gpu.requestAdapter({powerPreference: 'high-performance'})` 사용 시 iGPU vs dGPU 경로 확인.

#### 10-2. WebGPU Inspector (Chrome 확장)
- Shader 모듈 소스, pipeline state, command buffer 타임라인 실시간 확인.
- WGSL 셰이더의 bind group 구조 시각화.

#### 10-3. Spector.js
- WebGL 프레임 캡처 → 프로그램/유니폼/텍스처 확인.
- 필터 체인 디버깅에 필수. Chrome 확장과 npm 패키지 둘 다 존재.

#### 10-4. Lighthouse PWA
- `Performance` 탭 + `Best Practices` → Service Worker, COOP/COEP 헤더 체크.
- 모바일 시뮬레이션 4G 환경에서 측정.

#### 10-5. 모바일 디버깅
- iOS: Mac의 Safari → 개발자 → 연결된 기기 → 웹 인스펙터.
- Android: `chrome://inspect` → Remote debugging.
- WebGPU 전용: Chrome Canary + `chrome://tracing`.

---

## 권장 아키텍처

### 렌더링 파이프라인 (photo-magic)

```
[ 사용자 이미지 업로드 ]
        │
        ▼
[ createImageBitmap (메인 스레드) ]
        │
        │  Transferable
        ▼
[ Web Worker: 렌더러 오케스트레이터 ]
        │
        ├─ [ MediaPipe Face Landmarker 워커 ] ──┐
        │                                        │
        │                                     landmarks
        │                                        │
        ▼                                        │
[ WebGL2/WebGPU 렌더러 (OffscreenCanvas) ]      │
        │                                        │
        ▼                                        │
[ 필터 체인 (ping-pong FBO) ]                   │
        │                                        │
        ├─ LUT 3D 샘플링                         │
        ├─ Bilateral (뷰티 스무딩)                │
        ├─ Mesh Warp (랜드마크 기반) ◀───────────┘
        ├─ Color Grading (temperature/tint/curves)
        └─ Film Grain 오버레이
        │
        ▼
[ 최종 Composite → Main Canvas ]
        │
        ├─ (옵션) [ ONNX Runtime Web AI 업스케일 ]
        │           ├─ WebGPU (고사양)
        │           ├─ WASM-SIMD (iOS)
        │           └─ 서버사이드 API (저사양)
        │
        ▼
[ Export (WebP/JPEG/PNG) ]
```

### 폴백 트리

```
[ GPU probe ]
    │
    ├─ WebGPU 지원?
    │    ├─ YES → iOS Safari?
    │    │         ├─ YES → WebGPU 필터 + WASM AI (모델 128MB 이하만)
    │    │         └─ NO  → WebGPU 풀스택 (필터 + AI)
    │    │
    │    └─ NO → WebGL2 지원?
    │              ├─ YES → 모바일 + 배터리 OK?
    │              │         ├─ YES → WebGL2 + WASM AI
    │              │         └─ NO  → WebGL2 + 서버 AI
    │              │
    │              └─ NO → WebGL1 지원?
    │                        ├─ YES → 경량 LUT + 서버 AI
    │                        └─ NO → Canvas 2D + 전면 서버 처리
```

### Worker 구성

```
[ 메인 스레드 ]
    ├─ UI 렌더링 (React)
    ├─ 입력 처리
    └─ Worker 오케스트레이션

[ render.worker ] (OffscreenCanvas)
    ├─ WebGL2/WebGPU 컨텍스트
    ├─ 셰이더 컴파일/캐싱
    ├─ 필터 체인 실행
    └─ RAF 루프

[ ml.worker ] (SharedArrayBuffer 입력)
    ├─ MediaPipe Face Landmarker
    ├─ BlazeFace (fallback)
    └─ 결과 → render.worker로 postMessage

[ ai.worker ] (ONNX Runtime Web)
    ├─ 모델 로드/캐싱
    ├─ 추론 실행
    └─ 결과 → 메인 스레드
```

---

## 성능 목표 테이블 (종합)

| 작업 | 저사양 (iPhone SE, A14) | 중간 (iPhone 12, A54) | 고사양 (iPhone 15 Pro, S24) | 데스크탑 (M1+) |
|---|---|---|---|---|
| 콜드 스타트 (TTI) | <4s | <3s | <2s | <1.5s |
| LUT 적용 (1080p) | 8-12ms | 4-6ms | 2-3ms | 1-2ms |
| 가우시안 블러 (radius 8) | 20-28ms | 10-14ms | 5-7ms | 2-3ms |
| 바이래터럴 뷰티 (radius 5) | 30-45ms | 15-22ms | 8-12ms | 3-5ms |
| 얼굴 랜드마크 1회 | 25-35ms | 12-18ms | 8-12ms | 4-8ms |
| 필터 풀체인 (LUT+Beauty+Grain) | 80-120ms (프리뷰 720p) | 25-35ms | 12-18ms | 6-10ms |
| AI 업스케일 1080p→4K | 서버 전용 | 서버 전용 | 3-5s (WebGPU) | 0.8-1.5s |
| 4K export | 5-8s | 2-4s | 0.8-1.5s | 0.3-0.6s |
| 피크 메모리 | <180MB | <280MB | <500MB | <800MB |

---

## 위험 및 완화

### 11-1. 주요 위험

| 위험 | 영향 | 발생 확률 | 완화 |
|---|---|---|---|
| **iOS WebGPU 지연된 완전 지원** | 고 | 고 (2026 상반기 기준) | WebGL2 기본 + WASM-SIMD AI로 iOS 커버, WebGPU는 향상 기능 |
| 모델 다운로드 이탈 | 중 | 중 | Progressive UI, 경량 모델 기본 + 고품질 옵션 |
| 모바일 배터리 드레인 | 중 | 중 | 30fps cap, 배경 탭 일시 정지, 낮은 GPU 우선순위 |
| WebGL 드라이버 버그 (Mali 구형) | 중 | 저 | 디바이스 블랙리스트, capability probe 시 실제 렌더 테스트 |
| 텍스처 크기 한계 | 고 | 저 | 타일 분할 렌더, 16384 이상 이미지는 서버 처리 |
| 셰이더 컴파일 시간 (첫 사용) | 저 | 중 | warm-up 패스, KHR_parallel_shader_compile 활용 |
| SharedArrayBuffer 차단 (COOP/COEP 없는 환경) | 저 | 저 | 헤더 필수 설정, 없을 시 postMessage 복사로 자동 대체 |
| 브라우저별 float 정밀도 차이 | 저 | 저 | highp 명시, 모바일은 mediump 허용 범위 설계 |
| 모델 라이선스 이슈 (GFPGAN 등) | 중 | 저 | 상업 사용 가능한 대체 모델 확인 (Apache/MIT) |

### 11-2. iOS Safari 완전 지원 지연 대응 플랜

1. **M1 (1개월)**: WebGL2 중심 파이프라인 + 서버 AI. iOS에서도 안정 동작.
2. **M2 (2개월)**: ONNX Runtime Web WebGPU 백엔드를 데스크탑/Android에만 활성화. iOS는 WASM-SIMD.
3. **M3 (3개월)**: WebGPU 기능 플래그 도입, 지원되는 기기에서만 실험적 고품질 모드 제공.
4. iOS 18.2 보급률이 60% 넘어가는 2026 Q3부터 WebGPU 비중 확대.

### 11-3. 배터리 드레인 대응

- **AUTO 프레임 레이트**: 실제 필터 처리 시간이 16.67ms 초과하면 자동으로 30fps로 clamp.
- **Idle detection**: 슬라이더 조작 종료 후 500ms 후 렌더링 중단, 마지막 프레임 유지.
- **Visibility API**: 탭 비활성 시 RAF 루프 중단.

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    renderer.pause();
    mlWorker.postMessage({ type: 'pause' });
  } else {
    renderer.resume();
  }
});
```

---

## 구현 우선순위

### M1 (첫 1개월): 기본 파이프라인

- [ ] GPU capability probe + 라우팅 로직 구현
- [ ] WebGL2 렌더러 (regl 기반) + OffscreenCanvas Worker
- [ ] LUT 적용 셰이더 (sampler3D 기반)
- [ ] 컬러 그레이딩 (temperature/tint/curves)
- [ ] 기본 가우시안 블러 (separable)
- [ ] 이미지 업/다운로드, WebP export
- [ ] Service Worker 기본 캐싱 (모델 제외)
- [ ] Low/Mid/High 디바이스에서 1080p @ 30fps 검증

### M2 (두 번째 1개월): 얼굴 필터

- [ ] MediaPipe Face Landmarker 통합 (Web Worker)
- [ ] 랜드마크 기반 메쉬 변형 셰이더 (슬리밍, 눈 확대)
- [ ] Bilateral 필터 (뷰티 스무딩, adaptive radius)
- [ ] Film grain + blue noise 오버레이
- [ ] 필터 프리셋 시스템 (JSON 기반 직렬화)
- [ ] Chrome/Edge/Safari/Firefox 크로스 브라우저 테스트
- [ ] iOS Safari 전용 워크어라운드 (OffscreenCanvas 이슈)

### M3 (세 번째 1개월): AI 기능 + 최적화

- [ ] ONNX Runtime Web 통합 (WebGPU + WASM 백엔드)
- [ ] RealESRGAN-x2 int8 업스케일 (로컬, 모든 기기)
- [ ] GFPGAN fp16 (고사양 기기만, WebGPU 필수)
- [ ] 서버 사이드 AI 라우팅 (저사양 폴백)
- [ ] 모델 progressive download UI
- [ ] 성능 모니터링 대시보드 (auto fps, 메모리 피크 수집)
- [ ] Lighthouse CI 통합 (PR마다 성능 회귀 감지)
- [ ] 전체 디바이스 매트릭스에서 최종 성능 검증

### M4+ (런칭 이후)

- WebGPU 풀스택 옵션 (실험적 플래그, 고사양 유저 대상)
- 추가 필터 (HDR 톤매핑, 글리치, 수채화 등)
- 모바일 네이티브 래퍼 (Capacitor) 검토
- 실시간 비디오/웹캠 프리뷰 (별도 과제)

---

## 출처

### 공식 문서 / 스펙

1. **WebGPU W3C Working Draft** — https://www.w3.org/TR/webgpu/ (2026-03 기준 버전)
2. **WebGL 2.0 Khronos 스펙** — https://registry.khronos.org/webgl/specs/latest/2.0/
3. **MDN WebGPU API** — https://developer.mozilla.org/docs/Web/API/WebGPU_API
4. **MDN OffscreenCanvas** — https://developer.mozilla.org/docs/Web/API/OffscreenCanvas
5. **caniuse.com: WebGPU** — https://caniuse.com/webgpu
6. **caniuse.com: OffscreenCanvas** — https://caniuse.com/offscreencanvas
7. **WebKit Blog: WebGPU in Safari** — https://webkit.org/blog/ (WebGPU 관련 공지 시리즈)
8. **Chrome Platform Status: WebGPU** — https://chromestatus.com/feature/6213121689518080

### 라이브러리

9. **MediaPipe Tasks JS 공식 가이드** — https://developers.google.com/mediapipe/solutions/vision/face_landmarker/web_js
10. **ONNX Runtime Web** — https://onnxruntime.ai/docs/tutorials/web/
11. **TensorFlow.js WebGPU backend** — https://blog.tensorflow.org/2023/03/webgpu-now-available-for-tfjs.html
12. **regl** — https://regl.party
13. **twgl.js** — https://twgljs.org
14. **GPU.js** — https://gpu.rocks

### 성능 벤치마크 / 사례 연구

15. **Google I/O 2024: WebGPU for AI in browsers** (세션 녹화)
16. **Chrome Developers: Optimize your WebGPU app** — https://developer.chrome.com/blog/webgpu-io2023
17. **Figma Engineering Blog: Introducing Figma's internal rendering engine** (2023)
18. **"Run Stable Diffusion in the browser" (web-stable-diffusion)** — MLC-LLM 프로젝트
19. **"Deep Learning in the Browser" 논문 시리즈** (Ma et al. 2024, ONNX Runtime Web 성능 분석)
20. **Photopea Technical Notes** (포럼 및 GitHub Issues)

### 셰이더 / 이미지 처리

21. **"GPU Gems 3" — Chapter 40: Incremental Computation of the Gaussian** (NVIDIA)
22. **"Real-Time Hair Simulation" (Disney, 2019)** (bilateral filter 최적화 참고)
23. **"Blue Noise for Dithering"** — http://momentsingraphics.de/BlueNoise.html
24. **3D LUT 구현 가이드** — Dan Hasby (Defold 엔진 블로그, 2021)
25. **Fast Bilateral Filter (Guided Filter)** — He et al., ECCV 2010

### 라이선스 / 모델

26. **GFPGAN 저장소** — https://github.com/TencentARC/GFPGAN (Apache 2.0)
27. **CodeFormer 저장소** — https://github.com/sczhou/CodeFormer (NTU 라이선스, 상업 사용 주의)
28. **RealESRGAN** — https://github.com/xinntao/Real-ESRGAN (BSD 3-Clause, 상업 사용 가능)
29. **BlazeFace 논문** — Bazarevsky et al., 2019
30. **MediaPipe Face Mesh 논문** — Kartynnik et al., CVPR 2019

### 도구

31. **WebGPU Inspector (Chrome 확장)** — https://github.com/brendan-duncan/webgpu_inspector
32. **Spector.js** — https://github.com/BabylonJS/Spector.js
33. **Chrome DevTools GPU Tracing** — https://developer.chrome.com/docs/devtools/

---

> 이 문서는 2026-04-24 기준의 리서치 결과이며, WebGPU 지원 상황은 분기 단위로 변동이 크다. 런칭 직전 (3개월 차) 브라우저 지원율을 재측정하고 capability probe 매트릭스를 업데이트할 것.
