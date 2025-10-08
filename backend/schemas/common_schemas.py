from typing import Optional
from pydantic import BaseModel


class PaginationResponse(BaseModel):
    
    page: int
    limit: int
    total: int
    totalPages: int
    hasNext: bool
    hasPrev: bool
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    
    class Config:
        from_attributes = True
