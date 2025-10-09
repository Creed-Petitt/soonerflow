from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session

from backend.repositories import ClassRepository
from backend.config import settings
from database.models import Class as ClassModel

class ClassService:
    def __init__(self, class_repo: ClassRepository):
        self.class_repo = class_repo

    def get_classes(
        self,
        db: Session,
        subject: Optional[str] = None,
        search: Optional[str] = None,
        semester: Optional[str] = None,
        limit: int = 500,
        page: int = 1
    ) -> Dict[str, Any]:
        offset = (page - 1) * limit
        classes = self.class_repo.find_classes(db, subject, search, semester, limit + 1, offset)

        has_next = len(classes) > limit
        if has_next:
            classes = classes[:limit]

        return {
            "classes": classes,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": -1,
                "totalPages": -1,
                "hasNext": has_next,
                "hasPrev": page > 1
            }
        }

    def get_class_by_id(self, db: Session, class_id: str) -> Optional[ClassModel]:
        cls = self.class_repo.get_by_id(db, class_id)
        if cls:
            cls.prerequisites = self.get_prerequisites(db, class_id)
            cls.sections = [{
                "id": cls.section,
                "time": cls.time,
                "instructor": cls.instructor or "TBA",
                "seats": f"{cls.availableSeats or 0}/{cls.totalSeats or 0}"
            }]
        return cls

    def get_all_departments_with_counts(self, db: Session, semester: Optional[str] = None) -> List[Dict[str, Any]]:
        semester = semester or settings.default_semester
        departments = self.class_repo.get_departments_with_counts(db, semester)
        result = [{"code": dept, "count": count} for dept, count in departments if dept]
        return result

    def get_prerequisites(self, db: Session, class_id: str) -> List[Dict[str, Any]]:
        prereqs = self.class_repo.get_prerequisites_for_class(db, class_id)
        if not prereqs:
            return []

        prereq_groups = {}
        for prereq in prereqs:
            group_num = prereq.prerequisite_group or 1
            if group_num not in prereq_groups:
                prereq_groups[group_num] = {'type': prereq.prerequisite_type, 'courses': []}
            prereq_groups[group_num]['courses'].append({'subject': prereq.prerequisite_subject, 'number': prereq.prerequisite_number})

        formatted_prereqs = []
        for group_num, group_data in sorted(prereq_groups.items()):
            formatted_prereqs.append({'group': group_num, 'type': group_data['type'], 'courses': group_data['courses']})

        return formatted_prereqs

