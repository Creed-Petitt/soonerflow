from typing import List, Dict, Any
from sqlalchemy.orm import Session

from backend.repositories import ScheduleRepository, ClassRepository
from backend.config import settings
from database.models import User, Schedule
from backend.core.exceptions import NotFoundException

class ScheduleService:
    def __init__(self, schedule_repo: ScheduleRepository, class_repo: ClassRepository):
        self.schedule_repo = schedule_repo
        self.class_repo = class_repo

    def get_available_semesters(self, db: Session, include_summers: bool = False, include_historical: bool = False) -> List[Dict[str, Any]]:
        semester_data = self.class_repo.get_semesters_with_counts(db)
        semesters = []
        for sem, count in semester_data:
            is_summer = sem.endswith("30")
            if not include_historical and sem < settings.default_semester:
                continue
            if not include_summers and is_summer:
                continue
            semesters.append({
                "code": sem,
                "name": settings.semester_names.get(sem, sem),
                "class_count": count,
                "is_summer": is_summer
            })
        semesters.sort(key=lambda x: x["code"])
        return semesters

    def get_or_create_schedule_for_semester(self, db: Session, semester: str, current_user: User) -> Dict[str, Any]:
        # Find existing schedule for this user and semester
        schedule = self.schedule_repo.find_by_user_and_semester(db, current_user.id, semester)

        if not schedule:
            # Create new schedule for this semester
            schedule_name = settings.semester_names.get(semester, f"Schedule {semester}")
            schedule = self.schedule_repo.create(
                db,
                user_id=current_user.id,
                name=schedule_name,
                semester=semester
            )
            db.commit()

        return self.get_schedule_details(db, schedule)

    def get_schedule(self, db: Session, schedule_id: int, current_user: User) -> Dict[str, Any]:
        # Find schedule that belongs to the current user
        schedule = self.schedule_repo.find_by_id_and_user_id(db, schedule_id=schedule_id, user_id=current_user.id)

        if not schedule:
             raise NotFoundException("Schedule not found or access denied")

        return self.get_schedule_details(db, schedule)

    def get_schedule_details(self, db: Session, schedule: Schedule) -> Dict[str, Any]:
        # Add color to each class object so Pydantic can pick it up
        for sc in schedule.scheduled_classes:
            sc.class_.color = sc.color

        return {
            "schedule_id": schedule.id,
            "schedule_name": schedule.name,
            "semester": schedule.semester,
            "classes": [sc.class_ for sc in schedule.scheduled_classes]
        }

    def update_schedule_classes(self, db: Session, schedule_id: int, class_ids: List[str], colors: Dict[str, str], current_user: User) -> int:
        # Verify schedule belongs to current user
        schedule = self.schedule_repo.find_by_id_and_user_id(db, schedule_id=schedule_id, user_id=current_user.id)

        if not schedule:
            raise NotFoundException("Schedule not found or access denied")

        # Clear existing classes
        self.schedule_repo.clear_classes(db, schedule_id)

        # Add new classes
        for class_id in class_ids:
            cls = self.class_repo.get_by_id(db, class_id)
            if not cls:
                continue
            color = colors.get(class_id, "#3b82f6")
            self.schedule_repo.add_class_to_schedule(db, schedule_id, class_id, color)

        # Update timestamp
        self.schedule_repo.touch(db, schedule_id)
        db.commit()

        return len(class_ids)