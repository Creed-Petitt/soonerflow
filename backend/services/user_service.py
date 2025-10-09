from sqlalchemy.orm import Session
from typing import Optional

from backend.repositories import UserRepository, ScheduleRepository
from database.models import User

class UserService:
    def __init__(self, user_repo: UserRepository, schedule_repo: ScheduleRepository):
        self.user_repo = user_repo
        self.schedule_repo = schedule_repo

    def get_or_create_user(
        self,
        db: Session,
        uid: str,
        email: str,
        name: Optional[str] = None,
        avatar_url: Optional[str] = None
    ) -> User:
        user = self.user_repo.get_by_firebase_uid(db, firebase_uid=uid)

        if user:
            user.email = email
            if name:
                user.name = name
            if avatar_url:
                user.avatar_url = avatar_url
        else:
            user = self.user_repo.create(
                db,
                firebase_uid=uid,
                email=email,
                name=name or email.split('@')[0],
                avatar_url=avatar_url
            )
        db.commit()
        return user

    def get_user_by_firebase_uid(self, db: Session, uid: str) -> Optional[User]:
        return self.user_repo.get_by_firebase_uid(db, firebase_uid=uid)

    def get_user_schedules(self, db: Session, user_id: int) -> list:
        user = self.user_repo.get_by_id(db, user_id)
        if not user:
            return []
        return user.schedules
