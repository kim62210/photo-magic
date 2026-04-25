# photo-magic

> SNS 업로드에 특화된 사진 편집 웹 애플리케이션.
> 필름 프리셋 · 자연스러운 뷰티 필터 · 원클릭 AI 보정 — 모두 브라우저 안에서.

## 모노레포 구조

```
photo-magic/
├── apps/
│   ├── web/              Next.js 15 App Router (편집기 SPA + 마케팅 + 인증/결제)
│   └── api/              FastAPI (AI 파이프라인 · 결제 webhook · SNS OAuth)
├── packages/
│   ├── ui/               디자인 토큰 + React 컴포넌트
│   ├── editor-engine/    Canvas/WebGL 처리 · 뷰티/AI/색감/페인트 · zustand 스토어
│   ├── shared-types/     공유 TypeScript 타입
│   ├── ai-client/        api 클라이언트 SDK (mock-first)
│   ├── db/               Drizzle ORM 스키마 (users/sessions/jobs/uploads)
│   └── config/           tsconfig 베이스
├── openspec/             스펙 기반 기획서 (proposal · design · specs · tasks)
├── research/             기술/시장 조사 자료 (~9.4k 라인)
├── deploy/               oci-arm 배포 (nginx + Caddy reverse proxy)
└── docker-compose.dev.yml
```

## 사전 요구사항

- Node.js ≥ 20.10 · pnpm ≥ 10
- Python 3.12+ (apps/api 개발 시)
- Docker (로컬 인프라 컨테이너)

## 빠른 시작

```bash
pnpm install

# 인프라 (Postgres, Redis, MinIO, imgproxy)
docker compose -f docker-compose.dev.yml up -d

# 웹 개발 서버 (http://localhost:3000)
pnpm dev:web

# 정적 빌드 (Caddy/nginx 배포용)
NEXT_OUTPUT=export pnpm --filter @photo-magic/web build
# → apps/web/out/
```

API 서버(M2부터):
```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

## 디자인 시스템

`packages/ui/preview/index.html`을 브라우저로 열어 모든 토큰·컴포넌트를
인터랙티브하게 확인할 수 있습니다.

- **Editorial Film Studio** 컨셉
- 4-tier 폰트: Fraunces · Pretendard Variable · Lora · JetBrains Mono
- Cream/Charcoal 베이스 + Rust/Moss/Amber/Plum 강조
- 라이트/다크 자동 전환 + 필름 그레인 오버레이

## 라이브 데모

[https://photo-magic.brian-dev.cloud](https://photo-magic.brian-dev.cloud)

## 기능 (현재)

### 편집기
- **업로드**: JPEG · PNG · WebP · HEIC, 최대 25MB · 8192² 해상도
- **자르기**: 8-핸들 인터랙티브 + 5개 비율 프리셋 (1:1, 4:5, 9:16, 16:9, 3:4)
- **회전·반전**: 90° 단위 회전 · 좌우/상하 반전
- **필름 프리셋 20종**: Portra 400, CineStill 800T, Polaroid SX-70, 카페, 푸드, 셀피, 여행, 계절...
- **WebGL2 LUT 런타임**: 3D 텍스처 기반 색공간 변환 + 그레인 + 비네팅 셰이더
- **색감 조정**: 노출·대비·채도·활기·색온도·틴트·하이라이트·쉐도우·그레인
- **원클릭 자동 보정**: 256px 다운샘플 히스토그램 분석 + 추천 프리셋
- **뷰티 필터**: MediaPipe Face Landmarker (478 랜드마크, 클라이언트 전용) + 스무딩/화이트닝/슬리밍/눈 확대
- **모바일 제스처**: 핀치 줌 (0.1×~8×) · 드래그 팬 · 더블탭 리셋
- **세션 자동저장**: IndexedDB 800ms 디바운스 + 새 탭에서 복구
- **Before/After 비교**: 길게 누르기 + 수직 분할 드래그
- **단축키**: Ctrl+Z 실행취소 · Ctrl+Shift+Z 다시실행 · Ctrl+S 내보내기 · Esc 취소

### 내보내기
- 포맷: JPEG / PNG / WebP × 품질 60-100
- 해상도: 원본 / 1080 / 2K / 4K
- EXIF 위치정보 제거 (기본 ON)
- **다중 비율 일괄 내보내기**: 5개 비율 한 번에

### SNS 공유
- Phase 0: Web Share API (모바일) · iOS Stories URL Scheme · Android Intent · Download
- Phase 1: Threads OAuth (UI 완성, 실 API 키 필요)
- Phase 2: Instagram Graph + TikTok (베타 대기)
- X (Twitter) 직접 업로드 미지원 (유료 API 정책)

### 인증·구독
- 이메일 / Google / Apple 로그인 (NextAuth Mock — 실 서버 연결 시 즉시 활성화)
- **연령 게이트**: 14세 미만 법정대리인 동의 · 16세 미만 뷰티 50% 제한
- 3-tier 플랜: Free / Pro 4,900원 / Pro+ 9,900원
- 토스페이먼츠 결제 (mock — 실 가맹점 키 필요)
- 사용량 대시보드 + 계정 삭제 (GDPR Art. 17)

### 컴플라이언스
- 약관 / 개인정보처리방침 / DPIA / 청소년보호 4종 한국어 페이지
- 쿠키 배너 (필수/통계/마케팅 분리)
- NSFW · C2PA 매니페스트 스텁
- 신고-삭제 24시간 SLA UI

## 마일스톤

- **M1** (W1-4) ✓ — 편집기 MVP 완성, 라이브 배포
- **M2** (W5-9) 진행중 — 뷰티 필터·인증·구독 · AI 파이프라인 백엔드 (GPU 서버 별도)
- **M3** (W10-13) UI 완성 — SNS 공유 · 컴플라이언스 (실 OAuth/결제 키만 받으면 즉시 활성화)

## 라이선스

비공개 — 모든 권리는 photo-magic 팀에 귀속됩니다.
