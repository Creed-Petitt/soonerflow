from sqlalchemy.orm import Session
from typing import Optional

from backend.repositories import UserRepository, ScheduleRepository
from database.models import User

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository()
        self.schedule_repo = ScheduleRepository()

    def get_or_create_user(
        self,
        uid: str,
        email: str,
        name: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> User:
        user = self.user_repo.get_by_firebase_uid(self.db, firebase_uid=uid)

        if user:
            user.email = email
            if name:
                user.name = name
            if avatar_url:
                user.avatar_url = avatar_url
        else:
            user = self.user_repo.create(
                self.db,
                firebase_uid=uid,
                email=email,
                name=name or email.split('@')[0],
                avatar_url=avatar_url
            )
            self.schedule_repo.create(
                self.db,
                user_id=user.id,
                name="Spring 2025 Schedule",
                is_active=True,
                semester="202420"
            )
        self.db.commit()
        return user

    def get_user_by_firebase_uid(self, uid: str) -> Optional[User]:
        return self.user_repo.get_by_firebase_uid(self.db, firebase_uid=uid)

    def get_user_schedules(self, user_id: int) -> list:
        user = self.user_repo.get_by_id(self.db, user_id)
        if not user:
            return []
        return user.schedules
