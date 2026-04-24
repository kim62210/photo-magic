# photo-magic-api

FastAPI service for the photo-magic project.

## Requirements

- Python 3.12+
- Postgres 16, Redis 7 (use the repo root `docker-compose.dev.yml` for local infra)

## Local development

```bash
cd apps/api
cp .env.example .env

# Option A: uv (recommended)
uv venv
uv pip install -e ".[dev]"

# Option B: pip
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/health` and `curl http://localhost:8000/api/v1/health`.

## Layout

```
app/
  main.py              FastAPI factory + lifespan + /health
  core/                config (pydantic-settings) + structured logging
  api/v1/              versioned APIRouter + per-feature routers
  db/session.py        async SQLAlchemy engine + get_db dependency
  schemas/             shared pydantic v2 base + ErrorResponse
alembic/               migrations (env wired to async engine)
```

## Quality

```bash
ruff check .
mypy app
pytest
```

## Notes

- `/docs` and `/redoc` are disabled when `ENV=production`.
- CORS origins must be set explicitly via `CORS_ORIGINS` (comma-separated). `*` is forbidden in production.
- Job and upload endpoints currently return 501 — wired up in M2.
