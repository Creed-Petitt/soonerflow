from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.repositories import ScheduleRepository, ClassRepository
from backend.services.professor_service import ProfessorService
from backend.services.class_service import ClassService
from database.models import User, Schedule
from backend.core.exceptions import NotFoundException

SEMESTER_NAMES = {
    "202110": "Fall 2021", "202120": "Spring 2022", "202130": "Summer 2022",
    "202210": "Fall 2022", "202220": "Spring 2023", "202230": "Summer 2023",
    "202310": "Fall 2023", "202320": "Spring 2024", "202330": "Summer 2024",
    "202410": "Fall 2024", "202420": "Spring 2025", "202430": "Summer 2025",
    "202510": "Fall 2025", "202520": "Spring 2026", "202530": "Summer 2026",
    "202610": "Fall 2026", "202620": "Spring 2027", "202630": "Summer 2027"
}

class ScheduleService:
    def __init__(
        self,
        schedule_repo: ScheduleRepository,
        class_repo: ClassRepository,
        professor_service: ProfessorService,
        class_service: ClassService
    ):
        self.schedule_repo = schedule_repo
        self.class_repo = class_repo
        self.professor_service = professor_service
        self.class_service = class_service

    def get_available_semesters(self, db: Session, include_summers: bool = False, include_historical: bool = False) -> List[Dict[str, Any]]:
        semester_data = self.class_repo.get_semesters_with_counts(db)
        semesters = []
        for sem, count in semester_data:
            is_summer = sem.endswith("30")
            if not include_historical and sem < "202510":
                continue
            if not include_summers and is_summer:
                continue
            semesters.append({
                "code": sem,
                "name": SEMESTER_NAMES.get(sem, sem),
                "class_count": count,
                "is_summer": is_summer
            })
        semesters.sort(key=lambda x: x["code"])
        return semesters

    def get_or_create_schedule_for_semester(self, db: Session, semester: str, current_user: Optional[User]) -> Dict[str, Any]:
        if not current_user:
            schedule = self.schedule_repo.get_by_id(db, 1)
            if not schedule:
                schedule = self.schedule_repo.create(
                    db,
                    schedule_id=1,
                    user_id=None,
                    name=f"Schedule {semester}",
                    semester=semester
                )
                db.commit()
        else:
            schedule = self.schedule_repo.find_by_user_and_semester(db, current_user.id, semester)
            if not schedule:
                schedule_name = SEMESTER_NAMES.get(semester, f"Schedule {semester}")
                schedule = self.schedule_repo.create(
                    db,
                    user_id=current_user.id,
                    name=schedule_name,
                    semester=semester
                )
                db.commit()

        return self.get_schedule_details(db, schedule)

    def get_schedule(self, db: Session, schedule_id: int, current_user: Optional[User]) -> Dict[str, Any]:
        schedule = None
        if current_user:
            schedule = self.schedule_repo.find_by_id_and_user_id(db, schedule_id=schedule_id, user_id=current_user.id)
        elif schedule_id == 1:
            schedule = self.schedule_repo.get_by_id(db, 1)

        if not schedule:
             raise NotFoundException("Schedule not found or access denied")
        return self.get_schedule_details(db, schedule)

    def get_schedule_details(self, db: Session, schedule: Schedule) -> Dict[str, Any]:
        scheduled_classes = []
        instructor_names = [sc.class_.instructor for sc in schedule.scheduled_classes if sc.class_.instructor and sc.class_.instructor.upper() != "TBA"]
        
        all_ratings = {}
        if instructor_names:
            all_ratings = self.professor_service.get_ratings_for_instructors(instructor_names)

        for sc in schedule.scheduled_classes:
            cls = sc.class_
            ratings = all_ratings.get(cls.instructor, {})
            
            formatted_class = self.class_service.format_class_response(cls)
            formatted_class.update({
                "color": sc.color,
                "rating": ratings.get("rating"),
                "difficulty": ratings.get("difficulty"),
                "wouldTakeAgain": ratings.get("wouldTakeAgain"),
            })
            scheduled_classes.append(formatted_class)

        return {
            "schedule_id": schedule.id,
            "schedule_name": schedule.name,
            "semester": schedule.semester,
            "classes": scheduled_classes
        }

    def update_schedule_classes(self, db: Session, schedule_id: int, class_ids: List[str], colors: Dict[str, str], current_user: Optional[User]) -> int:
        schedule = None
        if current_user:
            schedule = self.schedule_repo.find_by_id_and_user_id(db, schedule_id=schedule_id, user_id=current_user.id)
        elif schedule_id == 1:
            schedule = self.schedule_repo.get_by_id(db, 1)

        if not schedule:
            raise NotFoundException("Schedule not found or access denied")

        self.schedule_repo.clear_classes(db, schedule_id)

        for class_id in class_ids:
            cls = self.class_repo.get_by_id(db, class_id)
            if not cls:
                continue
            color = colors.get(class_id, "#3b82f6")
            self.schedule_repo.add_class_to_schedule(db, schedule_id, class_id, color)

        self.schedule_repo.touch(db, schedule_id)
        db.commit()
        return len(class_ids)