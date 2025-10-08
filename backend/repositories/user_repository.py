from typing import Optional
from sqlalchemy.orm import Session
from database.models import User
from .base_repository import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__(User)

    def get_by_firebase_uid(self, db: Session, firebase_uid: str) -> Optional[User]:
        return db.query(User).filter(User.firebase_uid == firebase_uid).first()

    def create(self, db: Session, *, firebase_uid: str, email: str, name: str, avatar_url: Optional[str]) -> User:
        user = User(firebase_uid=firebase_uid, email=email, name=name, avatar_url=avatar_url)
        db.add(user)
        db.flush()
        db.refresh(user)
        return user
