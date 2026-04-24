# Tasks — photo-magic v1

**Change ID:** `photo-magic-v1`
**Target:** 13주 (M1 4w + M2 5w + M3 4w)
**Legend:** 각 그룹은 주차에 대응. 그룹 우측 `🎯 Mx-Wy`는 마일스톤/주차, `📋 <capability>`는 해당 spec 참조.

---

## 1. 프로젝트 부트스트랩 🎯 M1-W1 📋 전부

- [x] 1.1 `/Users/hj/Desktop/photo-magic/` 에 pnpm 모노레포 초기화 (`pnpm init`, `pnpm-workspace.yaml`)
- [x] 1.2 Turborepo 설정 (`turbo.json`), pipeline 정의 (dev, build, lint, test, typecheck)
- [x] 1.3 Biome 글로벌 설정 (`biome.json`) — formatter + linter, husky + lint-staged 전 파일 커밋 전 검증
- [x] 1.4 TypeScript strict 기본 config `packages/config/tsconfig.base.json`, web/api에서 extend
- [x] 1.5 `apps/web` Next.js 15 App Router + React 19 스캐폴딩 (`pnpm dlx create-next-app@latest --typescript --app --use-pnpm`)
- [x] 1.6 `apps/api` FastAPI + pyproject.toml + uv/pip 환경 (CLAUDE.md python-fastapi 규칙 준수)
- [x] 1.7 `packages/shared-types` 초안 (빈 패키지, export 구조만)
- [x] 1.8 `packages/editor-engine`, `packages/ai-client`, `packages/ui` 스캐폴드 + package.json export
- [ ] 1.9 GitHub 레포 생성(private), main 브랜치 보호, PR 템플릿
- [ ] 1.10 GitHub Actions CI: `lint`, `typecheck`, `test`, `build` 매 PR
- [x] 1.11 `docker-compose.dev.yml`: Postgres 16, Redis 7, MinIO(S3 호환), imgproxy
- [x] 1.12 `.env.example` 파일 및 `env.ts` (web) / `settings.py` (api, pydantic-settings) 기본
- [ ] 1.13 Sentry 프로젝트 생성, web/api 두 개 DSN 환경변수
- [ ] 1.14 Drizzle ORM 설정 (`drizzle.config.ts`), 첫 스키마(users, sessions 최소) + 첫 마이그레이션 드라이런
- [x] 1.15 SQLAlchemy async + Alembic 설정 (api는 읽기/쓰기 분리 설계), 연결 풀 설정
- [x] 1.16 README 초안: 프로젝트 소개, dev 환경 구동법, 아키텍처 다이어그램 링크
- [x] 1.17 `.gitignore` (node_modules, .next, .turbo, __pycache__, .venv, .env, logs, tmp, .DS_Store, *.log)
- [x] 1.18 `.opencodeignore` 추가 (node_modules 이중 안전장치)
- [x] 1.19 첫 "hello world" 페이지 + /api/health 엔드포인트 동작 확인
- [x] 1.20 W1 데모: 로컬에서 web ↔ api 통신 성공 + CI 전 체크 초록

## 2. 이미지 I/O & 편집 엔진 기초 🎯 M1-W2 📋 image-editor-core

- [x] 2.1 `packages/editor-engine` 의존성 세팅 (`konva`, `react-konva`, `zustand`)
- [x] 2.2 이미지 업로드 UI (드래그 & 드롭 + 클릭 선택 + 모바일 카메라)
- [x] 2.3 파일 검증: 포맷(JPEG/PNG/WebP/HEIC) · 크기 ≤ 25MB · 해상도 ≤ 8192² (spec Image Upload Format and Size Validation)
- [ ] 2.4 HEIC → JPEG WASM 디코더 통합 (`heic2any` 또는 `libheif-js`)
- [ ] 2.5 IndexedDB 로컬 자동 저장 (`idb-keyval` 또는 `dexie`, 세션 ID별)
- [x] 2.6 Konva Stage 초기화, WebGL2 / Canvas 2D 폴백 감지 + UI 배지
- [x] 2.7 레이어 모델 (Background/Adjustment/Beauty/Annotation/Guide) — TypeScript 타입 정의 + zustand store
- [ ] 2.8 크롭 툴 (자유/비율 고정/숫자 입력)
- [x] 2.9 회전 툴 (90° 단위 + 임의 각도 슬라이더 -45° ~ +45°)
- [ ] 2.10 리사이즈 툴 (픽셀 직접 입력 + 비율 유지 토글)
- [x] 2.11 히스토리 스택 (Undo/Redo, 최대 50 스텝, 메모리 예산 관리)
- [x] 2.12 키보드 단축키 (Ctrl+Z/Shift+Z/Ctrl+S/Esc/Enter) 핸들러
- [ ] 2.13 모바일 핀치 줌 & 드래그 패닝 제스처 (Konva 기본 + 커스텀 튜닝)
- [ ] 2.14 세션 복구 UI (탭 닫았다가 재접속 시 "이전 작업 이어서?" 배너)
- [ ] 2.15 브라우저 환경 테스트 매트릭스 문서 (Chrome/Safari/Firefox 최신 2 버전 + iOS/Android)
- [ ] 2.16 W2 단위 테스트: upload validation, layer store, history reducer
- [ ] 2.17 W2 E2E: 업로드 → 크롭 → 회전 → Undo → 저장 골든 경로 (Playwright)
- [ ] 2.18 W2 데모: 실 이미지로 전체 편집 사이클 구동

## 3. 필터 · 프리셋 🎯 M1-W3 📋 filters-and-presets

- [ ] 3.1 WebGL2 셰이더 런타임 구성 (twgl.js 또는 regl, 초기 컨텍스트 + 리소스 관리)
- [ ] 3.2 LUT 3D 텍스처 로더 (`.cube` 또는 PNG LUT 이미지 → WebGL2 3D texture)
- [ ] 3.3 `packages/editor-engine/filters/lut-shader.ts` 필름 에뮬레이션 셰이더
- [ ] 3.4 색 조정 셰이더: 밝기/대비/채도/온도/틴트/하이라이트/섀도우/선명도
- [ ] 3.5 필름 그레인 오버레이 셰이더 (Simplex noise, intensity 슬라이더)
- [ ] 3.6 비네팅 + 라이트 리크 효과
- [x] 3.7 프리셋 데이터 스키마 (`packages/shared-types/preset.ts` — name, koreanSubtitle, lutFile, adjustments, tier)
- [x] 3.8 초기 20개 필름 프리셋 LUT 파일 + 메타 작성 (research/06 기반 FILM 01~FILM 08 + 카페 + 푸드 + 셀피 + 여행 + 계절)
- [x] 3.9 프리셋 그리드 UI (썸네일 + 한국어 서브타이틀, 스크롤 성능 최적화)
- [x] 3.10 프리셋 강도 슬라이더 (0-100%)
- [ ] 3.11 커스텀 프리셋 저장/불러오기 (로그인 필요 시점부터, M1에선 로컬 IndexedDB)
- [ ] 3.12 "원클릭 자동 보정" 버튼 홈 화면 중앙 고정 (research/06의 "3초 내 결과" UX)
- [ ] 3.13 자동 보정 알고리즘 — 히스토그램 이퀄라이징 + 스킨톤 디텍션 기반 노출 보정
- [ ] 3.14 필터 적용 전/후 비교 토글 (길게 누르기 = before 미리보기)
- [ ] 3.15 성능 테스트: iPhone 12급에서 LUT + 조정 동시 적용 30fps 유지 검증
- [ ] 3.16 W3 데모: 20개 프리셋 동작 + 원클릭 보정

## 4. 플랫폼 프리셋 & 내보내기 🎯 M1-W4 📋 platform-presets, image-editor-core

- [x] 4.1 5개 비율 프리셋 정의 (`packages/shared-types/platform.ts`): 4:5 인스타 / 9:16 스토리 / 1:1 쓰레드 / 16:9 X / 3:4 프린트
- [x] 4.2 플랫폼별 해상도 가이드 (인스타 1080×1350, 스토리 1080×1920 등) + 검증 로직
- [ ] 4.3 안전영역 오버레이 렌더러 (Guide Layer, 스토리 상/하단 250px 등)
- [ ] 4.4 자동 크롭 보조 (얼굴 중심 자동 정렬 옵션, MediaPipe 없이 saliency heuristic)
- [ ] 4.5 플랫폼 프리셋 전환 시 안내 토스트 ("이 비율은 인스타 피드용입니다")
- [ ] 4.6 내보내기 모달: 포맷(JPEG/PNG/WebP), 품질 슬라이더, 해상도 옵션
- [ ] 4.7 여러 비율 일괄 내보내기 (하나 편집 → 5개 파일 zip 다운로드)
- [ ] 4.8 OffscreenCanvas + Web Worker로 최종 렌더 파이프라인 (메인 스레드 블록 방지)
- [ ] 4.9 JPEG 인코더 품질 프로파일 (90/95 기본, Pro+는 95/무손실)
- [ ] 4.10 내보내기 진행률 표시 (대용량 이미지 처리 시)
- [ ] 4.11 다운로드 후 "다시 편집" / "새로 편집" / "공유" 3 버튼
- [ ] 4.12 M1 QA 게이트: Must-Have 중 1-6번(기본 보정·크롭·비율·프리셋·그레인·내보내기) 동작 확인
- [ ] 4.13 M1 성능 감사: Lighthouse LCP ≤ 2.5s (모바일 3G) 달성
- [ ] 4.14 M1 접근성: 스크린 리더 기본 레이블, 키보드 내비 가능
- [ ] 4.15 M1 데모: 베타 테스터 5명에게 편집 → 다운로드 흐름 피드백 수집
- [ ] 4.16 M1 회고 + 스코프 재조정 (W5 시작 전)

## 5. 텍스트 · 스티커 · 콜라주 🎯 M2-W5 📋 image-editor-core (Annotation Layer)

- [ ] 5.1 텍스트 레이어: Pretendard 기본 폰트 + 웹폰트 로딩(font-display: swap)
- [ ] 5.2 폰트 팩 로드: 손글씨 5종, 고딕 3종, 세리프 2종 (라이선스: SIL OFL 또는 상업 허용만)
- [ ] 5.3 텍스트 속성: 크기, 색상, 정렬, 자간, 줄 간격, 그림자, 외곽선
- [ ] 5.4 텍스트 편집 인터랙션 (더블클릭 편집, 모바일 길게 누르기)
- [ ] 5.5 스티커 팩 초기 50종 디자인 발주/자체 제작 (저작권 클린, 이모지 기반 확장)
- [ ] 5.6 스티커 그리드 UI + 카테고리 (감성/이모지/도형/장식)
- [ ] 5.7 스티커 드래그·리사이즈·회전·플립 컨트롤 (Konva Transformer)
- [ ] 5.8 콜라주 템플릿 10종 (2분할×2, 3분할×3, 4분할×3, 6분할×2) — 그리드 기반 데이터 구조
- [ ] 5.9 콜라주 모드 진입 UI (홈 화면 별도 엔트리 포인트)
- [ ] 5.10 콜라주 셀별 이미지 배치 + 드래그로 위치 조정 + 간격 조정
- [ ] 5.11 레이어 패널 UI (순서 변경, 가시성, 잠금)
- [ ] 5.12 텍스트·스티커 레이어 퍼포먼스 튜닝 (100개 이상 배치 시 가상 스크롤)

## 6. 뷰티 필터 🎯 M2-W6 📋 beauty-filter

- [ ] 6.1 `@mediapipe/tasks-vision` Face Landmarker 통합 (코드 스플리팅, 첫 진입 시 lazy)
- [ ] 6.2 MediaPipe 모델 파일 CDN 서빙 + 로컬 캐시 (Service Worker)
- [ ] 6.3 얼굴 감지 결과 → WebGL 유니폼 업로드 어댑터 (478 랜드마크)
- [ ] 6.4 **클라이언트 전용 처리 보장** — 코드 리뷰 + E2E 네트워크 로그 검증 (얼굴 랜드마크 서버 전송 없음)
- [ ] 6.5 스킨 스무딩 셰이더 (bilateral filter, 강도 0-70%)
- [ ] 6.6 화이트닝 셰이더 (YCbCr luminance shift, 피부 마스크만)
- [ ] 6.7 슬리밍 셰이더 (mesh warp, 얼굴 윤곽 8개 제어점, 최대 5% 변형)
- [ ] 6.8 아이 하이라이트 (눈 영역 brightness boost)
- [ ] 6.9 뷰티 UI: 4개 슬라이더 + 기본값 50% + 최대 70% 제한
- [ ] 6.10 **16세 미만 계정 강제 제한** (최대 30%, auth 연동 필요 — M3 W10 완성 후 재연결 가능)
- [ ] 6.11 얼굴 감지 실패 시 폴백 ("얼굴이 감지되지 않았습니다. 수동으로 보정을 적용할까요?")
- [ ] 6.12 여러 얼굴 감지 시 자동 모두 적용 + "선택 얼굴만" 옵션
- [ ] 6.13 성능: 1080p 30fps @ iPhone 12, 모바일 GPU delegate 강제
- [ ] 6.14 Before/After 비교 토글
- [ ] 6.15 "자연스러움 프리뷰" 토글 (전환 전환 테스트 중심)

## 7. AI 파이프라인 기반 🎯 M2-W7 📋 ai-enhancement

- [ ] 7.1 `apps/api/app/jobs/` Celery 모듈 구조 (queue 정의: gpu_queue, cpu_queue)
- [ ] 7.2 Redis broker + result backend 설정 (로컬 docker, 스테이징은 Upstash)
- [ ] 7.3 Job lifecycle 엔드포인트: `POST /api/v1/jobs` (생성), `GET /api/v1/jobs/:id` (폴링), WebSocket/SSE 알림
- [ ] 7.4 입력 이미지 검증 + R2 presigned PUT URL 발급 (`POST /api/v1/uploads/signed-url`)
- [ ] 7.5 R2 버킷 구조: `uploads/`, `edits/`, `ai-cache/` 키 네이밍 스키마
- [ ] 7.6 R2 object lifecycle rule (uploads 7일, ai-cache 24시간 자동 삭제)
- [ ] 7.7 imgproxy self-host 설정 (signed URL key, resize/format 변환)
- [ ] 7.8 rembg u2net (MIT) 배경 제거 CPU 태스크 (1080p ≤ 3s 목표)
- [ ] 7.9 LaMa (Apache-2.0) AI 지우개 CPU 태스크 (1024px ≤ 1s)
- [ ] 7.10 결과 캐싱 (입력 이미지 SHA-256 + params hash → R2 ai-cache/ 키)
- [ ] 7.11 작업 실패/타임아웃 에러 코드 체계 (사용자에게 한국어 친화 메시지)
- [ ] 7.12 `packages/ai-client` TypeScript SDK (createJob, pollJob, cancelJob, listJobs)
- [ ] 7.13 프론트 UI: "AI 지우개" 브러시 툴 + 마스크 생성 + 서버 호출 + 결과 교체
- [ ] 7.14 프론트 UI: "배경 제거" 원클릭 + 편집 중인 이미지에 투명 배경 적용
- [ ] 7.15 API 단위 테스트 (pytest-asyncio + `CELERY_TASK_ALWAYS_EAGER=True`)

## 8. AI 고급 기능 🎯 M2-W8 📋 ai-enhancement

- [ ] 8.1 GFPGAN v1.4 의존성 설정 — 라이선스 재확인 (Apache-2.0 가중치 체인) 문서화
- [ ] 8.2 GPU 워커 이미지(Dockerfile) + CUDA base + PyTorch + gfpgan 설치
- [ ] 8.3 GFPGAN 얼굴 복원 태스크 (512×512 ≤ 500ms @ T4 목표)
- [ ] 8.4 Real-ESRGAN x4plus 업스케일 태스크 (BSD-3, GPU, 1024→4096 ≤ 2s)
- [ ] 8.5 InSPyReNet 프리미엄 배경 제거 태스크 (Apache-2.0, 머리카락 엣지 품질 향상)
- [ ] 8.6 GPU 워커 autoscale 설정 (Runpod/Lambda Labs, 큐 깊이 기반)
- [ ] 8.7 프론트 UI: "AI 보정 원클릭" 버튼 (GFPGAN + 가벼운 색 보정 체인)
- [ ] 8.8 프론트 UI: "업스케일" 2x/4x 옵션, Pro+만 4x 허용
- [ ] 8.9 프론트 UI: "프리미엄 배경 제거" 배너 (Pro+ 전용)
- [ ] 8.10 AI 결과 프리뷰 (작업 중 스켈레톤 → 완료 시 fade-in)
- [ ] 8.11 GPU 비용 모니터링 대시보드 (사용 시간, 작업 수)
- [ ] 8.12 **라이선스 SBOM 자동 생성** (CycloneDX, CI에서 PR마다 비상업 라이선스 감지 시 실패)
- [ ] 8.13 AI 골든 이미지 세트 30장 + PSNR/SSIM 회귀 테스트

## 9. AI UX 완성 🎯 M2-W9 📋 ai-enhancement, privacy-compliance

- [ ] 9.1 작업 큐 UX (진행 중 작업 목록, 취소 버튼, 완료 알림)
- [ ] 9.2 사용량 쿼터 백엔드 (Redis counter, 사용자 플랜별 일/월 한도)
- [ ] 9.3 쿼터 초과 시 업그레이드 CTA (무료 → Pro 유도)
- [ ] 9.4 NSFW 프리스크린 (업로드 시 `nsfwjs` 클라이언트 모델, 성적/폭력 탐지 시 AI 기능 비활성화)
- [ ] 9.5 "본인 동의 사진만 업로드" 체크박스 업로드 모달 (명시적 선택 필수)
- [ ] 9.6 이미지 업로드 시 C2PA 매니페스트 스텁 추가 (AI 편집 결과 플래그 예약)
- [ ] 9.7 M2 QA 게이트: Must-Have 중 7-9번(뷰티·AI 지우개·배경 제거) 동작 확인
- [ ] 9.8 M2 성능 감사: 뷰티 필터 30fps 유지, AI 작업 큐 latency SLO
- [ ] 9.9 M2 데모: 베타 테스터 20명 확대, 실 사용 세션 녹화 분석
- [ ] 9.10 M2 회고 + 스코프 재조정

## 10. 인증 · 구독 · 결제 🎯 M3-W10 📋 auth-and-subscription

- [ ] 10.1 NextAuth v5 (Auth.js) 설정 — 이메일·Google OAuth·Apple Sign in
- [ ] 10.2 사용자 DB 스키마 (`users`, `sessions`, `consents`) 마이그레이션
- [ ] 10.3 회원가입 플로우 + 이메일 인증 (Resend 또는 SES)
- [ ] 10.4 로그인/로그아웃 UI + 세션 persisted (JWT 30일 refresh)
- [ ] 10.5 **생년월일 수집 + 연령 게이트**: 14세 미만 법정대리인 플로우, 16세 미만 뷰티 강도 제한 플래그
- [ ] 10.6 14세 미만 법정대리인 동의 UI (본인인증 + 동의서 파일 업로드 또는 카드 인증)
- [ ] 10.7 플랜 DB 스키마 + 3단 구독 설정 (`subscriptions`, `plans`)
- [ ] 10.8 토스페이먼츠 결제 모듈 연동 (카드·카카오페이·토스·계좌)
- [ ] 10.9 결제 웹훅 핸들러 (구독 성공/실패/해지 상태 동기화)
- [ ] 10.10 구독 관리 페이지 (플랜 업그레이드/다운그레이드/해지)
- [ ] 10.11 사용량 대시보드 (AI 쿼터, SNS 업로드 수, 편집 수)
- [ ] 10.12 청구서·영수증 발행 (PDF 생성, 이메일 전송)
- [ ] 10.13 플랜별 feature flag 프론트 연결 (쿼터/해상도 제한 UI 반영)
- [ ] 10.14 계정 삭제 UI + 백엔드 cascade 삭제 (GDPR Art. 17)
- [ ] 10.15 auth 통합 테스트 (Playwright: 가입 → 구독 → 해지 흐름)

## 11. SNS 업로드 🎯 M3-W11 📋 sns-upload

- [ ] 11.1 **Phase 0**: Web Share API Level 2 (files) 업로드 버튼 — 모바일 Chrome/Safari
- [ ] 11.2 **Phase 0**: iOS URL Scheme `instagram-stories://share?backgroundImage=...` 스토리 공유
- [ ] 11.3 **Phase 0**: Android Intent 공유 (`com.instagram.android/.share.*`)
- [ ] 11.4 **Phase 0**: 다운로드 버튼 (항상 동작)
- [ ] 11.5 플랫폼 업로드 추상화 인터페이스 (`PlatformUploader`) + 팩토리 패턴
- [ ] 11.6 **Meta 개발자 앱 등록 + Threads Product 활성화** (M3 W10 끝에 이미 제출 권장)
- [ ] 11.7 Threads OAuth 2.0 플로우 (redirect → callback → token exchange)
- [ ] 11.8 토큰 암호화 저장: AES-256-GCM + envelope key, `upload_tokens` 테이블
- [ ] 11.9 Threads API: `createMediaContainer` → `publishMedia` 구현
- [ ] 11.10 Threads 업로드 전 이미지 규격 검증 (JPEG only, 해상도 한도, 20장 캐러셀 제한)
- [ ] 11.11 업로드 진행률 UI (프론트에서 SSE로 받음)
- [ ] 11.12 업로드 실패 에러 핸들링 + 재시도 (지수 백오프, 최대 3회)
- [ ] 11.13 업로드 완료 후 Threads 포스트 URL 표시 + "열기" 버튼
- [ ] 11.14 **X API 배제** 안내 배너 ("X는 유료 API로 전환되어 직접 업로드 미지원, 공유 버튼 이용")
- [ ] 11.15 Instagram Graph App Review 제출 준비 (스크린샷·권한 사용 사유서) — 통과는 포스트 런칭
- [ ] 11.16 SNS 업로드 일일 쿼터 집계 (무료 5, Pro 50, Pro+ 무제한)
- [ ] 11.17 OAuth 토큰 만료 감지 + 자동 refresh 또는 재인증 유도

## 12. 개인정보 · 컴플라이언스 · 보안 🎯 M3-W12 📋 privacy-compliance

- [ ] 12.1 이용약관 한국어/영어 작성 (법무 검토 의뢰 포함)
- [ ] 12.2 개인정보처리방침 한국어/영어 (한국 개인정보보호법 + GDPR 체크리스트)
- [ ] 12.3 **DPIA(Data Protection Impact Assessment)** 문서화 (얼굴 처리 흐름, 미성년자 보호)
- [ ] 12.4 약관·정책 버전 관리 + 변경 시 재동의 플로우
- [ ] 12.5 쿠키 배너 (EU 대상, GDPR — 필수/통계/마케팅 분리)
- [ ] 12.6 C2PA 매니페스트 삽입 — AI 편집 결과에 `c2pa-js` 또는 `c2pa-rust` WASM로 서명
- [ ] 12.7 C2PA 매니페스트 필드: "Generated/Edited by photo-magic", AI 모델 목록, 타임스탬프
- [ ] 12.8 "AI 편집" UI 배지 (내보내기 결과물에 시각 오버레이, 사용자 토글 불가 — 한국 AI기본법 대응)
- [ ] 12.9 워터마크 옵션 (Pro+는 끄기 가능하되 C2PA는 항상 유지)
- [ ] 12.10 신고 기능 UI (이미지 우클릭/길게 누르기 → 신고 모달)
- [ ] 12.11 신고 처리 백엔드 (admin dashboard, 24시간 삭제 SLA 카운터)
- [ ] 12.12 관리자 전용 대시보드 (신고 큐, NSFW 탐지 로그, 삭제 승인/거절)
- [ ] 12.13 데이터 내보내기 (GDPR Art. 15) API + 프론트 ("내 데이터 다운로드")
- [ ] 12.14 데이터 삭제 요청 (GDPR Art. 17) API + UI ("계정 영구 삭제")
- [ ] 12.15 감사 로그(`audit_log`) 삽입 — 민감 작업(로그인, 결제, 동의, 삭제 등)
- [ ] 12.16 S3/R2 SSE-KMS 암호화 확인 (버킷 기본 설정)
- [ ] 12.17 비밀번호 해시 argon2 (CLAUDE.md 규칙), 로그인 시도 rate limit
- [ ] 12.18 CORS 명시적 origin 설정 (production `*` 금지)
- [ ] 12.19 production `/docs`, `/redoc` 비활성화 (FastAPI)
- [ ] 12.20 보안 헤더 (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] 12.21 국외 이전 고지 문구 (한국법) + 적정성 결정 EU

## 13. 성능 · QA · 런칭 🎯 M3-W13 📋 전부

- [ ] 13.1 프론트 번들 최적화 (dynamic import, 초기 로드 ≤ 300KB gzip)
- [ ] 13.2 Service Worker 오프라인 폴백 + 정적 에셋 캐시 (PWA manifest)
- [ ] 13.3 Lighthouse CI 성능 예산: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (모바일)
- [ ] 13.4 모바일 실기 테스트 (iPhone SE/12/15, Galaxy A14/S23 최소)
- [ ] 13.5 에러 트래킹 Sentry 알람 룰 (에러율 > 1%, P95 latency > SLO)
- [ ] 13.6 APM OpenTelemetry 계측 (web spans, api spans, celery task spans)
- [ ] 13.7 백엔드 fastapi rate limit (slowapi) + 인증된 사용자 분리 버킷
- [ ] 13.8 부하 테스트 (k6 또는 locust) — 동시 편집 세션 100, 동시 AI 작업 20
- [ ] 13.9 **베타 런칭** (초대 전용, 100-300명 대상) + 피드백 폼 (Typeform)
- [ ] 13.10 베타 분석 (PostHog 또는 자체 이벤트) — 핵심 깔때기 측정
- [ ] 13.11 랜딩 페이지(마케팅 사이트) + 소셜 공유 메타 태그
- [ ] 13.12 브랜드 어셋 최종화 (로고·파비콘·앱 아이콘·OG 이미지)
- [ ] 13.13 프로덕션 환경 최종 점검 (env vars, 시크릿 관리, 백업 정책)
- [ ] 13.14 PostgreSQL 자동 백업 + PITR 설정
- [ ] 13.15 Cloudflare R2 버킷 버저닝 on (실수 삭제 대비)
- [ ] 13.16 도메인·SSL·DNS 세팅 (Cloudflare)
- [ ] 13.17 Incident response 런북 + on-call 연락망
- [ ] 13.18 **공개 런칭** (프로덕트 헌트 + 한국 커뮤니티 — 긱뉴스, GeekNews, 뉴닉)
- [ ] 13.19 런칭 후 30일 모니터링 계획 (데일리 메트릭 체크, W1-W4 회고)
- [ ] 13.20 M3 회고 + 포스트 런칭 로드맵 수립

## 14. 포스트 런칭 (선택) 🎯 M3+ 📋 전부

- [ ] 14.1 Instagram Graph App Review 통과 후 피드/릴스 업로드
- [ ] 14.2 TikTok Content Posting API 통합
- [ ] 14.3 Nice-to-Have 10종 중 우선순위 1-3 (AI 프로필, AI 확장, 한국 크리에이터 시그니처 팩)
- [ ] 14.4 영어 i18n + 글로벌 결제 (Stripe)
- [ ] 14.5 네이티브 앱(React Native 또는 Capacitor) PoC

---

## 마일스톤 체크리스트 요약

### M1 (W1-W4) — 편집기 MVP ✅ 완료 기준
- [ ] 업로드, 크롭, 회전, 리사이즈 동작
- [ ] 20개 필름 프리셋 + 색 조정 슬라이더
- [ ] 5개 비율 프리셋 + 안전영역 가이드
- [ ] 내보내기 (JPEG/PNG/WebP)
- [ ] 모바일 30fps + 데스크탑 60fps
- [ ] Lighthouse LCP ≤ 2.5s

### M2 (W5-W9) — 뷰티 + AI ✅ 완료 기준
- [ ] 텍스트·스티커·콜라주
- [ ] 뷰티 필터 4종 (스무딩·화이트닝·슬리밍·아이 하이라이트)
- [ ] AI 지우개 + 배경 제거 (무료 티어)
- [ ] AI 얼굴 복원 + 업스케일 (Pro 티어)
- [ ] 클라이언트 얼굴 랜드마크 서버 전송 제로 검증
- [ ] 라이선스 SBOM 클린

### M3 (W10-W13) — SNS + 보안 + 런칭 ✅ 완료 기준
- [ ] 계정·구독·결제 동작
- [ ] Threads 원탭 업로드 (Phase 1)
- [ ] Web Share / URL Scheme 폴백
- [ ] C2PA + AI 편집 배지 + 워터마크
- [ ] 연령 게이트 + 법정대리인 동의
- [ ] NSFW 프리스크린 + 신고 24시간 SLA
- [ ] 베타 런칭 100명 + 공개 런칭

---

## 의존성 그래프 요약

```
M1-W1 Bootstrap ───▶ M1-W2 편집 엔진 ───▶ M1-W3 필터 ───▶ M1-W4 내보내기
                                                                 │
                                    ┌────────────────────────────┘
                                    ▼
M2-W5 텍스트/스티커/콜라주 ──▶ M2-W6 뷰티 필터 ──▶ M2-W7 AI 기반 ──▶ M2-W8 AI 고급 ──▶ M2-W9 AI UX
                                                                                         │
                                           ┌─────────────────────────────────────────────┘
                                           ▼
M3-W10 Auth/구독/결제 ──▶ M3-W11 SNS 업로드 ──▶ M3-W12 컴플라이언스 ──▶ M3-W13 QA/런칭
```

---

**Total:** 약 220개 태스크, 13주 솔로 개발 기준. 일일 평균 2-3 태스크 완료 목표.
**Next:** `/opsx:apply` 로 태스크 실행 진입.
