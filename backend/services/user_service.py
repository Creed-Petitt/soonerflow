from sqlalchemy.orm import Session
from typing import Optional

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import User, Schedule

class UserService:

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_user(
        self,
        uid: str,
        email: str,
        name: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> User:
        # Check if user already exists
        user = self.db.query(User).filter(User.firebase_uid == uid).first()

        if user:
            # Update existing user info on every login
            user.email = email
            if name:
                user.name = name
            if avatar_url:
                user.avatar_url = avatar_url
        else:
            # Create new user
            user = User(
                firebase_uid=uid,
                email=email,
                name=name or email.split('@')[0],  # Use email prefix as fallback name
                avatar_url=avatar_url
            )
            self.db.add(user)
            self.db.flush()  # Flush to get the user.id for creating the default schedule

            # Create a default schedule for the new user
            default_schedule = Schedule(
                user_id=user.id,
                name="Spring 2025 Schedule",
                is_active=True,
                semester="202420"  # Spring 2025
            )
            self.db.add(default_schedule)

        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_by_firebase_uid(self, uid: str) -> Optional[User]:
        return self.db.query(User).filter(User.firebase_uid == uid).first()

    def get_user_schedules(self, user_id: int) -> list:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return []
        return user.schedules