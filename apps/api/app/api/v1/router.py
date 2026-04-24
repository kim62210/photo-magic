from fastapi import APIRouter

from app.api.v1.routers import health, jobs, uploads

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(health.router)
api_v1_router.include_router(jobs.router)
api_v1_router.include_router(uploads.router)
