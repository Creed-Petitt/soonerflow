from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    firebase_uid: str
    email: str
    name: str
    avatar_url: Optional[str]
    created_at: datetime


class UserCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    firebase_uid: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
