# Design — photo-magic v1

**Change ID:** `photo-magic-v1`
**Depends on:** `proposal.md`
**Related research:** `research/01..06.md` (8 docs, 9,392 lines)

---

## Context

### 현재 상태
- `/Users/hj/Desktop/photo-magic/` 은 빈 디렉토리(이 change가 구축 대상). 기존 코드 없음.
- 사용자는 이전에 `/Users/hj/Desktop/chaelee-photo/` 에서 `채리_포토에디터.html` 단일 HTML PoC를 작업한 이력이 있으며, 해당 산출물은 photo-magic에 참고 자료로만 활용됨 (프리셋 색감, UX 힌트).
- 사용자 메인 머신은 16GB RAM macOS. 개발 툴도 메모리 효율적이어야 함 (memory/user_env.md 참조).

### 제약
- **인력**: 1인 개발 (솔로). 외주는 디자인 에셋(로고·아이콘·스티커 팩) 정도.
- **일정**: 3개월(약 13주)에 프로덕션 런칭. M1 4주 / M2 5주 / M3 4주.
- **예산**: 초기 월 $50-100(MAU 1만 가정) 인프라. GPU 워커는 필요 시점에 on-demand.
- **기술 경험**: 사용자는 Python/FastAPI, TypeScript/React/Next.js, pnpm 모노레포, Biome, SQLAlchemy async에 익숙 (CLAUDE.md 규칙 기반).
- **법적**: 한국 개인정보보호법·GDPR·EU AI Act·한국 AI기본법(2026-01-22 시행) 동시 대응 필요. 미성년자 보호 강화 의무.

### 이해관계자
- **주 사용자**: 한국 Z/M세대(만 18-34), 인스타·쓰레드 일상 포스팅. 과보정 기피, 필름 감성 선호.
- **보조 사용자**: 크리에이터(소규모 인플루언서, 카페/음식점 SNS 담당자)
- **차단 대상**: 만 14세 미만 (법정대리인 동의 없이는), 만 16세 미만은 뷰티 필터 강도 제한
- **규제 주체**: 개인정보보호위원회(KPIPC), 방송통신위원회, EU DPA, Meta 플랫폼 정책

## Goals / Non-Goals

### Goals
1. **3개월 내 M1/M2/M3 마일스톤 순차 달성** — 각 단계에서 독립적으로 사용 가능한 증분 기능 배포
2. **Must-Have 10종 동작**(proposal 성공 지표): 기본 보정·크롭·비율 프리셋·필름 프리셋·뷰티 필터·AI 지우개·배경 제거·텍스트/스티커·워터마크 없는 내보내기·Threads 원탭 업로드
3. **모바일 웹에서 30fps 프리뷰** 유지(iPhone 12급 이상), 데스크탑 60fps
4. **개인정보 민감정보 수집 회피 아키텍처** — 얼굴 랜드마크는 클라이언트에서만 처리·소멸
5. **라이선스 클린** — 상업 배포 가능한 OSS만 사용, 비상업 라이선스 모델 제로
6. **한국 SNS 사용자 "첫 3초 내 결과" UX** — 원클릭 자동 보정 홈 화면 중앙 고정
7. **지속 가능 구독 구조** — 무료 티어에서도 워터마크 없는 내보내기, 광고 최소화. Pro 4,900원/월

### Non-Goals
- **iOS/Android 네이티브 앱 출시**(M1~M3 범위 밖 — PWA로 대응)
- **영상 편집**(이미지 전용. 영상은 포스트 런칭 Phase)
- **AI 얼굴 스왑/변형**(브랜드 리스크·법적 리스크 높음 — 명시적 배제)
- **Raw 포맷 전문 편집**(Lightroom 경쟁 아님)
- **커뮤니티·피드·팔로우**(편집 도구 스코프, SNS 자체 대체 아님)
- **자체 AI 모델 학습**(오픈소스 사전 학습 모델 사용만)
- **공공 장소 실시간 얼굴 식별**(EU AI Act high-risk 회피)

## Decisions

### D1. 프로젝트 구조: pnpm Workspaces + Turborepo

**Decision:** `apps/web`(Next.js) + `apps/api`(FastAPI) + `packages/*`(공유) 모노레포.

**Rationale:**
- 사용자가 이미 `chaelee-photo`에서 pnpm 10 + Biome + husky 구조를 쓰고 있어 학습 비용 0
- 웹·API·공유 타입·편집 엔진을 한 repo에서 관리해 버전 드리프트 차단
- Turborepo는 Nx보다 학습 장벽 낮고 Biome와 충돌 없음

**Alternatives considered:**
- 단일 Next.js repo + API Route → API가 FastAPI인 이유(Celery/GPU 워커)로 부적합
- Nx 모노레포 → 과도한 플러그인·스키마 학습 비용, 3개월 일정 부담

**Structure:**
```
photo-magic/
├── apps/
│   ├── web/          # Next.js 15 App Router (브라우저 편집기)
│   └── api/          # FastAPI + Celery + GPU 워커
├── packages/
│   ├── shared-types/ # TypeScript DTO (web ↔ api 동기)
│   ├── editor-engine/ # Canvas/WebGL 코어 (web에서만 쓰지만 분리)
│   ├── ai-client/    # AI API TypeScript SDK (web이 api 호출용)
│   ├── ui/           # 공용 디자인 시스템 (버튼·슬라이더 등)
│   └── config/       # tsconfig, biome, eslint 공유
├── openspec/         # 이 change 저장소
├── research/         # 리서치 문서 (8개)
├── infra/            # docker-compose (dev), terraform (prod) 선택
├── .github/workflows/
├── biome.json
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

### D2. 프론트엔드 편집 엔진: Konva.js + Filerobot

**Decision:** Konva.js + React-Konva를 기본 캔버스 엔진으로, Filerobot Image Editor는 일부 보조 기능(크롭 UI, 기본 필터 슬라이더)에 선택적 사용.

**Rationale:**
- research/02-tech-stack-evaluation의 ADR-001: Konva가 모바일 터치·React 친화·번들 면에서 최고
- GPUPixel WASM은 불가 판정(공식 미지원·커뮤니티 포크 전무) → 클라이언트 뷰티는 MediaPipe + 자체 WebGL 셰이더로 대체
- Filerobot은 MIT, React 일급 지원이지만 뷰티·AI·플랫폼 프리셋 같은 커스텀 UX가 필요하므로 전면 의존 대신 참조
- TOAST UI는 유지보수 침체, Fabric v6는 커스텀 비용 큼

**Alternatives:**
- 전면 Filerobot 의존 → 뷰티/AI 기능 확장성 부족
- 전면 자체 구현(Konva 없이 raw WebGL) → 3개월 일정 불가

**Rendering pipeline:**
```
[User Image]
  └─▶ IndexedDB 임시 저장 (자동 저장)
       └─▶ Konva Canvas Stage
             ├─ Background Layer  (원본 이미지)
             ├─ Adjustment Layer  (WebGL2 셰이더: LUT + 슬라이더)
             ├─ Beauty Layer      (MediaPipe landmarks + 셰이더)
             ├─ Annotation Layer  (텍스트·스티커)
             └─ Guide Layer       (안전영역·비율 가이드, non-export)
[Export]
  └─▶ OffscreenCanvas (Web Worker) 최종 렌더
       └─▶ JPEG/PNG/WebP 다운로드 또는 업로드 큐
```

---

### D3. 렌더링 백엔드: WebGL2 기본 + WebGPU 보조 (Hybrid Dual-Stack)

**Decision:** 모든 셰이더·필터는 **WebGL2** 기본 구현. WebGPU는 Chrome/Edge/Android에서 **AI 추론 백엔드용으로만** 사용.

**Rationale:**
- research/05: iOS Safari WebGPU는 2026년 4월 현재 제한적(16.4 이상 부분 지원, 실사용 불안정)
- iOS 트래픽 비중이 한국 특히 20대 중 30% 이상이므로 WebGL2 대신 WebGPU 올인은 위험
- 하지만 ONNX Runtime Web은 WebGPU에서 WASM 대비 5-10배 빠르므로, AI 모델(얼굴 복원·업스케일 **프리뷰**)에만 WebGPU 활용

**Fallback tree:**
```
WebGPU 지원? ── Yes ──▶ AI 모델 WebGPU (ONNX)
                       │ 필터/셰이더는 여전히 WebGL2 (안정성)
                       └ 둘 다 지원되면 모든 작업 GPU 가속
     No
      └─▶ WebGL2 지원? ── Yes ──▶ 모든 필터·뷰티 WebGL2
                                 │ AI는 서버 사이드 전송
                                 └
           No
            └─▶ Canvas 2D (최후의 폴백) + 서버 사이드 전부
```

**성능 목표 (research/05 기반):**

| 디바이스 | 1080p 편집 프리뷰 | 4K 최종 내보내기 |
|---|---|---|
| iPhone SE 2020 (저사양) | 720p 24fps, 뷰티 제한 | 10s 이내 |
| iPhone 12 (중간) | 1080p 30fps | 5s 이내 |
| iPhone 15 Pro / M1 (고급) | 1080p 60fps + WebGPU AI 프리뷰 | 2s 이내 |
| M1 Pro 데스크탑 | 4K 30fps, 풀 파이프라인 | 1s 이내 |

---

### D4. 뷰티 필터: MediaPipe Face Landmarker + 자체 WebGL2 셰이더 (클라이언트 전용)

**Decision:** MediaPipe Tasks `Face Landmarker` (478 랜드마크, Apache-2.0)로 얼굴 랜드마크를 **브라우저에서만** 추출. 스킨 스무딩·화이트닝·슬리밍 셰이더는 자체 구현.

**Rationale:**
- GPUPixel WASM 불가 판정(D2 참조)
- **법적**: 얼굴 랜드마크는 한국 개인정보보호법상 민감정보가 될 수 있으나, 클라이언트 내에서만 처리·즉시 소멸 시키면 "수집" 자체가 발생하지 않음 → 민감정보 별도 동의 UI 회피 가능
- MediaPipe는 GPU delegate로 모바일 30+ FPS, 모델 크기 ~2MB, Apache-2.0 상업 가능

**구현 접근:**
- Bilateral filter (edge-preserving blur) → 스킨 스무딩
- Luminance shift in YCbCr → 화이트닝 (피부 톤만)
- Mesh-based warp (얼굴 윤곽 8개 제어점) → 슬리밍 (최대 5% 변형)
- Eye region brightness boost → 아이 하이라이트

**과보정 방지 (research/06 반영):**
- 슬라이더 최대치 70%, 기본값 50%
- 16세 미만 계정은 최대 30% 자동 강제
- "자연스러움 프리뷰" 토글 버튼 (원본 대비 before/after)

---

### D5. AI 파이프라인: FastAPI + Celery + Redis + GPU 워커 분리

**Decision:** 모든 서버 사이드 AI 작업은 Celery 태스크로 비동기화. GPU가 필요한 작업(GFPGAN, Real-ESRGAN, InSPyReNet)은 별도 GPU 워커 풀. CPU로 가능한 작업(rembg u2net, LaMa, imgproxy 변환)은 별도 풀.

**Rationale:**
- research/02-tech-stack-evaluation ADR-005: Temporal은 운영 복잡도 높음, 3개월 일정에 Celery가 적합
- GPU 인스턴스는 비싸므로 on-demand 스케일링이 중요 — Celery는 큐 깊이로 autoscale 트리거 가능
- FastAPI는 사용자 CLAUDE.md 규칙(python-fastapi.md)과 일치

**모델 선정 (research/02, 04 라이선스 검증 완료):**

| 기능 | 모델 | 라이선스 | GPU/CPU | 512×512 타깃 |
|---|---|---|---|---|
| 얼굴 복원 | GFPGAN v1.4 | Apache-2.0 (가중치 재확인 예정) | GPU | ≤500ms |
| 업스케일 | Real-ESRGAN x4plus | BSD-3-Clause | GPU | ≤2s (1024→4096) |
| 배경 제거 기본 | rembg u2net | MIT | CPU | ≤3s (1080p) |
| 배경 제거 프리미엄 | InSPyReNet | Apache-2.0 | GPU | ≤2s |
| AI 지우개 | LaMa | Apache-2.0 | CPU (빠름) | ≤1s |

**배제 (라이선스 레드 플래그):**
- CodeFormer (S-Lab License 1.0, 비상업)
- BRIA RMBG 1.4/2.0 (CC BY-NC)
- MODNet (CC BY-NC)
- Pintura (상업 유료)

**Job queue:**
```
[Web Client]
  └─▶ POST /api/v1/jobs/face-restore  { image_url, params }
       │  (returns job_id immediately)
       └─▶ Celery broker (Redis)
            ├─▶ GPU Worker Pool (GFPGAN/Real-ESRGAN/InSPyReNet)
            └─▶ CPU Worker Pool (rembg/LaMa/imgproxy)
                 └─▶ R2 (결과 저장, presigned URL)
                      └─▶ Redis pub/sub → WebSocket → Web Client
```

---

### D6. 저장소 & CDN: Cloudflare R2 + imgproxy + PostgreSQL + Redis

**Decision:**
- **오브젝트 스토리지**: Cloudflare R2 (S3 호환, egress 무료)
- **이미지 변환**: 자체 호스팅 imgproxy (온디맨드 리사이즈/포맷/워터마크)
- **RDB**: PostgreSQL 16 (메타데이터, 사용자, 세션, 구독)
- **Cache/Queue**: Redis 7

**Rationale:**
- research/02-tech-stack-evaluation ADR-006: R2는 egress 무료로 이미지 트래픽 비용 차단(AWS S3 대비 70-90% 절감)
- imgproxy는 Go 기반 경량 변환 서버 — Lambda/Sharp 대비 운영 단순
- PostgreSQL은 CLAUDE.md 기본 스택

**데이터 모델 주요 테이블 (Drizzle ORM):**
```ts
users              // id, email, plan, birth_year, consent_flags, created_at
sessions           // id, user_id, refresh_token_hash, expires_at
images             // id, user_id, r2_key, size, width, height, checksum, expires_at
edits              // id, image_id, user_id, preset_data (jsonb), exports (jsonb)
jobs               // id, user_id, type, params, status, result_r2_key, created_at
subscriptions      // id, user_id, plan, status, stripe_sub_id, period_end
upload_tokens      // id, user_id, platform (threads/instagram), token_enc, scope, expires_at
consents           // id, user_id, doc_version, type, granted_at, ip, user_agent
reports            // id, reporter_id, image_id, reason, status, resolved_at
audit_log          // id, user_id, action, entity, metadata (jsonb), created_at
```

**이미지 수명주기:**
- 업로드 원본: 편집 완료 후 7일 자동 삭제 (R2 object lifecycle rule)
- 내보내기 결과: 다운로드 완료 후 24시간 보관 (재다운로드 대비)
- AI 캐시: 입력 해시 키로 24시간 (동일 이미지 재처리 방지)
- 사용자 계정 삭제 시: cascade 삭제 (GDPR Art. 17 right to erasure)

---

### D7. SNS 업로드 전략: Phased Rollout (Threads → Instagram → TikTok)

**Decision:** M3 내에서는 **Threads API만 공식 통합**, Instagram/TikTok은 App Review가 긴 관계로 Phase 2 이후.

**Rationale (research/03):**
- Threads API는 개인 계정 지원 + Meta 생태계 진입점(Instagram과 OAuth 공유) + App Review 2-4주
- Instagram Graph API는 비즈/크리에이터 전용 + App Review 엄격 + Instagram Basic Display deprecated
- X API는 2026년 2월부터 $0.015/포스트 유료화로 소비자 서비스에 부적합 → 배제
- TikTok Content Posting API는 5-10일 승인이지만 스펙이 복잡해 후순위

**Phase 0 (M1 완료 시점에 이미 동작):**
- Web Share API Level 2 (files) — 모바일 Chrome/Safari 공유 시트로 전달
- iOS URL Scheme: `instagram-stories://share?backgroundImage=<encoded>` (스토리)
- Android Intent: `com.instagram.android/.share.handleractivities.ImageShareHandlerActivity`
- 다운로드 버튼 (Always available)

**Phase 1 (M3 내):**
- Threads OAuth + createMediaContainer + publishMedia 플로우 정식 통합
- 피드 게시 + 답글 체인 생성

**Phase 2 (포스트 런칭):**
- Instagram Graph API (비즈 계정 승인 필요)
- TikTok Content Posting API
- 네이버 블로그 API (한국 한정)

**OAuth 토큰 보안:**
- AES-256-GCM 암호화, 키는 AWS KMS 또는 자체 관리 envelope encryption
- Refresh token rotation (만료 60일 전 자동 갱신)
- 플랫폼별 스코프 최소화 (`threads_content_publish`, `instagram_basic` 등)

---

### D8. 구독 모델: 3단 티어 + 무료에도 워터마크 없음

**Decision:** 무료 / Pro (월 4,900원 · 연 39,000원) / Pro+ (월 9,900원 · 연 79,000원).

**Rationale:**
- research/06: 한국 Z세대 구독 심리적 저항선 월 3,900~5,900원. Lightroom 월 12,000원+은 체감 비싸
- research/01: VSCO 구독 강제 전환 실패 사례(2016 이후 9년째 신뢰 미회복)
- **무료 티어에서도 워터마크 없음** — 이것이 차별화 포지션

**플랜별 쿼터:**

| | 무료 | Pro (4,900원) | Pro+ (9,900원) |
|---|---|---|---|
| 편집 | 무제한 | 무제한 | 무제한 |
| 필름 프리셋 | 20개 기본 | +계절·인플루언서 콜라보 | 전체 + 커스텀 저장 무제한 |
| 뷰티 필터 | ○ | ○ | ○ |
| SNS 업로드 | 일 5회 | 일 50회 | 무제한 |
| AI 지우개/배경 제거 | 월 10회 | 월 200회 | 무제한 |
| 얼굴 복원 / 업스케일 | 월 3회 (720p까지) | 월 100회 (1080p) | 무제한 (4K) |
| 내보내기 해상도 | 최대 1080p | 최대 2K | 원본 해상도까지 |
| 워터마크 | **없음** | 없음 | 없음 |
| 광고 | 홈·편집 중 최소 | 없음 | 없음 |

**결제:**
- 한국: 토스페이먼츠(카드·카카오페이·계좌이체·토스)
- 글로벌: Stripe (향후)

---

### D9. 보안 & 법적 컴플라이언스 아키텍처

**Decision:** "민감정보 수집 회피" 원칙을 데이터 흐름 설계에 내재화.

**핵심 원칙:**
1. **얼굴 랜드마크 = 브라우저 내부에서만 존재** (research/04 완화책)
   - MediaPipe 추론 결과(478개 landmark 좌표)는 서버 전송 금지
   - WebGL 셰이더에서 즉시 소비 후 GC
2. **원본 이미지 바이트만 서버 처리** — AI 복원/업스케일/배경 제거
3. **이미지 서버 저장은 작업 수명 기반** — 편집 7일, AI 캐시 24시간
4. **C2PA 매니페스트 자동 삽입** — 모든 AI 편집 결과에
5. **UI "AI 편집" 배지** — 내보내기 시 시각적 표시 (사용자 토글 불가)
6. **NSFW 프리스크린** — 업로드 시점 nsfwjs 모델로 경고, 성적 이미지 탐지 시 AI 기능 비활성화

**연령 게이트:**
- 회원가입 시 생년월일 수집(민감정보 아님, 최소 수집)
- 만 14세 미만: 법정대리인 동의 플로우(문자 본인인증 + 서명 동의서 파일 업로드 또는 카드 인증)
- 만 14-15세: 회원 가능하나 뷰티 필터 강도 30% 자동 제한, AI 얼굴 복원 비활성화
- 만 16세 이상: 전체 기능

**DPIA (Data Protection Impact Assessment):**
- 런칭 전 작성 필수 (한국 생체정보 + GDPR Art. 35)
- 주요 리스크: 얼굴 데이터 서버 미전송(완화), UGC 저작권(신고 프로세스로 완화), 미성년자 뷰티 의존(강도 제한 + 정보 안내 배너)

---

### D10. 테스트 전략

**프론트:**
- **Vitest + React Testing Library** — 컴포넌트·훅 유닛
- **Playwright** — E2E (업로드 → 편집 → 내보내기 골든 경로)
- **Visual regression** — Chromatic 또는 Percy (에디터 UI, M2 이후)
- **Lighthouse CI** — LCP ≤ 2.5s, INP ≤ 200ms 자동 게이트

**백엔드:**
- **pytest + pytest-asyncio + httpx.AsyncClient**
- **Celery task 테스트**: `CELERY_TASK_ALWAYS_EAGER=True`
- **AI 파이프라인 골든 세트**: 30개 테스트 이미지로 PSNR/SSIM 임계값 회귀 체크

**통합:**
- **Docker Compose dev 환경** — Postgres, Redis, imgproxy, MinIO(R2 대체)
- **Staging 환경** — M2 말부터 가동, 베타 100명 대상

---

### D11. CI/CD & 배포

**CI (GitHub Actions):**
- `lint` (Biome + ruff), `typecheck` (tsc --noEmit, mypy), `test`, `build`
- Docker 이미지 빌드 (web, api, gpu-worker, cpu-worker 각각)

**배포:**
- **Web (Next.js)**: Vercel 또는 self-hosted(Cloudflare Pages)
- **API (FastAPI)**: Fly.io 또는 Railway (CPU 태스크)
- **GPU 워커**: Runpod/Lambda Labs (on-demand, 큐 깊이 autoscale)
- **Database**: Supabase / Neon (관리형 Postgres)
- **Cache/Queue**: Upstash Redis (serverless)
- **Storage**: Cloudflare R2

**환경 분리:**
- `dev` — 로컬 docker-compose
- `staging` — 전체 인프라 미니멈 사양
- `production` — 자동 스케일링

---

## Risks / Trade-offs

| 리스크 | 심각도 | 완화책 |
|---|---|---|
| GFPGAN 모델 가중치 제3자 의존성 불명확 | 중 | M1 초 TencentARC 공식 Repo · HuggingFace 라이선스 재검증. 대체 모델 백업: GPEN(Apache-2.0), RestoreFormer++(아직 커뮤니티 검증 중). 최악의 경우 서버사이드 AI 얼굴 복원 기능 제외 후 출시 가능 |
| iOS Safari WebGPU 미지원 | 중 | WebGL2 기본 파이프라인 + WASM SIMD ONNX Runtime Web. WebGPU는 Chrome/Edge에서만 AI 가속 |
| Meta App Review 지연 (Threads 2-4주) | 중 | M3 시작 시점(W9)에 앱 등록 제출, 그 사이 Phase 0 Web Share로 런칭 → Threads 승인되면 업데이트 |
| 3개월 1인 개발 일정 압박 | 높음 | Must-Have 10종 엄격 스코프 관리, Nice-to-Have 10종은 포스트 런칭으로 이연. 매주 금요일 자체 QA 게이트 |
| GPU 워커 비용 폭증 (바이럴 시) | 중 | 무료 티어 쿼터로 사용량 상한 설정, Pro+ 구독자 우선 큐. 큐 깊이 모니터링으로 autoscale |
| 클라이언트 뷰티 필터 저사양 디바이스 품질 저하 | 중 | 저사양 감지 시 "뷰티 기본 모드(밝기·블러만)"로 폴백, 고사양은 풀 셰이더 |
| C2PA 라이브러리 성숙도 | 낮 | `c2pa-js`(Apache-2.0) 또는 `c2pa-rust` WASM 빌드 검증 필요. 초기엔 메타데이터 태깅만이라도 |
| Cloudflare R2 장애 시 이미지 처리 중단 | 낮 | S3 호환 클라이언트 추상화로 AWS S3/MinIO 멀티 CSP 가능 구조. DNS·버킷 복구 플레이북 준비 |
| 비상업 라이선스 모델 실수 유입 | 중 | PR checklist에 "모든 새 AI 모델/데이터셋 라이선스 검증" 항목. SBOM 자동 생성(CycloneDX) |
| 한국 AI기본법 2026-01-22 시행 전 미대응 | 중 | M3 종료 전 워터마크 + C2PA + UI 배지 3중 대응 완료 (11월 말) |
| 얼굴 AR 필터 이용한 딥페이크 악용 | 높 | 기본 기능에서 얼굴 스왑·변형 완전 배제. 스무딩·슬리밍만 제공. 업로드 시 "본인 동의 사진만" 체크박스 + 신고·24시간 삭제 프로세스 |

---

## Migration Plan

**신규 프로젝트이므로 rollback은 배포 단위:**

### 배포 전 체크리스트 (각 스테이지)
1. **Staging 검증**: 자동화된 E2E (Playwright) 통과 + 수동 QA 10개 시나리오
2. **DB 마이그레이션 드라이런**: `drizzle-kit generate` + 스테이징에서 검증
3. **Feature flag 확인**: 신기능은 flag 뒤에 배포, 점진적 rollout
4. **성능 회귀 감시**: Lighthouse CI 임계값 통과

### 롤백 전략
- **Web**: Vercel 이전 배포로 즉시 revert
- **API**: Docker 이미지 태그 이전 버전으로 재배포
- **DB**: Drizzle 마이그레이션은 반드시 backward-compatible(ADD columns nullable, DROP은 다음 릴리스)
- **장애 대응 SLO**: 5분 내 롤백 트리거, 15분 내 복구

### 장기 호환
- API는 `/api/v1/` 프리픽스로 시작, 버전 쓰기(break 시 `/api/v2/` 병행 운영)
- 이미지 포맷 / 프리셋 데이터 스키마는 `version` 필드 포함

---

## Open Questions

1. **한국 AI기본법 세부 고시 미확정** — "기계판독 가능 워터마크"의 구체 사양(LSB? Trustmark? StegaStamp?) — M2 초 법무 협의 필요
2. **GFPGAN v1.4 공식 가중치 출처** — 논문 저자가 모델 학습에 쓴 데이터셋 라이선스(FFHQ는 비상업) 체인 최종 검증 필요 — M1 초 해결
3. **C2PA 매니페스트 디스패치** — 플랫폼(Threads, Instagram)이 메타데이터를 보존할지 불확실 — M3 통합 테스트
4. **Threads API 한국 계정 제약** — 일부 Meta API는 한국 계정 조기 접근 제한 사례 — M2 초 샌드박스 검증
5. **결제 수단**: 토스페이먼츠 vs 포트원(Iamport) 최종 선택 — M3 초 결정
6. **고성능 카메라 촬영 이미지 (iPhone ProRAW, 딥퓨전)** 지원 — M1 초 HEIC → JPEG 변환 파이프라인 성능 측정
7. **오프라인 모드(PWA)** — M3 완료 후 포스트 런칭으로 이연. Service Worker는 정적 에셋 캐시만
8. **번역 (영어 런칭 시점)** — 한국어 완성 후 영어는 M3 말~포스트 런칭

---

**Next:** `specs/<capability>/spec.md` 8개 파일(병렬 생성 중) 완료 후 `tasks.md`로 주차별 브레이크다운 진입.
