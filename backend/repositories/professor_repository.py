from typing import List
from sqlalchemy.orm import Session
from database.models import Professor
from .base_repository import BaseRepository

class ProfessorRepository(BaseRepository):
    def __init__(self):
        super().__init__(Professor)

    def get_all_with_ratings(self, db: Session) -> List[Professor]:
        return db.query(Professor).filter(Professor.avgRating > 0).all()

    def find_by_name_with_ratings(self, db: Session, name_part: str) -> List[Professor]:
        return db.query(Professor).filter(
            (Professor.lastName.ilike(f"%{name_part}%")) |
            (Professor.firstName.ilike(f"%{name_part}%"))
        ).filter(Professor.avgRating > 0).all()
