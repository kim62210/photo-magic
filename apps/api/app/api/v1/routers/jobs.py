from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.common import AppBaseModel

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobRequest(AppBaseModel):
    image_key: str = Field(..., description="S3 object key of the uploaded source image")
    params: dict[str, object] = Field(default_factory=dict)


class JobAcceptedResponse(AppBaseModel):
    job_id: str
    status: Literal["queued", "running", "succeeded", "failed", "cancelled"]


@router.post(
    "/ai-enhance",
    response_model=JobAcceptedResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
async def create_ai_enhance_job(
    payload: JobRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobAcceptedResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="ai-enhance job pipeline not yet implemented",
    )


@router.post(
    "/background-removal",
    response_model=JobAcceptedResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
async def create_background_removal_job(
    payload: JobRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobAcceptedResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="background-removal job pipeline not yet implemented",
    )


@router.post(
    "/upscale",
    response_model=JobAcceptedResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
async def create_upscale_job(
    payload: JobRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> JobAcceptedResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="upscale job pipeline not yet implemented",
    )
