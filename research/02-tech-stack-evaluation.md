# 오픈소스 기술 스택 심층 평가

> **대상 프로젝트**: photo-magic (SNS 사진 편집기)
> **작성일**: 2026-04-24
> **평가 범위**: 웹 에디터 UI, 뷰티 필터, AI 얼굴 복원/업스케일/배경 제거, Next.js 15+ App Router, FastAPI 백엔드, 스토리지, DB, 모노레포
> **런칭 목표**: 3개월 내 프로덕션

---

## Executive Summary

### 최종 권장 스택 한눈에 보기

| 계층 | 선택 | 이유 |
|------|------|------|
| 프론트 에디터 코어 | **Konva.js + React-Konva + 커스텀 툴킷** | 확장성/SSR 친화성/번들 크기 균형 |
| 보조 편집 기능 (크롭/필터) | **Filerobot Image Editor** (선택적) | MIT, React-native, TUI보다 React 친화 |
| 뷰티 필터(클라이언트 실시간) | **MediaPipe Face Landmarker + 자체 WebGL 셰이더** | 468개 랜드마크, 모바일 30+ FPS |
| AI 얼굴 복원 | **GFPGAN v1.4 + CodeFormer** (병렬 옵션) | 품질-속도 밸런스, 상용 가능 라이선스 검증 필요 |
| AI 업스케일 | **Real-ESRGAN (anime + general x4)** | 속도/품질 업계 표준 |
| 배경 제거 | **InSPyReNet (고품질 기본) + rembg (경량 폴백)** | 머리카락 엣지 최상급 |
| Next.js 런타임 | **Next.js 15.x (App Router) + React 19** | RSC/Server Actions/Streaming |
| 백엔드 프레임워크 | **FastAPI + Pydantic V2 + SQLAlchemy async** | 사용자 기존 규칙과 일치 |
| AI 서빙 | **BentoML 또는 커스텀 uvicorn+Celery** | GPU 단일 인스턴스는 BentoML, 비GPU는 Celery |
| 큐 | **Celery + Redis (Broker/Result)** | 성숙도/파이썬 생태계/GPU 워커 분리 |
| 오브젝트 스토리지 | **Cloudflare R2 (presigned) + imgproxy** | S3 호환 + egress 무료 + 온디맨드 변환 |
| DB | **PostgreSQL 16 + Redis 7** | 검증된 조합, ClickHouse는 Phase 2 |
| 모노레포 | **pnpm workspaces + Turborepo + Biome + Changesets** | Biome 이미 사용, Nx 대비 진입 장벽 낮음 |

### 3개월 내 런칭 가능성 판단

- **Green (확정)**: Next.js 15, FastAPI, PostgreSQL, Redis, pnpm+Turborepo, Konva.js, MediaPipe, Real-ESRGAN, rembg
- **Yellow (PoC 필요)**: GFPGAN/CodeFormer 라이선스 상용 검증, InSPyReNet 모바일 성능, BentoML vs Celery 최종 결정
- **Red (리스크 존재)**: GPUPixel WASM 빌드 (실제 시도 필요), Pintura 상용 라이선스 비용, 모바일 사파리 WebGL2 호환 이슈

---

## 1. 웹 이미지 에디터 UI 라이브러리

### 1.1 후보 비교표

| 라이브러리 | 라이선스 | GitHub Stars (2026-04 기준) | 마지막 주요 릴리스 | 번들 크기(min+gzip) | React 지원 | TypeScript | SSR/RSC | 한국어화 | 확장성 |
|------------|----------|-----------------------------|---------------------|----------------------|------------|------------|---------|----------|--------|
| TOAST UI Image Editor | MIT | ~7k | 2022년 (3.15.x 정체) | ~800KB | 래퍼만 제공 | 부분 (.d.ts 불완전) | 불가 ('use client' 필수) | 기본 제공 | 제한적 |
| Filerobot Image Editor | MIT | ~1.5k | 활발 (v4.x 유지보수) | ~500KB | React 네이티브 | 양호 | 'use client' 필요 | i18n 플러그인 구조 | 보통 |
| Pintura | **상용** (부분 무료 데모) | 비공개 | 활발 | ~200KB (lean) | React 어댑터 | 최상 | 지원 | i18n 완비 | 상 (플러그인 API) |
| Ente Photo Editor | AGPL-3.0 (모바일 중심) | ~3k (메인 레포) | 활발 | 웹 전용 SDK 아님 | 없음 | N/A | N/A | 없음 | 낮음 (포크 필요) |
| Konva.js | MIT | ~12k | 매우 활발 (v9.x) | ~150KB | react-konva 별도 | 양호 | 'use client' 필요 | 직접 구현 | 최상 |
| Fabric.js | MIT | ~30k | 활발 (v6.x TS 전면 개편) | ~300KB | 래퍼 없음(직접) | v6부터 완비 | 'use client' 필요 | 직접 구현 | 최상 |

### 1.2 상세 분석

#### 1.2.1 TOAST UI Image Editor (nhn/tui.image-editor)

- **장점**
  - 기본 필터/크롭/회전/텍스트/도형/마스크/히스토리 등 에디터 기능 풀세트 제공
  - 한국어 i18n 기본 포함 (NHN 제작)
  - 데모 및 예제 풍부
- **단점 / 주의사항**
  - 최근 3년간 주요 리팩토링 없음 (v3.15.x에서 사실상 정체)
  - TypeScript 타입 선언이 미완성 (커뮤니티 fork 필요 경우 있음)
  - Fabric.js 1.x 내부 의존 → 번들 비대, 모던 Canvas API 최적화 부재
  - React 18 concurrent 모드와 충돌 사례 보고
  - 모바일 터치 UX 부실 (핀치 줌 미지원 영역 다수)
- **결론**: "빨리 MVP"용으로만 고려. 실제 SNS 편집기 수준 커스텀 UX가 필요하면 한계 명확. **비추천**.

#### 1.2.2 Filerobot Image Editor (scaleflex)

- **장점**
  - React-native 구현, hooks 지원
  - MIT, 활발한 유지보수
  - 플러그인 구조로 필터/텍스트/워터마크 추가 용이
  - TypeScript 지원 양호
- **단점**
  - 한국어 번역은 직접 주입 필요
  - 디자인 토큰 커스터마이징 제한적 (CSS overrides)
  - Konva/Fabric 대비 캔버스 저수준 제어 어려움
- **권장 용도**: 크롭·회전·기본 필터 등 "보조 편집" 페이지에 임베딩. 메인 에디터 대체로는 권장하지 않음.

#### 1.2.3 Pintura (pqina)

- **장점**
  - 가장 모던한 코드베이스, 작은 번들, 훌륭한 모바일 UX
  - 최상급 TypeScript 지원
  - 플러그인 API가 세련됨
  - 접근성(WCAG) 세심
- **단점 / 주의사항**
  - **상용 라이선스 필수** (개발자 라이선스 ~$200, 프로덕션 ~$500-$2000+/매출 기준)
  - 내부 fork/수정 제약
  - 무료 데모는 워터마크 삽입
- **결론**: 예산 허용 시 최상의 옵션. 하지만 "오픈소스 기반"을 전제로 하는 본 프로젝트에는 범위 밖. 참고 레퍼런스로만 활용.

#### 1.2.4 Ente Photo Editor SDK

- **상세**
  - Ente는 E2EE 사진 호스팅 플랫폼으로, 자체 포토 에디터를 갖추고 있음
  - 레포 (`ente-io/ente`): AGPL-3.0, 모노레포 내 `web/apps/photos` 하위 편집기 컴포넌트
  - 독립 SDK 형태로 배포되지 않음 → 사용하려면 코드 추출/포크
- **단점**
  - AGPL-3.0은 **SaaS에도 소스 공개 의무가 부과**되어 상업 SNS 서비스에서 부담
  - 에디터 기능은 기본(크롭/회전/필터/텍스트) 수준, 뷰티 필터나 AI는 없음
  - 의존성이 Ente 내부 인프라와 결합
- **결론**: 라이선스 리스크와 추출 비용 대비 얻는 이득이 적음. **비추천**.

#### 1.2.5 Konva.js / React-Konva

- **장점**
  - 2D Canvas 추상화로 객체/레이어/이벤트 시스템 제공 (가장 성숙)
  - React-Konva가 선언형 React 통합 제공
  - 번들 크기 작고(약 150KB), 트리쉐이킹 용이
  - 활발한 유지보수, 모바일 터치 이벤트 1급 시민
  - WebGL 필터 일부 지원 (`Konva.Filters`)
- **단점**
  - "에디터 UI"는 직접 구현해야 함 (툴바, 패널 등)
  - RSC와 직접 통합 불가 → `'use client'` 경계 필요
- **권장 용도**: **메인 에디터 캔버스 코어**. 상단에 자체 툴바/필터/레이어 패널 구축.

#### 1.2.6 Fabric.js v6

- **장점**
  - 가장 유명한 브라우저 Canvas 에디터 엔진
  - v6에서 TypeScript로 전면 재작성, 트리쉐이킹 가능
  - 객체 직렬화(JSON) → 편집 상태 영속화 용이
  - 자유 드로잉, 필터, 텍스트 커서 등 풍부
- **단점**
  - React 공식 바인딩 없음 → 수동 통합
  - 일부 API는 여전히 명령형이라 React 상태 동기화 코드 자체 작성 필요
  - 모바일 터치 성능이 Konva보다 낮다는 보고 多
- **권장 용도**: 이미 Fabric 에코시스템(커뮤니티 플러그인)이 필요한 경우에 한해 검토.

### 1.3 권장: **Konva.js + React-Konva (메인) + Filerobot (보조)**

**이유**
1. 메인 에디터의 차별점은 "뷰티 필터 + AI 파이프라인"이므로, 캔버스는 유연한 저수준이 필요하다 → Konva
2. Konva는 터치/성능/번들/활성도가 모두 우수하고 TypeScript도 쓸 만
3. 크롭/회전/기본 필터 같은 일반 편집은 Filerobot을 모달/탭으로 임베딩해 생산성 확보 가능
4. TUI/Fabric 대비 유지보수 활성도·모바일 UX가 우수
5. Pintura는 예산 확보 후 Phase 2에서 재검토

**구현 노트**
- `'use client'` 컴포넌트로 `EditorCanvas.tsx` 분리, RSC는 `editor/page.tsx`에서 초기 메타데이터만 SSR
- Konva stage → offscreen canvas → `toDataURL()` / `toBlob()`으로 API 전송
- 히스토리(undo/redo)는 zustand + immer로 상태 스택 관리
- 텍스트 렌더링은 `next/font` + Konva `Text` 조합 (폰트 로드 대기 후 draw)

---

## 2. 뷰티 필터 엔진 (클라이언트 실시간)

### 2.1 후보 비교표

| 엔진 | 라이선스 | 런타임 | 얼굴 랜드마크 수 | 모바일 FPS(목표 30) | 모델 크기 | 번들/SDK 크기 | TypeScript | 한국어 문서 |
|------|----------|--------|------------------|----------------------|-----------|----------------|------------|-------------|
| GPUPixel (pixpark) | MIT | C++/Metal/OpenGL → WASM 이식 필요 | (사용 모델 따라) | 네이티브는 60+, WASM PoC 필요 | 수 MB | WASM 빌드 크기 측정 필요 | 없음 (래퍼 필요) | 없음 |
| JeelizFaceFilter | Apache-2.0 | WebGL + 자체 모델 | 랜드마크 자체는 경량 | 30-60 (기기별) | ~1.5MB | ~500KB | .d.ts 일부 | 없음 |
| MediaPipe Face Landmarker (Tasks API) | Apache-2.0 | WebAssembly + GPU delegate | **478개** | 30-60 (iOS 사파리 포함) | ~3-10MB | 1-2MB | 공식 .d.ts | 영문만 |
| face-api.js | MIT | TensorFlow.js | 68개 | 15-25 (모바일에서 마진) | ~6-10MB | ~400KB | 있음 | 영문만 |

### 2.2 상세 분석

#### 2.2.1 GPUPixel

- **특징**: iOS/Android 네이티브 뷰티 필터 엔진으로 유명. GPUImage 철학을 계승.
- **브라우저 통합 리스크**
  - 공식 WASM 빌드 배포는 없음. Emscripten 직접 빌드 필요.
  - OpenGL ES 의존 코드가 있어 WebGL2 매핑 필요
  - 성공 사례 보고가 적음 → 3개월 런칭 일정에는 **리스크**
- **결론**: Phase 2 이후 연구 과제로 분리. 초기 런칭에는 제외.

#### 2.2.2 JeelizFaceFilter

- **장점**
  - 브라우저 전용으로 설계 → 번들 작고 빠름
  - AR 스티커·3D 마스크 예제 풍부
  - 안드로이드 구형 크롬도 동작
- **단점**
  - 랜드마크 밀도가 낮아 정밀 뷰티(피부 디테일, 눈 확대 등)에는 부족
  - 최근 업데이트 속도 하락
- **결론**: AR 스티커 피처 추가 시 보조로 고려. 메인 뷰티는 MediaPipe 우위.

#### 2.2.3 MediaPipe Face Landmarker (Tasks API, `@mediapipe/tasks-vision`)

- **장점**
  - 478개 랜드마크 + 52개 blendshape + 4×4 얼굴 변환 행렬 제공 → 얼굴 성형, 표정 이펙트, 라이팅 모두 가능
  - GPU delegate (WebGL) 지원 → 모바일에서도 30+ FPS 가능
  - Apache-2.0, 상업적 사용 허용
  - Google이 Tasks API(2023-)로 리팩토링하여 SDK가 모던하고 TypeScript 타입 제공
  - 활발한 유지보수 (2026년 기준 최신 릴리스 주기 유지)
- **단점**
  - 모델 다운로드 필요 (초기 로딩 1~3초) → Service Worker 캐시로 해결
  - iOS 사파리에서 GPU delegate 불가한 케이스 존재 → CPU 폴백 경로 준비
- **결론**: **메인 뷰티 필터 랜드마크 소스로 채택**.

#### 2.2.4 face-api.js

- **특징**: TensorFlow.js 위에 얹힌 얼굴 검출/랜드마크 라이브러리
- **단점**: 모바일 FPS가 낮고, 모델 크기가 큼. 최근 유지보수 저조.
- **결론**: 레거시 대안. 초기 런칭에는 채택하지 않음.

### 2.3 뷰티 필터 셰이더 구현 권장

- MediaPipe로 얻은 랜드마크·blendshape를 입력으로, 자체 WebGL2 프래그먼트 셰이더에서 다음 효과 구현
  1. **피부 스무딩 (Bilateral/Surface blur + frequency separation)**
  2. **피부 톤 보정 (LUT + selective saturation)**
  3. **얼굴 슬림/눈 확대 (랜드마크 기반 2D warp)**
  4. **치아 미백·립 틴트·블러셔 (랜드마크 영역 마스크 + 색 혼합)**
  5. **피부 광택 하이라이트 (HDR 스펙큘러)**
- `OffscreenCanvas` + `WebGL2RenderingContext`로 메인 스레드 분리, `requestVideoFrameCallback`로 실시간 루프
- `prefers-reduced-motion`·저성능 기기에서는 다운샘플링(내부 해상도 0.5x) 폴백

### 2.4 권장: **MediaPipe Face Landmarker + 자체 WebGL2 셰이더 스택**

---

## 3. AI 얼굴 복원/스무딩 (서버 사이드)

### 3.1 후보 비교표

| 모델 | 라이선스 | 저장소 | 품질 | 512×512 추론 속도 (T4 GPU) | CPU 가능 | 파이썬 통합 난이도 |
|------|----------|--------|------|------------------------------|----------|---------------------|
| GFPGAN v1.4 | Apache-2.0 (BasicSR 일부 포함) | TencentARC/GFPGAN | ★★★★ | ~150-300ms | 매우 느림 (5~15s) | 쉬움 (pip + 가중치) |
| CodeFormer | **S-Lab License 1.0** (학술/비상업) | sczhou/CodeFormer | ★★★★★ (자연스러움) | ~300-500ms | 가능하나 느림 | 쉬움 |
| RestoreFormer++ | MIT (대부분) | wzhouxiff/RestoreFormer | ★★★★ | ~400ms | 가능 | 중간 |
| GPEN | Apache-2.0 | yangxy/GPEN | ★★★★ | ~250ms | 가능 | 중간 (자체 빌드 필요) |

> ※ 속도 수치는 공식 레포와 커뮤니티 벤치 평균치. 프로젝트에서 자체 측정 필요.

### 3.2 상세 분석

#### 3.2.1 GFPGAN v1.4

- **장점**: Apache-2.0, 파이프라인 표준, GFPGAN + Real-ESRGAN 콤보 사례 풍부
- **단점**: 과도한 "플라스틱 피부" 경향. 정체감 보존은 CodeFormer보다 약간 낮음.
- **의존성**: `basicsr`, `facexlib`, `gfpgan`. BasicSR의 일부 코드에 BSD가 섞여 있어 라이선스 준수 주의.

#### 3.2.2 CodeFormer

- **장점**: 현존 최상급 얼굴 복원 품질·자연스러움
- **단점**: **라이선스**가 치명적 — S-Lab License 1.0 (비상업 전용). 상업 SNS 서비스에 사용하려면 별도 상업 라이선스 협의 필요.
- **결론**: **상업적 사용 불가 기본 전제**. 데모/내부 품질 비교 기준치로만 활용.

#### 3.2.3 RestoreFormer++

- **장점**: MIT 가중치 배포, 품질 GFPGAN 이상
- **단점**: 커뮤니티 유지보수가 CodeFormer/GFPGAN 대비 약함
- **결론**: GFPGAN 대안으로 벤치할 가치 있음.

#### 3.2.4 GPEN

- **장점**: 실제 피부 디테일 보존 우수, Apache-2.0
- **단점**: 공식 설치 과정이 덜 매끈 (custom CUDA ops)
- **결론**: GPU 파이프라인 확정 후 추가 옵션으로 검토.

### 3.3 권장: **기본 GFPGAN v1.4, A/B 벤치마크 후 필요시 RestoreFormer++ 또는 GPEN 추가**

- CodeFormer는 "데모 품질 상한"으로 내부 비교만 수행
- 사용자에게 `strength` 슬라이더 노출 (0-1) → 원본과 알파 블렌딩
- 얼굴 bbox는 facexlib 내장 또는 MediaPipe 결과 재활용 (MediaPipe 랜드마크로 정밀 크롭 가능)

### 3.4 라이선스 체크리스트

- [ ] GFPGAN 가중치: Apache-2.0 명시 확인 (공식 릴리스 기준)
- [ ] basicsr/facexlib 의존성: Apache-2.0
- [ ] Real-ESRGAN 가중치: 가중치별 BSD-3 또는 Apache (anime 모델은 별도)
- [ ] CodeFormer 가중치는 **배포 금지**. 로컬 벤치만 후 삭제.

---

## 4. AI 업스케일

### 4.1 후보 비교표

| 모델 | 라이선스 | 저장소 | 배율 | 품질 (일반 사진) | 속도 (1024×1024 → 4x, T4) | 메모리 |
|------|----------|--------|------|-------------------|----------------------------|--------|
| Real-ESRGAN | BSD-3-Clause (code) / 가중치별 상이 | xinntao/Real-ESRGAN | 2x/4x | ★★★★★ (general/anime) | ~1-2s | ~3-5GB |
| SwinIR | Apache-2.0 | JingyunLiang/SwinIR | 2x/3x/4x/8x | ★★★★★ (PSNR 최상) | ~3-5s | ~6-10GB |
| EDSR | MIT | sanghyun-son/EDSR-PyTorch | 2x/3x/4x | ★★★★ | ~0.5-1s | ~2GB |

### 4.2 상세 분석

- **Real-ESRGAN**: 사실상 업계 표준. 타일링(tile)으로 큰 이미지 처리, 아티팩트 소거 성능 우수. `realesr-general-x4v3` (경량) + `RealESRGAN_x4plus` + `RealESRGAN_x4plus_anime_6B` 조합 운영.
- **SwinIR**: 품질은 최상이지만 Transformer 기반으로 메모리·속도 비용 높음. 배치 처리 프리미엄 티어에서 선택지로.
- **EDSR**: 가볍고 빠름. 사실상 품질은 Real-ESRGAN에게 밀려 레거시 취급.

### 4.3 권장: **Real-ESRGAN (일반 + 애니)**

- 프리셋: `fast` = realesr-general-x4v3, `quality` = RealESRGAN_x4plus
- SwinIR은 "최고 품질" 프리미엄 옵션으로 Phase 2에서 고려

---

## 5. 배경 제거

### 5.1 후보 비교표

| 모델 | 라이선스 | 저장소 | 엣지(머리카락) | 속도 (1024px, T4) | 모델 크기 | CPU 가능 |
|------|----------|--------|------------------|---------------------|-----------|----------|
| rembg (U2Net 계열) | MIT | danielgatis/rembg | ★★★ | ~200-500ms (GPU), 1-3s CPU | 수십~170MB | 양호 |
| MODNet | Creative Commons BY-NC-SA | ZHKKKe/MODNet | ★★★★ | ~100ms | 25MB | 양호 |
| BackgroundMattingV2 | MIT | PeterL1n/BackgroundMattingV2 | ★★★★ | ~50ms (HD) | ~40MB | 느림 |
| InSPyReNet | MIT | plemeri/InSPyReNet | ★★★★★ | ~500ms-1s | ~260MB | 느림 |

### 5.2 상세 분석

- **rembg**: 가장 설치 쉬움, `u2net`, `u2netp`, `silueta`, `isnet-general-use`, `birefnet` 등 다양한 가중치 스위칭 가능. 품질-속도 밸런스 우수. `birefnet` 가중치는 최신 SOTA에 근접.
- **MODNet**: 라이선스가 CC BY-NC-SA → **상업 사용 불가**. 제외.
- **BackgroundMattingV2**: 비디오/실시간 우수, 정적 이미지도 가능. 초록색 배경 요구하지 않음 (v2). MIT 라이선스.
- **InSPyReNet**: 최신 SOTA 수준 품질. 머리카락 엣지 최고. 느리지만 프리미엄 품질 티어에 적합.

### 5.3 권장: **기본 rembg (isnet-general-use / birefnet) + 프리미엄 InSPyReNet**

- rembg는 Python 진입 장벽 낮음 → 초기 구현 빠름
- InSPyReNet은 품질이 중요한 "프로 내보내기"에 프리미엄 옵션으로 제공
- BackgroundMattingV2는 동영상/라이브 기능 추가 시 고려

---

## 6. Next.js 15+ App Router 고려사항

### 6.1 Server Components vs Client Components 분리 원칙

- **Server Component (기본)**: 페이지 레이아웃, 메타데이터, 작업 목록/이력 조회 등 I/O 중심
- **Client Component (`'use client'`)**: `EditorCanvas`, 뷰티 필터 실시간 프리뷰, 드래그앤드롭 업로더, 히스토리 스토어
- **경계 설계**
  - `app/editor/page.tsx` (server): 초기 세션/이미지 메타 prefetch → props로 전달
  - `components/editor/Canvas.tsx` (client): Konva/WebGL 처리
  - Canvas에 필요한 정적 assets(아이콘, LUT 텍스처)는 `public/` 로드

### 6.2 Server Actions vs FastAPI

- **Server Actions (Next)의 장점**: 폼 제출·단건 처리에서 코드 간결
- **단점**: AI 파이프라인은 장시간/대용량/GPU 의존 → Node 런타임 내에서 처리 부적합
- **결론**: AI 호출은 **FastAPI에 위임**. Next의 Server Action은 "사전 서명 URL 발급", "작업 등록", "상태 조회" 등 경량 오케스트레이션에만 사용.
  - 업로드: Server Action → 프리사이닝 URL 반환 → 클라이언트가 R2 직접 PUT
  - 작업 시작: Server Action → FastAPI `POST /jobs` 호출 → job_id 반환
  - 진행률: Next `route.ts` SSE 또는 클라이언트 polling → FastAPI `GET /jobs/:id`

### 6.3 스트리밍·Suspense 활용

- 에디터 초기 로드 시 `loading.tsx`로 스켈레톤 제공
- 이미지 프리뷰 썸네일(서버 렌더) + Canvas 초기화(Client) 병행 → Suspense boundary 분리
- Next 15의 Partial Prerendering(PPR)이 안정화 단계이므로, 정적 마케팅 영역과 동적 에디터 영역을 PPR로 분리하면 TTFB 개선

### 6.4 대용량 이미지 업로드

- 전략: **presigned URL + multipart upload** (R2/S3 호환)
- 진행률: 클라이언트에서 `XMLHttpRequest`/`fetch + ReadableStream` + AbortController
- 50MB 초과 이미지 제한 (UI/UX 관점)
- EXIF 회전: 서버 측 Pillow/ExifRead로 보정한 "canonical" 이미지를 별도 경로에 저장, 썸네일도 함께 생성

### 6.5 이미지 컴포넌트 전략

- `next/image`는 외부 도메인(R2 공개 URL) `remotePatterns` 등록
- 에디터 내 썸네일 라이브러리는 `imgproxy`를 CDN 뒤에 두고 on-demand 리사이즈 수행
- `next/font`로 에디터 텍스트 툴의 웹폰트 최적화 (Pretendard 등)

### 6.6 보안 헤더

- `next.config.mjs`에서 CSP 설정 (WebGL/WASM 허용 `worker-src blob:`, `script-src 'self' 'wasm-unsafe-eval'`)
- `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`는 Caddy 또는 Next middleware에서 중복 설정 지양

---

## 7. 백엔드 (FastAPI)

### 7.1 AI 모델 서빙 패턴 비교

| 패턴 | 장점 | 단점 | 적합 케이스 |
|------|------|------|-------------|
| `uvicorn --workers N` (프로세스 풀) | 단순, FastAPI와 한 프로세스 | 워커마다 모델 로드 → 메모리 N배 | 경량 CPU 추론 |
| Celery + Redis 브로커 + GPU 워커 | 비동기, 스케일 아웃, 재시도/우선순위 | 관리 포인트 증가 | 혼합(GPU/CPU) 파이프라인 |
| Ray Serve | 모델 배치, 다중 모델 협업, 오토스케일 | 운영 복잡, 작은 팀에 과잉 | 모델 수 많고 트래픽 큼 |
| BentoML | 모델 아티팩트 버전·배포 통합, 어댑터/배치 내장 | 러닝 커브, 별도 런타임 | GPU 단일 서비스 |
| Triton Inference Server | 최상 GPU 효율, 다중 프레임워크 | 설정 복잡, 커스텀 전처리 까다로움 | 대규모 인퍼런스 |

### 7.2 권장: **FastAPI(API 게이트웨이) + Celery(큐) + 전용 GPU 워커**

- **이유**
  - 사용자 기존 파이썬/FastAPI 규칙(`rules/python-fastapi.md`)과 즉시 호환
  - GPU 유무 모두 커버 (CPU 폴백)
  - 작업이 5~60초 수준이라 동기 응답 부적절 → 큐 기본
  - 팀 규모·3개월 일정에서 Ray/BentoML의 학습 비용 회피
- **구조**
  ```
  apps/api (FastAPI)
    ├ routers/
    │  ├ upload.py      (presigned URL 발급)
    │  ├ jobs.py        (작업 등록/조회)
    │  └ webhooks.py
    ├ services/
    │  ├ queue.py       (Celery 태스크 enqueue)
    │  └ storage.py     (R2 S3 클라이언트)
    ├ schemas/          (Pydantic v2)
    ├ models/           (SQLAlchemy async)
    └ workers/          (Celery 태스크 정의)
       ├ beauty.py
       ├ restore.py
       ├ upscale.py
       └ matting.py
  ```
- **장시간 작업 결과 반환**: Celery task → 결과를 R2에 저장 + Postgres 업데이트 → 클라이언트는 SSE/poll로 상태 조회
- **GPU 감지**: `torch.cuda.is_available()`로 워커 기동 시 자체 태그 부여, Celery `queue=gpu` / `queue=cpu` 분리

### 7.3 BentoML 고려 포인트

- 단일 AI 팀이 있고 모델 아티팩트가 10+이면 BentoML의 이득이 커짐
- 현재 팀 규모·모델 수(4~6개)에서는 과잉
- **Phase 2에서 재평가** (트래픽 확장 시)

### 7.4 Celery vs RQ vs Temporal

| 항목 | Celery | RQ | Temporal |
|------|--------|----|----------|
| 성숙도 | 최고 | 높음 | 높음 (신흥) |
| 파이썬 친화 | 최고 | 최고 | 중 (SDK 성숙도 낮음) |
| 장시간 워크플로우/리트라이/타임아웃 | 양호 | 기본 | 최상 |
| 운영 복잡도 | 중 | 낮음 | 높음 (Temporal 서버 필요) |
| GPU 워커 라우팅 | queue/route | 제한적 | 가능 |

- **권장: Celery**. 장시간 워크플로우가 복잡해지는 시점에서 Temporal 재검토.

### 7.5 FastAPI 상세 규칙 (프로젝트 규칙 반영)

- Pydantic V2 (`field_validator`, `model_config`)
- `Annotated[Session, Depends(get_db)]` 패턴
- 라우트 prefix `/api/v1/`
- `response_model=` 또는 반환 타입 주석 필수
- 에러 응답 스키마: `{"detail": str, "code": str}`
- 프로덕션 `/docs`, `/redoc` 비활성
- CORS origin 명시 (프론트 도메인만)
- 비밀키 `pydantic-settings` + `.env`
- `async def`는 I/O, GPU 호출은 `asyncio.to_thread` 래핑 후 Celery로 위임

### 7.6 폴더 구조 예시 (도메인 기반)

```
apps/api/app/
├ main.py
├ core/
│  ├ config.py  (Settings)
│  └ security.py
├ db/
│  ├ base.py
│  └ session.py  (async)
├ domains/
│  ├ auth/
│  │  ├ router.py schemas.py models.py service.py dependencies.py
│  ├ projects/ ...
│  ├ jobs/ ...
│  └ media/ ...
└ workers/
   ├ celery_app.py
   └ tasks/
```

---

## 8. 스토리지

### 8.1 비교

| 옵션 | egress 비용 | S3 호환 | 지역(KR 근접) | 운영 부담 | presigned URL |
|------|-------------|---------|---------------|-----------|---------------|
| AWS S3 | 유료 (높음) | 원본 | 서울(ap-northeast-2) | 낮음 | 표준 |
| Cloudflare R2 | **무료** | 준호환 | 글로벌 엣지 | 낮음 | 지원 |
| MinIO 셀프호스트 | 자체 대역폭 | 원본 | 자체 리전 | 중간 | 지원 |
| Backblaze B2 | 저렴 | 준호환 | 미주/EU | 낮음 | 지원 |

### 8.2 변환 레이어

- **imgproxy** (MIT/프로 옵션): 오픈소스, libvips 기반, URL 서명으로 온디맨드 변환
- **Cloudflare Images** (상용): 요금 있음, R2와 통합 간편
- **AWS Lambda + Sharp**: S3와 조합 시 일반적, 운영 커스텀 가능

### 8.3 권장: **Cloudflare R2 + imgproxy(자체 호스팅)**

- 이유
  1. R2 egress 무료 → 썸네일/CDN 비용 절감 (SNS 편집기는 트래픽 비용이 핵심)
  2. S3 호환 API로 boto3 그대로 사용
  3. imgproxy를 ARM VPS(oci-arm 등)에 컨테이너로 띄워 온디맨드 썸네일
  4. 필요시 Cloudflare CDN 앞단 배치로 전세계 가속
- 폴백: R2 장애 대비 AWS S3 서울 리전을 DR 대상으로 계약

### 8.4 업로드 플로우

1. 클라이언트 → Next Server Action: `POST /api/upload-init` (크기, 타입)
2. Server Action → FastAPI `POST /api/v1/uploads` → R2 presigned multipart URL 리스트 반환
3. 클라이언트 → R2에 직접 PUT (진행률 추적)
4. 클라이언트 → FastAPI `POST /api/v1/uploads/:id/complete` (ETag 배열)
5. FastAPI → R2 CompleteMultipartUpload → DB에 Asset 레코드 저장 + 썸네일 생성 태스크 enqueue

---

## 9. 데이터베이스

### 9.1 PostgreSQL 16

- 메타데이터(사용자, 프로젝트, 에셋, 작업, 필터 프리셋, 결제)
- JSONB로 에디터 상태 스냅샷 저장 (Konva stage 직렬화)
- `pgvector` 확장은 필터 추천/스타일 임베딩에 옵션

### 9.2 Redis 7

- 세션 캐시 (JWT 블랙리스트/리프레시)
- Celery broker/result backend
- 레이트 리밋 (slowapi/redis)
- 작업 진행률 채널 (pub/sub → SSE)

### 9.3 이벤트 로그 저장

- **Phase 1**: Postgres 단일 테이블 + 파티셔닝
- **Phase 2**: 트래픽 증가 시 ClickHouse 또는 TimescaleDB 도입
  - ClickHouse: 분석 쿼리 성능 최상, 운영 복잡도 중
  - Timescale: Postgres 확장이라 운영 단순
- **권장 경로**: 초반에는 Postgres 파티션, MAU 증가 후 TimescaleDB로 확장

### 9.4 마이그레이션

- Alembic (SQLAlchemy 공식)
- `alembic.ini`의 타임존/UTC 설정, 다중 환경 env 지원
- 마이그레이션 파일은 `migrations/versions/` 리뷰 필수

### 9.5 DB 주의사항

- async SQLAlchemy의 connection pool 크기(기본 5) 튜닝
- Celery 워커는 별도 session factory 사용 (이벤트 루프 분리)
- `SELECT ... FOR UPDATE`는 GPU 워커 job claim에만 제한적으로 사용

---

## 10. 모노레포 툴

### 10.1 pnpm workspaces

- `pnpm-workspace.yaml`로 `apps/*`, `packages/*` 지정
- Linker: `node-modules` (권장, Next.js 호환 최상)
- `packageManager` 필드 고정 (corepack)

### 10.2 Turborepo vs Nx

| 항목 | Turborepo | Nx |
|------|-----------|----|
| 러닝 커브 | 낮음 | 중~높음 |
| 태스크 캐시 | 로컬+원격 | 로컬+원격 |
| 플러그인 에코시스템 | 제한적 | 매우 풍부 |
| 제너레이터/스캐폴딩 | 약함 | 강함 |
| 권장 팀 규모 | 소~중 | 중~대 |

- **권장: Turborepo**
  - 이유: 팀 규모/학습 비용/Vercel 통합 친화성
  - `turbo.json` 파이프라인으로 build/test/lint 의존 그래프 관리
  - 원격 캐시는 Vercel Remote Cache 또는 자체 S3

### 10.3 Biome

- 이미 사용 중 (`biome.json`)
- ESLint/Prettier 대체. pnpm 스크립트 `biome check --write` 통합
- Next.js 특화 규칙이 필요한 경우만 ESLint 공존 허용 (`eslint-plugin-next`)

### 10.4 Changesets

- 패키지 버저닝/릴리스 노트 자동화
- `packages/*`의 공용 라이브러리(예: `@photo-magic/ui`, `@photo-magic/config`)가 생길 때 필수
- GitHub Actions + `changesets/action`으로 PR 기반 배포

### 10.5 권장 구조

```
photo-magic/
├ apps/
│  ├ web/                    (Next.js 15)
│  └ api/                    (FastAPI — pnpm 외부, 그러나 루트 orchestration은 Turbo task로 래핑)
├ packages/
│  ├ ui/                     (디자인 시스템 컴포넌트)
│  ├ config-tsconfig/
│  ├ config-biome/
│  └ editor-core/            (Konva/WebGL 추상화)
├ infra/
│  ├ docker/
│  └ compose.yml
├ turbo.json
├ pnpm-workspace.yaml
├ biome.json
└ package.json
```

---

## 최종 권장 스택 정리

### 프론트엔드
- **Next.js 15.x** (App Router, React 19, PPR 실험 활성)
- **TypeScript 5.4+** (strict)
- **Konva.js + React-Konva** (에디터 캔버스)
- **Filerobot Image Editor** (보조 편집 모달)
- **MediaPipe Face Landmarker** (얼굴 랜드마크)
- **자체 WebGL2 셰이더** (뷰티 필터)
- **Zustand + Immer** (에디터 상태 스토어)
- **next-intl** (i18n, Accept-Language 기반 서버 라우팅)
- **Tailwind CSS 3.x** or **CSS Variables 디자인 토큰** (프로젝트 미결정, `frontend-design.md` 원칙 적용)
- **TanStack Query** (작업 상태 폴링)
- **Biome** (lint/format)

### 백엔드
- **Python 3.12**
- **FastAPI 0.11x** (async)
- **Pydantic v2**
- **SQLAlchemy 2.x (async)** + **asyncpg**
- **Alembic**
- **pydantic-settings**
- **Celery 5.x** + **Redis 7**
- **boto3** (R2 S3 호환)
- **Pillow + pyvips** (썸네일/회전/메타)

### AI 파이프라인
- **GFPGAN v1.4** (얼굴 복원 기본)
- **Real-ESRGAN** (업스케일)
- **rembg (isnet-general-use / birefnet)** (배경 제거 기본)
- **InSPyReNet** (프리미엄 매팅)
- **PyTorch 2.x** (CUDA 12.1)
- **onnxruntime-gpu** (모델 최적화 옵션)

### 인프라
- **Cloudflare R2** (오브젝트 스토리지)
- **imgproxy** (썸네일 변환, 자체 호스팅)
- **PostgreSQL 16**
- **Redis 7**
- **Caddy 컨테이너** (리버스 프록시, 사용자 `deploy-oci-arm.md` 관행 적용)
- **Docker Compose** (단일 호스트), Phase 2에서 Kubernetes/Nomad 검토

### 모노레포
- **pnpm 9.x**
- **Turborepo 2.x**
- **Biome**
- **Changesets**

---

## 위험 요소 및 완화 전략

### 11.1 GPUPixel WASM 빌드 가능성

- **리스크**: 네이티브 OpenGL ES 코드의 WebGL2 포팅 비용, WASM 빌드 시 OpenCV 의존성 크기
- **완화**: 초기 런칭에서 제외. MediaPipe + 자체 셰이더로 동등 기능 구현. GPUPixel은 Phase 2 R&D 트랙.

### 11.2 CodeFormer 라이선스

- **리스크**: 상업 불가. 개발자가 실수로 프로덕션에 포함하면 법적 이슈.
- **완화**: CI에서 pip 패키지 이름(`codeformer`) 금지 목록 린트 추가. 가중치 파일은 레포에 포함 금지(README에 명시).

### 11.3 모바일 사파리 WebGL2 호환

- **리스크**: iOS 16 이하 또는 일부 iOS 17에서 WebGL2 부분 지원 이슈, MediaPipe GPU delegate 실패
- **완화**: 기기 검출 → CPU 경로 폴백. 내부 해상도 다운샘플. `OffscreenCanvas` 미지원 시 메인 스레드 경로 준비.

### 11.4 대용량 이미지 메모리

- **리스크**: 브라우저에서 60MP 이상 이미지 처리 시 OOM
- **완화**: 클라이언트는 편집 해상도 2048×2048로 클램프. 원본은 서버 보관. 최종 내보내기 시 서버에서 원본 기반 재처리.

### 11.5 GPU 인프라 비용

- **리스크**: 초기 MAU 불확실, GPU 인스턴스 고정비용 부담
- **완화**: RunPod/Lambda Labs/Modal 등 서버리스 GPU (분 단위 과금)로 시작 → 이용량 증가 후 자체 GPU 서버로 전환. Celery 워커를 Modal Functions로 대체하는 추상화 유지.

### 11.6 Filerobot 폰트/한국어

- **리스크**: 한국어 UI 리소스가 번들에 미포함
- **완화**: 번역 JSON을 프로젝트에서 관리하고 `theme.translations` 주입. next-intl과 키 네이밍 일원화.

### 11.7 Next.js 15 + React 19 호환 이슈

- **리스크**: 일부 서드파티 라이브러리(Konva 래퍼 등)가 React 19 types와 충돌
- **완화**: `pnpm overrides`로 버전 핀. 업그레이드는 메이저마다 regression 테스트 트랙 운영.

### 11.8 Celery + asyncio 혼용

- **리스크**: Celery 태스크 내부에서 async DB 세션 호출하면 이벤트 루프 충돌
- **완화**: Celery 태스크는 **동기** 스타일로 작성. DB는 별도 sync session (psycopg 2/3) 또는 `asyncio.run`로 래핑한 서비스 계층.

### 11.9 R2 → imgproxy 서명 검증

- **리스크**: imgproxy URL 노출로 무제한 변환 남용
- **완화**: HMAC 서명 키 분리 + TTL 포함된 쿼리. CDN에서 레이트 리밋.

### 11.10 3개월 일정 리스크

- **리스크**: AI 파이프라인 4종 모두 초기 런칭에 포함 시 품질·성능 QA 시간 부족
- **완화**: 런칭 MVP는 **뷰티 필터(클라) + 업스케일(Real-ESRGAN) + 배경 제거(rembg)** 3종. 얼굴 복원(GFPGAN)은 Beta flag로 내부 릴리스 후 공개.

---

## 의존성 버전 핀 초안

### `apps/web/package.json`

```jsonc
{
  "name": "@photo-magic/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "dependencies": {
    "next": "15.2.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "konva": "9.3.0",
    "react-konva": "18.2.10",
    "react-filerobot-image-editor": "4.9.1",
    "@mediapipe/tasks-vision": "0.10.20",
    "zustand": "4.5.2",
    "immer": "10.1.1",
    "@tanstack/react-query": "5.40.0",
    "next-intl": "3.15.0",
    "tailwindcss": "3.4.4",
    "clsx": "2.1.1",
    "zod": "3.23.8",
    "dayjs": "1.11.11"
  },
  "devDependencies": {
    "typescript": "5.4.5",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "@biomejs/biome": "1.8.0",
    "vitest": "1.6.0",
    "@testing-library/react": "16.0.0",
    "@testing-library/jest-dom": "6.4.6",
    "playwright": "1.44.0"
  }
}
```

### `apps/api/pyproject.toml` 초안

```toml
[project]
name = "photo-magic-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.111.0,<0.120.0",
  "uvicorn[standard]>=0.30.0,<0.40.0",
  "pydantic>=2.7,<3.0",
  "pydantic-settings>=2.2,<3.0",
  "sqlalchemy[asyncio]>=2.0.30,<2.1",
  "asyncpg>=0.29,<0.30",
  "alembic>=1.13,<2.0",
  "celery[redis]>=5.3,<6.0",
  "redis>=5.0,<6.0",
  "boto3>=1.34,<2.0",
  "pillow>=10.3,<11.0",
  "pyvips>=2.2,<3.0",
  "httpx>=0.27,<0.28",
  "structlog>=24.1,<25.0",
  "python-multipart>=0.0.9",
  "python-jose[cryptography]>=3.3,<4.0",
  "passlib[argon2]>=1.7,<2.0"
]

[project.optional-dependencies]
ai = [
  "torch>=2.3,<3.0",
  "torchvision>=0.18,<0.19",
  "numpy>=1.26,<2.0",
  "opencv-python-headless>=4.9,<5.0",
  "basicsr>=1.4.2,<1.5",
  "facexlib>=0.3,<0.4",
  "gfpgan>=1.3.8,<1.4",
  "realesrgan>=0.3.0,<0.4",
  "rembg[gpu]>=2.0.57,<3.0",
  "onnxruntime-gpu>=1.17,<2.0"
]
dev = [
  "pytest>=8.2,<9.0",
  "pytest-asyncio>=0.23,<0.24",
  "ruff>=0.4,<0.5",
  "mypy>=1.10,<2.0",
  "types-redis",
  "types-boto3"
]
```

### 루트 `package.json`

```jsonc
{
  "name": "photo-magic",
  "private": true,
  "packageManager": "pnpm@9.4.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "2.0.3",
    "@biomejs/biome": "1.8.0",
    "@changesets/cli": "2.27.0"
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `turbo.json`

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 추가 아키텍처 다이어그램 (텍스트)

```
[Browser]
  ├ Konva canvas (React-Konva)
  ├ MediaPipe Face Landmarker (WASM + GPU delegate)
  └ WebGL2 Shader Pipeline
      │
      │ (편집 결과 blob)
      ▼
[Next.js 15 — apps/web]
  ├ RSC: 페이지/메타/SEO
  ├ Client: 에디터 모듈
  ├ Server Action: presigned URL 요청, job 생성
  └ (선택) Route Handler: SSE bridge to FastAPI
      │
      ▼
[FastAPI — apps/api]
  ├ /api/v1/uploads (R2 multipart presign)
  ├ /api/v1/jobs    (작업 등록/조회)
  ├ /api/v1/assets  (메타 조회)
  └ Celery enqueue → queue=gpu|cpu
      │
      ├─▶ [Celery GPU Worker]
      │       GFPGAN · Real-ESRGAN · InSPyReNet
      └─▶ [Celery CPU Worker]
              rembg(u2net) · Pillow · imgproxy 호출

[Storage]
  Cloudflare R2 (원본 + 결과)
  imgproxy (on-demand 썸네일)
  Redis 7 (broker/result/pubsub)
  PostgreSQL 16 (메타/작업 DB)
```

---

## 테스트 전략 요약

- **프론트**
  - Vitest + React Testing Library (유닛·컴포넌트)
  - Playwright (E2E: 업로드 → 편집 → 저장)
  - Storybook (선택) — 에디터 UI 컴포넌트 시각 회귀
- **백엔드**
  - pytest + pytest-asyncio + httpx.AsyncClient
  - 트랜잭션 롤백 fixture로 DB 테스트 격리
  - Celery 태스크는 `CELERY_TASK_ALWAYS_EAGER=True`로 동기 실행 테스트
- **AI 파이프라인 QA**
  - 골든 이미지 세트 20~30장, PSNR/SSIM 임계값 체크
  - 성능 예산: 512×512 얼굴 복원 ≤ 500ms (T4), 1024×1024 업스케일 ≤ 2s

---

## 컴플라이언스/라이선스 종합표

| 항목 | 라이선스 | 상업 SaaS 가능 | 비고 |
|------|----------|-----------------|------|
| Next.js 15 | MIT | 가능 | — |
| React 19 | MIT | 가능 | — |
| Konva.js | MIT | 가능 | — |
| React-Konva | MIT | 가능 | — |
| Filerobot | MIT | 가능 | — |
| MediaPipe Tasks | Apache-2.0 | 가능 | — |
| TOAST UI Image Editor | MIT | 가능 | 유지보수 리스크 |
| Pintura | Commercial | 라이선스 구매 시 | — |
| Ente 포토 에디터 | AGPL-3.0 | **SaaS 소스공개 부담** | 비권장 |
| GFPGAN | Apache-2.0 | 가능 | — |
| CodeFormer | S-Lab 1.0 | **불가** | — |
| RestoreFormer++ | MIT | 가능 | — |
| GPEN | Apache-2.0 | 가능 | — |
| Real-ESRGAN | BSD-3-Clause | 가능 | 가중치별 확인 |
| SwinIR | Apache-2.0 | 가능 | — |
| EDSR | MIT | 가능 | — |
| rembg | MIT | 가능 | 가중치별 확인 (U2Net은 Apache-2.0) |
| MODNet | CC BY-NC-SA | **불가** | — |
| BackgroundMattingV2 | MIT | 가능 | — |
| InSPyReNet | MIT | 가능 | — |
| FastAPI | MIT | 가능 | — |
| SQLAlchemy | MIT | 가능 | — |
| Celery | BSD-3-Clause | 가능 | — |
| PostgreSQL | PostgreSQL License (MIT-like) | 가능 | — |
| Redis | BSD-3 (≤7.2) / RSALv2·SSPLv1 (7.4+) | 가능(셀프호스팅) | 클라우드 재판매 시 Redis Stack 아닌 대안 고려 |
| imgproxy | MIT + Pro 옵션 | 가능 | Pro 기능 사용 시 별도 |
| Cloudflare R2 | 서비스 약관 | 가능 | — |
| Turborepo | MIT | 가능 | — |
| Biome | MIT/Apache-2.0 | 가능 | — |

> Redis 라이선스 변경(2024)은 "클라우드에서 Redis 자체를 재판매"할 때 제약. 본 프로젝트처럼 **내부 캐시/큐 용도**로 쓰면 기존과 동일하게 사용 가능.

---

## Phase별 로드맵 제안 (3개월)

### Month 1: 기반
- 모노레포 세팅 (pnpm + Turborepo + Biome + Changesets)
- Next.js 15 App Router 뼈대, 인증, i18n, 디자인 토큰
- FastAPI + PostgreSQL + Redis + Celery 셋업
- R2 버킷·presigned 업로드 파이프라인
- Konva 기본 에디터 (크롭, 회전, 텍스트, 저장/내보내기)
- 배포 파이프라인 (oci-arm Caddy + Docker)

### Month 2: AI & 뷰티
- MediaPipe Face Landmarker 통합
- WebGL2 셰이더 뷰티 필터 3종 (스무딩, 밝기, 립 틴트)
- Celery GPU 워커 환경 (Modal/RunPod 서버리스 검증)
- Real-ESRGAN 업스케일 태스크
- rembg 배경 제거 태스크
- 작업 큐/상태/결과 UI

### Month 3: 고도화 & 런칭 준비
- GFPGAN 얼굴 복원 Beta
- InSPyReNet 프리미엄 매팅
- 결제/플랜 분기 (무료/유료 해상도·모델 제한)
- 성능 QA, Lighthouse/Mobile WebGL 검증
- 법무·개인정보 문구, 서비스 약관
- 프로덕션 배포, 모니터링(Sentry, Grafana/Loki)

---

## 출처 및 참고

- TOAST UI Image Editor: https://github.com/nhn/tui.image-editor
- Filerobot Image Editor: https://github.com/scaleflex/filerobot-image-editor
- Pintura: https://pqina.nl/pintura/
- Ente: https://github.com/ente-io/ente
- Konva.js: https://konvajs.org/ , https://github.com/konvajs/konva
- React-Konva: https://github.com/konvajs/react-konva
- Fabric.js: https://github.com/fabricjs/fabric.js
- GPUPixel: https://github.com/pixpark/gpupixel
- JeelizFaceFilter: https://github.com/jeeliz/jeelizFaceFilter
- MediaPipe Tasks (Face Landmarker): https://developers.google.com/mediapipe/solutions/vision/face_landmarker
- face-api.js: https://github.com/justadudewhohacks/face-api.js
- GFPGAN: https://github.com/TencentARC/GFPGAN
- CodeFormer: https://github.com/sczhou/CodeFormer (S-Lab License 1.0)
- RestoreFormer++: https://github.com/wzhouxiff/RestoreFormer
- GPEN: https://github.com/yangxy/GPEN
- Real-ESRGAN: https://github.com/xinntao/Real-ESRGAN
- SwinIR: https://github.com/JingyunLiang/SwinIR
- EDSR: https://github.com/sanghyun-son/EDSR-PyTorch
- rembg: https://github.com/danielgatis/rembg
- MODNet: https://github.com/ZHKKKe/MODNet (CC BY-NC-SA)
- BackgroundMattingV2: https://github.com/PeterL1n/BackgroundMattingV2
- InSPyReNet: https://github.com/plemeri/InSPyReNet
- Next.js: https://nextjs.org/docs
- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy async: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- Celery: https://docs.celeryq.dev/
- BentoML: https://docs.bentoml.org/
- Ray Serve: https://docs.ray.io/en/latest/serve/
- Temporal: https://docs.temporal.io/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- imgproxy: https://imgproxy.net/ , https://github.com/imgproxy/imgproxy
- Turborepo: https://turbo.build/repo/docs
- Biome: https://biomejs.dev/
- Changesets: https://github.com/changesets/changesets
- next-intl: https://next-intl-docs.vercel.app/
- TanStack Query: https://tanstack.com/query/latest
- Redis 라이선스: https://redis.io/legal/licenses/
- PostgreSQL License: https://www.postgresql.org/about/licence/

> 본 문서의 별/릴리스 수치는 2026-04 기준으로 작성되었으며, 실제 착수 전 각 레포에서 최신 수치·보안 이슈를 재검증해야 한다.

---

## 부록 A: 섹션별 실전 구현 샘플 및 심층 노트

### A.1 Konva 에디터 + Next.js App Router 통합 패턴

#### A.1.1 클라이언트 경계 설계

```tsx
// apps/web/app/(editor)/editor/[projectId]/page.tsx
// 서버 컴포넌트 — 초기 메타만 prefetch
import { getProjectMeta } from "@/server/projects";
import { EditorShell } from "@/components/editor/EditorShell";

export default async function EditorPage({
  params,
}: {
  params: { projectId: string };
}) {
  const meta = await getProjectMeta(params.projectId);
  return <EditorShell initialMeta={meta} />;
}
```

```tsx
// apps/web/components/editor/EditorShell.tsx
"use client";

import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editor";
import type { ProjectMeta } from "@/types/project";

// Konva는 브라우저 전용 — SSR 비활성
const EditorCanvas = dynamic(() => import("./EditorCanvas"), {
  ssr: false,
  loading: () => <CanvasSkeleton />,
});

interface Props {
  initialMeta: ProjectMeta;
}

export function EditorShell({ initialMeta }: Props) {
  const hydrate = useEditorStore((s) => s.hydrate);
  useEffect(() => {
    hydrate(initialMeta);
  }, [hydrate, initialMeta]);

  return (
    <div className="grid h-screen grid-cols-[auto_1fr_auto]">
      <LeftTools />
      <EditorCanvas />
      <RightPanels />
    </div>
  );
}
```

- 포인트
  - Konva를 `dynamic({ ssr: false })`로 로드해 번들이 서버에 섞이는 것을 방지
  - RSC에서 직접 fetch한 메타를 props로 내려 `useEffect`로 스토어 hydrate
  - 우측 패널(필터·레이어·히스토리)은 각각 lazy import 가능

#### A.1.2 히스토리/언두 전략

- zustand + immer + 스택 상한(예: 50) 유지
- 바이너리 이미지는 스택에 저장하지 말고, 명령(Command) 객체 배열만 유지 → replay 기반 복원
- 저장은 IndexedDB에 JSON + PNG 썸네일. 마지막 상태는 R2에 업로드

```ts
type EditorCommand =
  | { kind: "crop"; rect: { x: number; y: number; w: number; h: number } }
  | { kind: "rotate"; degrees: 90 | 180 | 270 }
  | { kind: "filter"; filter: FilterPresetId; strength: number }
  | { kind: "text"; node: TextNodeSerialized };
```

#### A.1.3 Konva 성능 팁

- `listening={false}`를 정적 레이어에 부여 → 이벤트 비용 절감
- `cache()` 적극 사용: 변하지 않는 이미지 노드에 호출해 GPU 캐시
- 큰 이미지는 `Konva.Image` + 프레임버퍼로 다운샘플링된 캔버스 사용 (내부 작업 해상도 2048²)
- `FastLayer`는 2D 필터에 제약이 있으므로 일반 Layer 권장

### A.2 MediaPipe Face Landmarker 통합 세부

#### A.2.1 초기화

```ts
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

let landmarker: FaceLandmarker | null = null;

export async function initFaceLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm",
  );
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    numFaces: 1,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    runningMode: "IMAGE",
  });
  return landmarker;
}
```

- 프로덕션: 모델 파일을 자체 CDN(R2+CF)에 호스팅하여 SLA/네트워크 제어
- WASM 파일도 동일 경로에 복제 (CORS 주의)

#### A.2.2 폴백 전략

1. GPU delegate 실패 감지 → `delegate: "CPU"`로 재시도
2. iOS 15 이하 + 안드로이드 low-end → MediaPipe 자체 미지원 경고 + 정적 이미지 경로 안내
3. 네트워크 오류 시 "뷰티 필터만 비활성화" UX (다른 편집은 지속)

#### A.2.3 Web Worker 분리

- `OffscreenCanvas`를 지원하는 환경에서 MediaPipe + WebGL 셰이더를 Worker로 이동
- 메인 스레드는 DOM/이벤트만 처리
- 지원 판별: `'OffscreenCanvas' in self && typeof new OffscreenCanvas(1, 1).getContext === 'function'`

### A.3 뷰티 셰이더 디자인 메모

- 스킨 스무딩은 다음 중 택1:
  1. Bilateral blur (GPU 비용 높음) — 작은 커널로 two-pass
  2. Frequency separation: 저주파/고주파 분리 후 저주파만 Gaussian blur → 합성
  3. Stylized "Mean + Variance" 필터 (LCC / L0 smoothing)
- 얼굴 영역 마스크: MediaPipe 랜드마크로 외곽 폴리곤 생성 → 셰이더 uniform으로 마스크 텍스처 전달
- 자연스러움 보존 팁:
  - 눈썹·눈동자·입술 영역은 블러 제외 마스크
  - 피부 색상 범위 가중치(YCbCr 기반) 적용
- 슬라이더 UX: 0~100, 내부 0~1로 정규화. 미세 조정이 필요한 영역은 log-scale

### A.4 백엔드 Celery 작업 오케스트레이션

#### A.4.1 작업 상태 머신

```
PENDING → RUNNING → (SUCCESS | FAILURE | CANCELLED)
                  ↘ RETRY ↗
```

- DB 스키마 (간단화)

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,  -- 'upscale' | 'restore' | 'matting' | 'beauty'
  status TEXT NOT NULL,
  input_asset_id UUID NOT NULL REFERENCES assets(id),
  output_asset_id UUID REFERENCES assets(id),
  params JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_jobs_user_created ON jobs(user_id, created_at DESC);
CREATE INDEX idx_jobs_status ON jobs(status) WHERE status IN ('PENDING', 'RUNNING');
```

#### A.4.2 Celery 태스크 템플릿

```python
# apps/api/app/workers/tasks/upscale.py
from celery import shared_task
from app.workers.celery_app import celery_app
from app.services.ai.realesrgan import RealESRGANService
from app.services.jobs import JobService
from app.services.storage import StorageService

_service: RealESRGANService | None = None


def get_service() -> RealESRGANService:
    global _service
    if _service is None:
        _service = RealESRGANService.load()
    return _service


@shared_task(
    name="jobs.upscale",
    bind=True,
    autoretry_for=(TimeoutError, ConnectionError),
    retry_backoff=True,
    max_retries=3,
    queue="gpu",
)
def upscale_task(self, job_id: str) -> None:
    jobs = JobService.sync()
    storage = StorageService()
    job = jobs.mark_running(job_id)
    try:
        src = storage.download(job.input_asset_key)
        svc = get_service()
        out = svc.infer(src, scale=job.params["scale"])
        out_key = storage.upload_result(job_id, out)
        jobs.mark_success(job_id, output_key=out_key)
    except Exception as exc:
        jobs.mark_failure(job_id, error=str(exc))
        raise
```

- 포인트
  - `get_service()`는 프로세스당 1회 모델 로드 → Celery `--concurrency=1`이 GPU 워커 기본
  - DB는 **동기** 세션 (Celery에서 async 루프 충돌 회피)
  - 결과 이미지는 R2에 업로드, DB는 키만 저장

#### A.4.3 Celery 설정

```python
# apps/api/app/workers/celery_app.py
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "photo_magic",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.workers.tasks.upscale",
        "app.workers.tasks.restore",
        "app.workers.tasks.matting",
    ],
)

celery_app.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,
    task_time_limit=300,
    task_soft_time_limit=270,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "jobs.upscale": {"queue": "gpu"},
        "jobs.restore": {"queue": "gpu"},
        "jobs.matting": {"queue": "cpu"},
    },
)
```

### A.5 AI 서비스 래퍼 레퍼런스

#### A.5.1 GFPGAN

```python
# apps/api/app/services/ai/gfpgan.py
from pathlib import Path
from gfpgan import GFPGANer

_MODEL_URL = "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth"


class GFPGANService:
    def __init__(self, model_path: Path):
        self.restorer = GFPGANer(
            model_path=str(model_path),
            upscale=1,
            arch="clean",
            channel_multiplier=2,
            bg_upsampler=None,
        )

    @classmethod
    def load(cls) -> "GFPGANService":
        cache_dir = Path("/var/cache/photo-magic/models")
        cache_dir.mkdir(parents=True, exist_ok=True)
        model_path = cache_dir / "GFPGANv1.4.pth"
        if not model_path.exists():
            _download(model_path, _MODEL_URL)
        return cls(model_path)

    def infer(self, image_bgr, strength: float = 1.0):
        _, _, restored = self.restorer.enhance(
            image_bgr,
            has_aligned=False,
            only_center_face=False,
            paste_back=True,
            weight=strength,
        )
        return restored
```

#### A.5.2 Real-ESRGAN

```python
from realesrgan import RealESRGANer
from basicsr.archs.rrdbnet_arch import RRDBNet


class RealESRGANService:
    def __init__(self, model_path: Path):
        model = RRDBNet(
            num_in_ch=3,
            num_out_ch=3,
            num_feat=64,
            num_block=23,
            num_grow_ch=32,
            scale=4,
        )
        self.upsampler = RealESRGANer(
            scale=4,
            model_path=str(model_path),
            model=model,
            tile=512,
            tile_pad=10,
            pre_pad=0,
            half=True,
            device="cuda",
        )

    def infer(self, image_bgr, scale: int = 4):
        output, _ = self.upsampler.enhance(image_bgr, outscale=scale)
        return output
```

- 주의
  - `half=True`는 GPU FP16 지원 필요 (T4 이상)
  - 큰 이미지는 `tile=512` 자동 분할 처리
  - OOM 발생 시 tile 256으로 하향

#### A.5.3 rembg

```python
from rembg import new_session, remove


class MattingService:
    def __init__(self, model_name: str = "isnet-general-use"):
        self.session = new_session(model_name=model_name)

    def infer(self, image_bytes: bytes) -> bytes:
        return remove(image_bytes, session=self.session)
```

- `birefnet-general`을 사용하려면 `onnxruntime-gpu`와 호환 버전 확인
- 배경색 채움이 필요한 경우 `only_mask=True` 후 PIL로 합성

### A.6 R2 업로드 시퀀스 다이어그램

```
Client                Next.js             FastAPI                 R2
  │  1.파일 선택       │                    │                      │
  ├──────────────────▶│                    │                      │
  │                   │ 2.Server Action    │                      │
  │                   ├───────────────────▶│                      │
  │                   │                    │ 3.CreateMultipart    │
  │                   │                    ├─────────────────────▶│
  │                   │                    │                      │
  │                   │                    │◀─────────────────────┤
  │                   │                    │ 4.Part URLs          │
  │                   │◀───────────────────┤                      │
  │                   │ 5.Part URLs 반환   │                      │
  │◀──────────────────┤                    │                      │
  │ 6.PUT part1..N    │                    │                      │
  ├───────────────────┼────────────────────┼─────────────────────▶│
  │                   │                    │                      │
  │ 7.Complete 요청   │                    │                      │
  ├──────────────────▶│                    │                      │
  │                   │                    │ 8.CompleteMultipart  │
  │                   │                    ├─────────────────────▶│
  │                   │                    │◀─────────────────────┤
  │                   │                    │ 9.Asset 저장 + 썸네일│
  │                   │                    │   태스크 enqueue     │
  │◀──────────────────┴────────────────────┤                      │
```

### A.7 imgproxy 배포 레시피 (oci-arm)

```yaml
# /home/ubuntu/apps/imgproxy/docker-compose.yml
services:
  imgproxy:
    image: darthsim/imgproxy:v3
    container_name: imgproxy
    restart: unless-stopped
    environment:
      IMGPROXY_KEY: "${IMGPROXY_KEY}"
      IMGPROXY_SALT: "${IMGPROXY_SALT}"
      IMGPROXY_USE_S3: "true"
      IMGPROXY_S3_REGION: "auto"
      IMGPROXY_S3_ENDPOINT: "https://<account>.r2.cloudflarestorage.com"
      AWS_ACCESS_KEY_ID: "${R2_ACCESS_KEY}"
      AWS_SECRET_ACCESS_KEY: "${R2_SECRET_KEY}"
      IMGPROXY_MAX_SRC_RESOLUTION: "80"
      IMGPROXY_JPEG_PROGRESSIVE: "true"
      IMGPROXY_TTL: "31536000"
    networks:
      - infra_default
    labels:
      - "com.brian-dev.service=imgproxy"

networks:
  infra_default:
    external: true
```

- Caddy 블록
```
img.brian-dev.cloud {
    reverse_proxy imgproxy:8080
    header {
        Cache-Control "public, max-age=31536000, immutable"
    }
}
```

### A.8 Next.js `next.config.mjs` 예시

```js
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    ppr: "incremental",
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.brian-dev.cloud" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'wasm-unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob: https://img.brian-dev.cloud https://*.r2.dev; " +
              "worker-src 'self' blob:; " +
              "connect-src 'self' https://api.brian-dev.cloud https://storage.googleapis.com;",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(config);
```

### A.9 i18n 적용 메모

- `messages/ko.json`, `messages/en.json` 두 언어로 시작
- 에디터 툴 라벨, 필터 이름(예: "자연스러움", "뽀샤시"), 에러 토스트 모두 키로 관리
- 백엔드 에러 응답은 `code`만 보내고, 번역은 프론트가 담당
  - 예: `{ "detail": "JOB_GPU_OOM", "code": "job.gpu_oom" }`
- 숫자/날짜는 `Intl.NumberFormat`, `Intl.DateTimeFormat` 사용
- 브라우저 초기 언어 결정: `Accept-Language` → 쿠키 → 기본(ko)

### A.10 성능 예산

| 지표 | 목표 | 측정 도구 |
|------|------|-----------|
| LCP (에디터 페이지) | < 2.5s (4G 모바일) | Lighthouse, Chrome UX |
| TBT | < 200ms | Lighthouse |
| FID/INP | < 200ms | Web Vitals |
| 뷰티 필터 프리뷰 FPS | ≥ 30 (중급 Android) | `requestAnimationFrame` 카운터 |
| 업스케일 (1024→4096, T4) | ≤ 3s | 서버 메트릭 (prom histogram) |
| 얼굴 복원 (512, T4) | ≤ 500ms | 서버 메트릭 |
| 배경 제거 (1024, rembg) | ≤ 1s | 서버 메트릭 |
| 총 작업 TTC (일반 업스케일) | ≤ 10s | 프론트→완료 E2E |

### A.11 모니터링/관측성

- **프론트**: Vercel Analytics 또는 Plausible, Sentry(에러)
- **백엔드**: Sentry + OpenTelemetry (OTLP → Grafana Tempo), Prometheus + Grafana
- **Celery**: `celery-exporter` → Prometheus
- **로그**: structlog → stdout → Loki
- **알람**: Grafana → Slack (P95 지연/에러율 임계 초과)

### A.12 보안 체크리스트

- [ ] R2 presigned URL TTL ≤ 15분
- [ ] 업로드 MIME/매직바이트 검증 (Pillow open → verify)
- [ ] EXIF GPS 제거 (기본 활성, 사용자 옵트인 시만 보존)
- [ ] 업로드 바이트 상한 강제 (Nginx/Caddy + FastAPI)
- [ ] Argon2 비밀번호 해시
- [ ] Rate limit: 인증 5 req/min, 업로드 20 req/hour
- [ ] CSP + HSTS + X-Frame-Options
- [ ] Sentry 소스맵 업로드 시 `sentry-cli`로 sanitize
- [ ] 얼굴 이미지는 "개인정보" 취급 → 삭제 요청 시 R2 오브젝트 + DB 소프트삭제 + 30일 후 완전 삭제

### A.13 비용 추정 (월 기준, 초기 MAU 5k 가정)

| 항목 | 수량 | 단가/월 | 월 비용 |
|------|------|---------|---------|
| Cloudflare R2 (저장) | 500GB | $0.015/GB | $7.5 |
| Cloudflare R2 (Class A ops) | 1M | $4.5/M | $4.5 |
| Cloudflare R2 egress | 0 | 무료 | $0 |
| oci-arm VPS (Always Free) | 1 | 0 | $0 |
| Postgres (Neon / Supabase free) | 0.5GB | 0 | $0 |
| Redis (Upstash Free) | 10k req/일 | 0 | $0 |
| GPU (Modal 서버리스) | 5000분 | $0.00059/sec | ~$177 |
| imgproxy 호스트 | 공용 VPS | 0 | $0 |
| Sentry/Observability | Free tier | 0 | $0 |
| **합계 (예상)** | — | — | **~$190** |

- GPU 비용이 지배적 → 초기에는 서버리스, MAU 2만 이상부터 전용 GPU(T4 저가형) 시간제 리저브

### A.14 확장 포인트 (Phase 2 이후)

- **WebGPU**: 브라우저에서 WebGPU가 충분히 보급되면 셰이더 스택 이주 (Safari 17.4+ 기본 활성 흐름)
- **Stable Diffusion 인페인팅**: 서버 GPU 풀 공유 가능 시 "얼굴 리터치 인페인트" 프리미엄 도입
- **오디오/비디오**: 짧은 영상 뷰티 필터 (MediaPipe + WebCodecs + ffmpeg.wasm)
- **iOS/Android 네이티브 앱**: 기존 파이프라인 재사용, RN/Expo + MediaPipe 모바일 SDK
- **ControlNet 기반 스타일 변환**: 유료 티어에서만

---

## 부록 B: 의사결정 로그 (ADR 요약)

### ADR-001 Konva vs Fabric vs TUI
- 결정: **Konva + React-Konva** 채택
- 근거: 모바일 터치 성능, React-Konva 선언형 통합, 번들, 활성도
- 대안: Fabric v6(TS) 또는 TUI — 각각 커스텀 비용·유지보수 리스크로 제외
- 재평가 시점: MAU 50k 또는 에디터 기능 15종 돌파 시

### ADR-002 MediaPipe vs face-api.js
- 결정: **MediaPipe Tasks Face Landmarker**
- 근거: 478 랜드마크, GPU delegate, 최신 유지보수, Apache-2.0
- 대안: face-api.js — 모바일 FPS 부족으로 제외

### ADR-003 얼굴 복원 모델 선정
- 결정: **GFPGAN v1.4 기본**, RestoreFormer++ 또는 GPEN은 벤치 후 병행
- 근거: 라이선스(Apache-2.0), 품질/속도 균형, 파이썬 생태계 성숙
- 대안: CodeFormer — 상용 불가

### ADR-004 배경 제거 엔진
- 결정: **rembg(기본) + InSPyReNet(프리미엄)**
- 근거: 단계별 품질-비용 트레이드오프
- 대안: MODNet — CC BY-NC 제외

### ADR-005 큐/워크플로우 엔진
- 결정: **Celery + Redis**
- 근거: 파이썬 네이티브, 운영 경험 풍부, 3개월 일정
- 대안: Temporal — 운영 복잡도 높아 Phase 2

### ADR-006 스토리지
- 결정: **Cloudflare R2 + imgproxy**
- 근거: egress 무료, S3 호환, 자체 호스팅 imgproxy로 비용 통제
- 대안: AWS S3 + Lambda Sharp — egress 비용 부담

### ADR-007 모노레포
- 결정: **pnpm + Turborepo + Biome + Changesets**
- 근거: 학습 비용 낮음, 이미 Biome 사용
- 대안: Nx — 팀 규모 대비 과잉

### ADR-008 데이터베이스
- 결정: **PostgreSQL 16 + Redis 7**
- 근거: 범용성, JSONB로 편집 상태 저장
- 분석 로그: Phase 2에서 TimescaleDB 추가

### ADR-009 배포 타겟
- 결정: **oci-arm (Caddy 컨테이너) + Modal(GPU 서버리스)**
- 근거: 사용자 기존 인프라 관행 활용, GPU는 종량제
- 대안: 전용 GPU 서버 — MAU 증가 후 전환

### ADR-010 라이선스 게이트
- 결정: **AGPL, CC BY-NC, S-Lab 라이선스 모델/라이브러리 전면 금지**
- 집행: CI에 `license-checker`(JS) / `pip-licenses`(Python) 통합, 허용 목록 외 의존성 실패 처리

---

## 부록 C: 프리런칭 체크리스트

### C.1 코드 품질
- [ ] TypeScript strict 모드 전역 통과
- [ ] `pnpm biome check` 에러 0
- [ ] `pnpm turbo run test` 100% 통과
- [ ] `ruff` / `mypy` 백엔드 통과
- [ ] 커버리지 ≥ 70% (서비스 레이어 ≥ 85%)

### C.2 성능
- [ ] Lighthouse 모바일 Performance ≥ 85
- [ ] 에디터 페이지 JS ≤ 350KB (초기 번들, gzip)
- [ ] LCP ≤ 2.5s (4G)
- [ ] GPU 작업 P95 ≤ 정의된 예산

### C.3 접근성
- [ ] 키보드 Tab 순서 = 시각 순서
- [ ] 모든 버튼 `aria-label` 또는 텍스트
- [ ] 대비 WCAG AA 충족
- [ ] focus-visible 아웃라인 유지
- [ ] 터치 타겟 ≥ 44px

### C.4 보안
- [ ] CSP 프로덕션에서 `unsafe-inline` 제거
- [ ] HSTS Preload 적용
- [ ] 시크릿 Vault/환경변수에서만 주입
- [ ] Sentry에 PII 스크러빙 설정

### C.5 법무/운영
- [ ] 서비스 약관/개인정보 처리방침 한국 PIPA 기준 검토
- [ ] 얼굴 데이터 처리 고지 및 동의 동선
- [ ] 삭제 요청 SOP
- [ ] 장애 알림 채널 및 on-call 로테이션

---

## 부록 D: 주요 라이브러리 버전 호환 매트릭스

| Next.js | React | Konva | react-konva | @mediapipe/tasks-vision | next-intl |
|---------|-------|-------|-------------|--------------------------|-----------|
| 15.2 | 19.0 | 9.3.x | 18.2.10 (peer React 18 호환) | 0.10.20 | 3.15 |

- 주의: react-konva는 React 19 공식 지원이 아직 늦어질 수 있음. 릴리스 노트 확인 필수.
- `pnpm overrides`로 `react: 19.0.0`, `react-dom: 19.0.0` 강제
- react-konva가 React 19 peer 경고 시 `--no-strict-peer-dependencies` 대신 **overrides**로 해결

```jsonc
{
  "pnpm": {
    "overrides": {
      "react": "19.0.0",
      "react-dom": "19.0.0"
    },
    "peerDependencyRules": {
      "allowedVersions": {
        "react": "19",
        "react-dom": "19"
      }
    }
  }
}
```

---

## 부록 E: 디렉터리 레이아웃 최종 제안

```
photo-magic/
├ apps/
│  ├ web/
│  │  ├ app/
│  │  │  ├ (marketing)/
│  │  │  ├ (auth)/
│  │  │  ├ (editor)/
│  │  │  │  └ editor/[projectId]/page.tsx
│  │  │  ├ api/
│  │  │  │  └ jobs/[id]/route.ts  (SSE proxy)
│  │  │  └ layout.tsx
│  │  ├ components/
│  │  │  ├ editor/
│  │  │  ├ ui/
│  │  │  └ layout/
│  │  ├ stores/
│  │  ├ server/
│  │  ├ i18n/
│  │  ├ messages/{ko,en}.json
│  │  ├ public/
│  │  ├ next.config.mjs
│  │  ├ biome.json
│  │  └ package.json
│  └ api/
│     ├ app/
│     │  ├ main.py
│     │  ├ core/
│     │  ├ db/
│     │  ├ domains/
│     │  └ workers/
│     ├ tests/
│     ├ alembic/
│     ├ pyproject.toml
│     └ Dockerfile
├ packages/
│  ├ editor-core/
│  ├ ui/
│  ├ config-tsconfig/
│  ├ config-biome/
│  └ shared-types/
├ infra/
│  ├ compose/
│  │  ├ docker-compose.yml
│  │  └ Caddyfile.sample
│  └ scripts/
├ .github/workflows/
├ turbo.json
├ pnpm-workspace.yaml
├ package.json
├ biome.json
└ README.md
```

---

## 부록 F: 런칭 후 지속 과제

1. **에디터 편집 상태 클라우드 동기화** (CRDT 기반, 예: Yjs)
2. **A/B 테스트 프레임워크** (GrowthBook OSS, 또는 자체 구현)
3. **웹 푸시/이메일** — 작업 완료/리포트 알림
4. **번역 커뮤니티** — Crowdin / Weblate 연결
5. **퍼블릭 API** — 외부 앱에서 photo-magic 파이프라인 호출 (유료 플랜)
6. **AI 스타일 마켓플레이스** — 사용자 커스텀 LUT/셰이더 판매 플랫폼
7. **온프레미스 GPU 풀 전환** — Modal 비용이 월 $1k 초과 시점

---

## 부록 G: 리스크 레지스터 (정량화)

| # | 리스크 | 확률 | 영향 | 점수 | 완화 |
|---|--------|------|------|------|------|
| 1 | react-konva React 19 호환 지연 | 중 | 중 | 6/9 | pnpm overrides + E2E 회귀 테스트 |
| 2 | iOS 사파리 MediaPipe GPU 실패 | 중 | 중 | 6/9 | CPU 폴백, 기기 감지 배너 |
| 3 | GFPGAN 가중치 업스트림 라이선스 변경 | 저 | 고 | 3/9 | 사내 미러링, 대체 모델 준비 |
| 4 | R2 장애 장기화 | 저 | 고 | 3/9 | AWS S3 DR 버킷, 복구 SLA |
| 5 | Modal GPU 요금 급등 | 중 | 고 | 6/9 | 자체 GPU 서버 계약, 요금 모니터링 |
| 6 | Celery 큐 적체 (트래픽 스파이크) | 중 | 중 | 6/9 | 오토스케일 정책, 우선순위 큐 |
| 7 | 개인정보 유출 | 저 | 치명 | 6/9 | 암호화, 접근 로그, 보안 감사 |
| 8 | 사용자 폰 저사양 (뷰티 필터 미동작) | 고 | 저 | 3/9 | 서버 폴백 경로 |
| 9 | Next 15 PPR 버그 | 중 | 저 | 2/9 | PPR 제한적 활성, 문제 시 끄기 |
| 10 | 한국어 폰트 라이선스 | 저 | 중 | 2/9 | Pretendard(OFL) 고정 |

---

## 부록 H: 개발 환경 셋업 가이드

### H.1 필수 도구

```bash
# Node/pnpm
brew install node@20
corepack enable
corepack prepare pnpm@9.4.0 --activate

# Python
brew install python@3.12
python3.12 -m venv .venv
source .venv/bin/activate
pip install -U pip

# 시스템 라이브러리
brew install vips libjpeg webp

# Docker
brew install --cask docker
```

### H.2 최초 부트스트랩

```bash
# 1. 저장소 클론
git clone git@github.com:<org>/photo-magic.git
cd photo-magic

# 2. 프론트
pnpm install
pnpm --filter @photo-magic/web dev

# 3. 백엔드 (별도 터미널)
cd apps/api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# 4. 인프라 (Docker Compose)
cd infra/compose
docker compose up -d postgres redis minio imgproxy
```

### H.3 로컬 GPU 대체

- macOS (Apple Silicon): MPS로 GFPGAN/Real-ESRGAN 일부 지원 (`device="mps"`). 성능은 참고용.
- 로컬 GPU가 없으면 Modal CLI로 원격 워커를 띄우고 FastAPI가 Modal 엔드포인트를 호출하는 "개발 하이브리드" 모드 권장

### H.4 환경 변수 샘플

```env
# apps/api/.env.sample
APP_ENV=dev
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/photomagic
REDIS_URL=redis://localhost:6379/0
R2_ENDPOINT=http://localhost:9000
R2_BUCKET=photo-magic-dev
R2_ACCESS_KEY=minioadmin
R2_SECRET_KEY=minioadmin
JWT_SECRET=change-me
IMGPROXY_KEY=...
IMGPROXY_SALT=...
MEDIAPIPE_CDN=https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20
```

---

## 부록 I: FAQ 요약

- **Q. 왜 TUI를 안 쓰나?** 유지보수 정체와 모바일 UX 한계. MIT 장점은 Filerobot/Konva로 대체.
- **Q. Pintura를 살 가치는?** 팀이 에디터 UX에 시간을 못 쓰면 좋지만, 라이선스/수정 제약 + 연간 비용 대비 Konva+자체 UI가 장기 ROI 우위.
- **Q. CodeFormer를 데모에만 써도 괜찮나?** 내부 품질 비교·벤치에는 허용되나, 사용자 대상 배포·데모에는 불가. 회의 스크린샷 공개도 신중.
- **Q. GPUPixel WASM은 언제 다시 볼까?** 팀 역량과 시간이 확보되면, 피부 톤 프리셋을 GPUPixel의 LUT 엔진으로 확장하는 Phase 2 R&D로 분리.
- **Q. Temporal로 옮기는 기준?** 큐 구성이 2개 이상의 병렬 단계(멀티 스텝 리트라이) + 주 1회 이상 수동 복구 이슈 발생 시.
- **Q. Server Actions로만 AI를 못 돌리나?** Node 런타임 + 에지/서버리스 제약으로 GPU 불가, 장시간 요청 불리. FastAPI로 분리가 정답.

---

## 부록 J: 결론

본 평가는 "3개월 내 SNS 사진 편집기 프로덕션 런칭"이라는 제약 아래 오픈소스 중심의 합리적 구성을 선정했다. 핵심은 다음 네 가지이다.

1. **캔버스 코어는 Konva로, 에디터 UI는 자체 제작** — 커스텀 UX 자유도 확보
2. **뷰티 필터는 MediaPipe + 자체 WebGL 셰이더** — 상용 라이선스 부담 제거 + 모바일 성능
3. **AI 파이프라인은 FastAPI+Celery+GPU 서버리스** — 초기 비용·운영 복잡도 최소화
4. **스토리지는 Cloudflare R2 + imgproxy** — egress 비용 절감, 트래픽 스파이크 대비

각 선택은 ADR로 기록되며, Phase 2(MAU/기능 확장 시) 재평가 트리거를 명시하였다. 라이선스·보안·성능·접근성 체크리스트는 런칭 전 반드시 통과해야 한다.

> **최종 업데이트**: 2026-04-24
> **작성**: photo-magic 아키텍처 리서치
