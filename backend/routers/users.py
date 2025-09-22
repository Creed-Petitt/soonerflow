from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import User, Schedule, get_db
from backend.auth.auth import get_current_user


router = APIRouter(prefix="/api", tags=["users"])


# Pydantic models
class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: str
    name: str
    avatar_url: Optional[str]
    created_at: datetime


@router.get("/users/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        firebase_uid=current_user.firebase_uid,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at
    )


@router.get("/users/{firebase_uid}", response_model=UserResponse)
async def get_user(
    firebase_uid: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        firebase_uid=user.firebase_uid,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )