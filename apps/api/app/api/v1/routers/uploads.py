from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.common import AppBaseModel

router = APIRouter(prefix="/uploads", tags=["uploads"])


class PresignedUploadRequest(AppBaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: Literal[
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    ]
    size_bytes: int = Field(..., gt=0, le=25 * 1024 * 1024)


class PresignedUploadResponse(AppBaseModel):
    upload_url: str
    object_key: str
    expires_in: int


@router.post(
    "/presigned",
    response_model=PresignedUploadResponse,
    status_code=status.HTTP_501_NOT_IMPLEMENTED,
)
async def create_presigned_upload(
    payload: PresignedUploadRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PresignedUploadResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="presigned upload not yet implemented",
    )
