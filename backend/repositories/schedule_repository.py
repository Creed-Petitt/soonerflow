from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from database.models import Schedule, ScheduledClass
from .base_repository import BaseRepository

class ScheduleRepository(BaseRepository):
    def __init__(self):
        super().__init__(Schedule)

    def find_by_user_and_semester(self, db: Session, user_id: int, semester: str) -> Optional[Schedule]:
        return db.query(Schedule).filter(
            Schedule.user_id == user_id,
            Schedule.semester == semester
        ).first()

    def find_by_id_and_user_id(self, db: Session, schedule_id: int, user_id: int) -> Optional[Schedule]:
        return db.query(Schedule).filter(
            Schedule.id == schedule_id,
            Schedule.user_id == user_id
        ).first()

    def create(self, db: Session, *, user_id: Optional[int], name: str, semester: str, is_active: bool = True, schedule_id: Optional[int] = None) -> Schedule:
        params = {
            "user_id": user_id,
            "name": name,
            "semester": semester,
            "is_active": is_active
        }
        if schedule_id:
            params["id"] = schedule_id

        db_obj = Schedule(**params)
        db.add(db_obj)
        db.flush() # Use flush to get ID without committing
        db.refresh(db_obj)
        return db_obj

    def clear_classes(self, db: Session, schedule_id: int) -> int:
        deleted_count = db.query(ScheduledClass).filter(ScheduledClass.schedule_id == schedule_id).delete(synchronize_session=False)
        return deleted_count

    def add_class_to_schedule(self, db: Session, schedule_id: int, class_id: str, color: str):
        db_obj = ScheduledClass(schedule_id=schedule_id, class_id=class_id, color=color)
        db.add(db_obj)

    def touch(self, db: Session, schedule_id: int):
        schedule = self.get_by_id(db, schedule_id)
        if schedule:
            schedule.updated_at = datetime.utcnow()

    def get_scheduled_classes(self, db: Session, schedule_id: int) -> List[ScheduledClass]:
        return db.query(ScheduledClass).filter(ScheduledClass.schedule_id == schedule_id).all()
