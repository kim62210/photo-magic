# photo-magic

> SNS 업로드에 특화된 사진 편집 웹 애플리케이션.
> 필름 프리셋 · 자연스러운 뷰티 필터 · 원클릭 AI 보정 — 모두 브라우저 안에서.

## 모노레포 구조

```
photo-magic/
├── apps/
│   ├── web/              Next.js 15 App Router (편집기 SPA + 마케팅)
│   └── api/              FastAPI (AI 파이프라인 · 결제 · SNS OAuth)
├── packages/
│   ├── ui/               디자인 토큰 + React 컴포넌트
│   ├── editor-engine/    Canvas/WebGL 처리 · zustand 스토어 · 히스토리
│   ├── shared-types/     공유 TypeScript 타입
│   ├── ai-client/        api 클라이언트 SDK
│   └── config/           tsconfig 베이스
├── openspec/             스펙 기반 기획서 (proposal · design · specs · tasks)
├── research/             기술/시장 조사 자료 (~9.4k 라인)
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

## 마일스톤

- **M1** (W1-4) — 편집기 MVP: 업로드, 비율, 프리셋, 조정, 내보내기 ← 진행 중
- **M2** (W5-9) — 뷰티 필터 + AI 파이프라인 (GFPGAN, rembg, Real-ESRGAN)
- **M3** (W10-13) — SNS 업로드 (Threads → Instagram), 결제, 컴플라이언스, 런칭

## 라이선스

비공개 — 모든 권리는 photo-magic 팀에 귀속됩니다.
