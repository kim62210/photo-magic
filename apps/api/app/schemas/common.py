from typing import Literal

from pydantic import BaseModel, ConfigDict


class AppBaseModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
        extra="forbid",
    )


class ErrorResponse(AppBaseModel):
    detail: str
    code: str


class HealthResponse(AppBaseModel):
    status: Literal["ok"]
    version: str
    environment: str
