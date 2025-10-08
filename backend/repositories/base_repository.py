from typing import Any, List, Optional, Type
from sqlalchemy.orm import Session
from database.models import Base

class BaseRepository:
    def __init__(self, model: Type[Base]):
        self.model = model

    def get_by_id(self, db: Session, id: Any) -> Optional[Base]:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_all(self, db: Session) -> List[Base]:
        return db.query(self.model).all()
