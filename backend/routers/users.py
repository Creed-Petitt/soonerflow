from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import User, Schedule, create_engine_and_session


router = APIRouter(prefix="/api", tags=["users"])


# Pydantic models
class UserCreate(BaseModel):
    firebase_uid: str
    email: str
    name: str
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: str
    name: str
    avatar_url: Optional[str]
    created_at: datetime


# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/auth/user", response_model=UserResponse)
async def create_or_update_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.firebase_uid == user_data.firebase_uid).first()

    if user:
        # Update existing user
        user.email = user_data.email
        user.name = user_data.name
        user.avatar_url = user_data.avatar_url
    else:
        # Create new user
        user = User(
            firebase_uid=user_data.firebase_uid,
            email=user_data.email,
            name=user_data.name,
            avatar_url=user_data.avatar_url
        )
        db.add(user)
        db.flush()

        # Create default schedule for new user
        default_schedule = Schedule(
            user_id=user.id,
            name="Spring 2025 Schedule",
            is_active=True,
            semester="202420"  # Spring 2025
        )
        db.add(default_schedule)

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        firebase_uid=user.firebase_uid,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        created_at=user.created_at
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