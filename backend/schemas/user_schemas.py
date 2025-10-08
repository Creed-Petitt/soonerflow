from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class UserResponse(BaseModel):

    id: int
    firebase_uid: str
    email: str
    name: str
    avatar_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    
    firebase_uid: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True
