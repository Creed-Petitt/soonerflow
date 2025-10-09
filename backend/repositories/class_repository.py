from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional
import re

from database.models import Class, Prerequisite
from .base_repository import BaseRepository

class ClassRepository(BaseRepository):
    def __init__(self):
        super().__init__(Class)

    def get_semesters_with_counts(self, db: Session) -> List:
        return db.query(
            Class.semester,
            func.count(Class.id).label("class_count")
        ).group_by(Class.semester).all()

    def get_departments_with_counts(self, db: Session, semester: str) -> List:
        return db.query(
            Class.subject,
            func.count(Class.id).label("class_count")
        ).filter(Class.semester == semester).group_by(Class.subject).all()

    def find_classes(self, db: Session, subject: Optional[str], search: Optional[str], semester: Optional[str], limit: int, offset: int) -> List[Class]:
        query = db.query(Class)
        if subject:
            query = query.filter(Class.subject.ilike(f"%{subject}%"))
        if search:
            course_pattern = re.match(r'^([A-Z]+(?:\s+[A-Z]+)?)\s+(\d+[A-Z]?)$', search.upper().strip())
            if course_pattern:
                subject_part = course_pattern.group(1).strip()
                number_part = course_pattern.group(2).strip()
                query = query.filter(and_(Class.subject == subject_part, Class.courseNumber == number_part))
            else:
                query = query.filter(or_(Class.title.ilike(f"%{search}%"), Class.subject.ilike(f"%{search}%"), Class.courseNumber.ilike(f"%{search}%")))
        if semester:
            query = query.filter(Class.semester == semester)

        query = query.order_by(Class.courseNumber, Class.subject).options(joinedload(Class.meetingTimes))
        return query.offset(offset).limit(limit).all()

    def get_prerequisites_for_class(self, db: Session, class_id: str) -> List[Prerequisite]:
        return db.query(Prerequisite).filter(Prerequisite.class_id == class_id).all()
