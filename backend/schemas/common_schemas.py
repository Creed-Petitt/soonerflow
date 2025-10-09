from typing import Optional
from pydantic import BaseModel, ConfigDict


class PaginationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page: int
    limit: int
    total: int
    totalPages: int
    hasNext: bool
    hasPrev: bool


class ErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    error: str
    detail: Optional[str] = None
