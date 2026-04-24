# Proposal — photo-magic v1

**Change ID:** `photo-magic-v1`
**Status:** proposed
**Target launch:** 3개월 (M1 4주 + M2 5주 + M3 4주)
**Author:** hj (kim62210@gmail.com)
**Research:** 8 documents / 9,392 lines in `research/`

---

## Why

한국 SNS 사용자가 포토원더·Snow 수준의 뷰티 보정과 Lightroom 수준의 필름 감성 필터를 **웹 브라우저 하나에서** 사용하고, 인스타그램·쓰레드·X에 **원탭으로 바로 업로드**할 수 있는 서비스가 현재 시장에 존재하지 않는다. 모든 경쟁 제품이 (1) 모바일 네이티브 앱이거나, (2) 뷰티 기능이 없거나, (3) 플랫폼별로 저장→수동 업로드의 3단계 마찰을 강요하고 있어 **"웹 기반 + 뷰티 보정 + 멀티 SNS 업로드"의 교차점이 통째로 비어 있다**. 동시에 2025년 1월 Meta의 Spark AR 제3자 필터 200만 개 일괄 삭제로 외부 편집 도구 수요가 대규모 이탈하고 있고, WebGPU·ONNX Runtime Web·MediaPipe Tasks가 2025년 기준 프로덕션 성숙도에 도달하여 브라우저 내 실시간 뷰티 필터와 AI 후보정이 기술적으로 실현 가능해진 **진입 타이밍**이다.

## What Changes

이 change는 **신규 프로젝트 구축(green-field)**이며, 다음 역량을 갖춘 프로덕션급 웹 애플리케이션 `photo-magic`을 3개월 내에 출시한다.

### Core 편집 기능 (M1, 4주)
- pnpm 모노레포 + Next.js 15 App Router + React 19 + TypeScript strict로 웹 앱 골격 구축 (`apps/web`)
- Konva.js 기반 Canvas 편집 엔진: 크롭·회전·리사이즈·레이어·히스토리(Undo/Redo)
- **플랫폼 비율 프리셋 5종**: 4:5(인스타 피드) · 9:16(스토리/릴스) · 1:1(쓰레드) · 16:9(X) · 3:4(프린트). 각 플랫폼 안전영역(safe-zone) 가이드 오버레이 포함
- **필름 에뮬레이션 프리셋 20종** (LUT 3D 텍스처 + WebGL2 셰이더): Fuji 400H, Portra 400, Cinestill 800T 등 한국 Z세대 주류 감성 톤 (Green shift +3~+8, Highlight lift +10~+20, Saturation −10~−20 기본값)
- 색 조정 슬라이더(밝기/대비/채도/온도/틴트/하이라이트/섀도우), 필름 그레인, 비네팅

### 뷰티 필터 (M2 전반, 2주)
- **클라이언트 사이드 실시간 뷰티 필터**: MediaPipe Tasks Face Landmarker(478 랜드마크) + 자체 WebGL2 셰이더로 구현. 스킨 스무딩(bilateral filter), 화이트닝, 슬리밍(mesh warp), 아이 하이라이트. 1080p @ 30fps (중간급 모바일) 목표
- **과보정 방지 장치**: 슬라이더 최대치를 70%로 제한하고 기본값 50% — 한국 "무보정 같은 보정" 트렌드에 대응
- **GPUPixel WASM은 도입 불가** 판정 (공식 미지원·커뮤니티 포크 전무). MediaPipe + WebGL 셰이더 자체 구현으로 대체

### AI 파이프라인 (M2 후반 + M3 초반, 3주)
- `apps/api` FastAPI + Celery/Redis + GPU 워커 분리 구조
- **얼굴 복원**: GFPGAN v1.4 (Apache-2.0) — CodeFormer는 비상업 라이선스로 **배제**
- **업스케일**: Real-ESRGAN x4plus (BSD-3)
- **배경 제거**: rembg u2net (MIT) 기본 + InSPyReNet(머리카락 엣지 프리미엄) 선택 경로 — BRIA RMBG·MODNet은 비상업 라이선스로 **배제**
- **인페인팅(AI 지우개)**: LaMa (Apache-2.0) — 2025년 한국 "첫 번째 체험 AI 기능" Top 1 수요 대응
- Cloudflare R2 (presigned URL) + imgproxy 변환 파이프라인

### 텍스트·스티커·콜라주 (M2 후반, 1주)
- **Pretendard 기본 폰트** + 손글씨 5종 · 고딕 3종 · 세리프 2종 내장
- 이모지/스티커 초기 팩 50종 (저작권 클린 자체 제작)
- 콜라주 템플릿 10종 (2·3·4·6분할)

### SNS 업로드 (M3 전반, 2주)
- **Phase 0 (즉시)**: Web Share API Level 2 + 다운로드 + 모바일 URL Scheme(`instagram-stories://`, `tiktok://`)
- **Phase 1 (M3 내)**: **Threads API 공식 통합**(OAuth, createMediaContainer→publishMedia) — 진입 장벽 가장 낮음, Meta 생태계 진입점
- **Phase 2 (포스트런칭)**: Instagram Graph API (비즈·크리에이터 계정, App Review 2-4주), TikTok Content Posting API
- **X API는 배제**: 2026년 2월부터 $0.015/포스트 유료화로 무료 쓰기 불가. 폴백은 Web Share

### 계정·구독 (M3 후반, 1주)
- Auth.js (NextAuth v5) + PostgreSQL + Drizzle ORM
- **구독 3단**: 무료(워터마크 없음·광고 최소) / Pro 월 4,900원·연 39,000원 / Pro+ 월 9,900원·연 79,000원 (AI 무제한) — 한국 Z세대 심리적 저항선 반영
- Stripe 또는 토스페이먼츠 결제

### 개인정보·보안·컴플라이언스 (교차 전체)
- **얼굴 랜드마크는 클라이언트에서만 처리, 서버 전송/저장 금지** — 한국 개인정보보호법 제23조 민감정보 처리 회피 설계
- **14세 미만 연령 게이트** + 법정대리인 동의 플로우, **16세 미만 뷰티 필터 강도 제한**
- **AI 편집 결과물에 C2PA 매니페스트 + UI 배지 + 워터마크(선택)** — 한국 AI기본법(2026년 1월 시행) + EU AI Act(2026년 8월 적용) 대응
- 업로드 이미지 **NSFW 프리스크린** + 신고 채널(24시간 내 삭제 SLA) + 딥페이크 악용 방지 조항 (성폭력처벌법 제14조의2)
- 이미지 자동 삭제 정책(편집 후 7일), S3 SSE-KMS 암호화

### 관측·운영
- Sentry + OpenTelemetry
- Biome(lint/format), Vitest + Playwright(E2E), pytest + httpx.AsyncClient(API)
- GitHub Actions CI (lint·test·build·deploy)

**BREAKING**: 없음 (신규 프로젝트)

## Capabilities

### New Capabilities

이 change는 아래 8개 신규 capability를 도입한다. 각 항목은 `specs/<name>/spec.md`로 상세화된다.

- `image-editor-core`: Canvas/WebGL 편집 엔진, 레이어·뷰포트·히스토리, 파일 I/O (업로드·다운로드·포맷 변환), 내보내기 품질 옵션
- `filters-and-presets`: LUT 기반 필름 에뮬레이션 20종, 색 조정 슬라이더, 그레인/비네팅 이펙트, 프리셋 CRUD
- `beauty-filter`: MediaPipe 얼굴 랜드마크 기반 실시간 뷰티 필터(스무딩·화이트닝·슬리밍·아이 하이라이트), 클라이언트 전용 처리, 강도 슬라이더
- `ai-enhancement`: 서버 사이드 AI 파이프라인(얼굴 복원·업스케일·배경 제거·인페인팅), 비동기 작업 큐, 결과 캐싱
- `platform-presets`: SNS 플랫폼별 비율·해상도·안전영역 프리셋(인스타 피드/스토리, 쓰레드, X), 플랫폼 규격 검증
- `sns-upload`: Threads API 직접 업로드(Phase 1), Web Share / URL Scheme 폴백(Phase 0), OAuth 토큰 관리, 업로드 큐·재시도, Instagram Graph / TikTok 확장 경로(Phase 2)
- `auth-and-subscription`: 회원가입/로그인(NextAuth v5), 플랜 관리(무료·Pro·Pro+), 결제 연동, 사용량 쿼터, 청구서·영수증
- `privacy-compliance`: 약관·개인정보처리방침, 연령 게이트·법정대리인 동의, 민감정보 동의 UI, C2PA 매니페스트 삽입, NSFW 필터, 신고·삭제 프로세스, 자동 데이터 만료

### Modified Capabilities

없음 (신규 프로젝트, 기존 capability 변경 없음).

## Impact

### 코드베이스
- **신규 모노레포** `/Users/hj/Desktop/photo-magic/` 구축
- `apps/web` (Next.js 15 + Konva + Filerobot + MediaPipe + WebGL 셰이더)
- `apps/api` (FastAPI + Celery + Redis + GPU 워커)
- `packages/shared-types` (공용 TypeScript 타입), `packages/editor-engine` (편집 엔진 코어 분리), `packages/ai-client` (AI API SDK)
- 인프라: Cloudflare R2 + imgproxy + PostgreSQL 16 + Redis 7
- 기존 `chaelee-photo` 프로젝트와 독립. 해당 프로젝트의 `채리_포토에디터.html` 작업물은 프리셋 설계 참고 자료로만 활용

### 외부 의존성 (상업 이용 가능 라이선스만 채택)
- 프론트: `next@15` · `react@19` · `konva` · `react-konva` · `filerobot-image-editor` (MIT) · `@mediapipe/tasks-vision` (Apache-2.0) · `onnxruntime-web` (MIT) · `zustand` · `@tanstack/react-query` · `biome`
- 백엔드: `fastapi` · `celery[redis]` · `sqlalchemy[asyncio]` · `pydantic` · `gfpgan` · `realesrgan` · `rembg` · `lama-cleaner` (LaMa) · `boto3` (R2)
- 라이선스 레드 플래그 **사전 배제**: CodeFormer (S-Lab 비상업), BRIA RMBG 2.0 (CC BY-NC), MODNet (CC BY-NC), Pintura (상업 유료)

### 외부 API·계약
- Meta for Developers 앱 등록 + Instagram Graph + Threads API (App Review 2-4주 소요 → M3 초에 등록 필수)
- Cloudflare 계정 + R2 버킷 + Workers
- Sentry, PostHog(옵션), Stripe/토스페이먼츠 계약
- Pretendard 폰트(SIL OFL 1.1 — 상업 가능) + 자체 제작 스티커 팩

### 인프라 비용 예상 (월 기준, MAU 1만 가정)
- Cloudflare R2: $1.5 (스토리지 100GB) + 전송 무료
- GPU 워커: Runpod / Lambda Labs T4 인스턴스 시간당 $0.3~0.5, 예상 100시간 → $30-50
- PostgreSQL(Supabase / Neon Free tier): 무료 또는 $25
- 도메인·Vercel / self-hosted: $0~20
- **소계 월 $50-100** (MAU 1만 기준)

### 법적·규제
- 개인정보처리방침 + 이용약관 작성(법무 검토 권장) · DPIA 초안 · Meta 플랫폼 정책 준수 선언 · 한국 AI기본법(2026-01-22 시행)·EU AI Act(2026-08 적용) 대응 문서
- **최고 리스크 Top 5** (research/04-legal-ethics.md):
  1. 얼굴 특징정보 민감정보 분류 → **클라이언트 온디바이스 아키텍처로 회피**
  2. 미성년자(14세) 법정대리인 동의 → **연령 게이트 + 16세 미만 뷰티 강도 제한**
  3. AI 결과물 표시 의무 → **C2PA + UI 배지 + 워터마크 3중**
  4. 비상업 라이선스 모델 차단 → **스택 선정 단계에서 제거 완료**
  5. 제3자 얼굴·딥페이크 악용 → **본인 사진 체크박스 + NSFW 프리스크린 + 24시간 삭제 SLA**

### 성능 목표 (연구 문서 근거)
- 초기 페이지 LCP ≤ 2.5s (모바일 3G), INP ≤ 200ms
- Canvas 편집 프리뷰 60fps (데스크탑), 30fps (iPhone 12급)
- 얼굴 복원 512×512 ≤ 500ms (GPU T4), 업스케일 1024×1024×4 ≤ 2s
- 배경 제거 1080p ≤ 3s (서버), 프리뷰는 rembg-web WASM으로 즉시
- 번들 초기 로드 ≤ 300KB gzip(편집 코어 lazy), MediaPipe/LUT 모델은 동적 import

### 팀·작업
- 솔로 개발 가정(3개월 집중). 디자인 어셋(로고·아이콘·스티커)은 외주 또는 AI 생성 후 C2PA 태깅
- 매주 금요일 내부 데모·리뷰 + M1·M2·M3 종료 시 QA 게이트

---

## 주요 차별화 포지션 (research/01 종합)

1. **웹 기반 + 구독 없이 워터마크 없음** — VSCO 구독 강제 전환 실패 사례 역대칭
2. **멀티 SNS 원탭 업로드** — 경쟁 8개 제품 전부 미지원
3. **한국 감성 프리셋 + SNS 규격 자동 정렬** — SNOW·VSCO 양쪽이 갖지 못한 교집합
4. **클라이언트 사이드 AI로 프라이버시·무료성 보장** — 얼굴 데이터 서버 미전송 구조

## 핵심 리스크 (완화책)

| 리스크 | 완화책 |
|---|---|
| Meta App Review 지연 (2-4주) | M3 시작 전 앱 등록 선행, Threads API 우선 통과 후 Instagram Graph 순차 진행 |
| iOS Safari WebGPU 미지원 | WebGL2 + WASM SIMD 기본 파이프라인, WebGPU는 Chrome/Edge 프리미엄 경로 |
| GFPGAN 모델 파일 라이선스 재확인 필요 | M1 초 TencentARC 공식 Repo 확인, 대체 모델(GPEN, RestoreFormer++) 백업안 준비 |
| 3개월 1인 개발 일정 압박 | MVP 스코프 엄격 관리, Nice-to-Have 10종은 M3 이후로 이연 |
| Cloudflare R2 장애 시 이미지 처리 중단 | S3 호환 클라이언트 추상화로 멀티 CSP 스위칭 가능 구조 |

## 성공 지표 (M3 종료 시점)

- [ ] Must-Have 10종 전부 동작 (기본 보정, 크롭, 비율 프리셋, 필름 프리셋, 뷰티 필터, AI 지우개, 배경 제거, 텍스트/스티커, 워터마크 없는 내보내기, Threads 원탭 업로드)
- [ ] 베타 유저 100명 내 재방문율 ≥ 40%
- [ ] 평균 편집 완료 시간 ≤ 90초
- [ ] 모바일 (iPhone 12급) 프리뷰 30fps 유지
- [ ] 개인정보처리방침·약관·C2PA·연령 게이트 포함 법무 체크리스트 완료

---

**Next:** `/opsx:propose` 후속으로 `design.md` → `specs/**/*.md` → `tasks.md` 순차 생성. 완료 후 `/opsx:apply`로 구현 진입.
