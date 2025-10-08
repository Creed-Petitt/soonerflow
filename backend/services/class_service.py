from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from datetime import time

from backend.repositories import ClassRepository, ScheduleRepository
from database.models import Class as ClassModel, MeetingTime
from backend.config import settings

class ClassService:
    def __init__(self, db: Session):
        self.db = db
        self.class_repo = ClassRepository()
        self.schedule_repo = ScheduleRepository()

    def get_classes(
        self,
        subject: Optional[str] = None,
        search: Optional[str] = None,
        semester: Optional[str] = None,
        limit: int = 500,
        page: int = 1,
        skip_ratings: bool = False
    ) -> Dict[str, Any]:
        offset = (page - 1) * limit
        classes = self.class_repo.find_classes(self.db, subject, search, semester, limit + 1, offset)
        
        has_next = len(classes) > limit
        if has_next:
            classes = classes[:limit]

        if not skip_ratings and limit > settings.skip_ratings_threshold:
            skip_ratings = True

        formatted_classes = [self.format_class_response(cls, skip_ratings) for cls in classes]

        return {
            "classes": formatted_classes,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": -1,
                "totalPages": -1,
                "hasNext": has_next,
                "hasPrev": page > 1
            }
        }

    def get_class_by_id(self, class_id: str, skip_ratings: bool = False) -> Optional[Dict[str, Any]]:
        cls = self.class_repo.get_by_id(self.db, class_id)
        if not cls:
            return None
        return self.format_class_response(cls, skip_ratings)

    def get_departments(self) -> List[str]:
        return self.class_repo.get_distinct_subjects(self.db)

    def get_all_departments_with_counts(self, semester: str = "202510") -> List[Dict[str, Any]]:
        # This query was moved to ClassRepository, but it didn't take semester. 
        # The correct implementation should filter by semester.
        # For now, we call the old method which is now in the repo.
        departments = self.class_repo.get_semesters_with_counts(self.db) 
        result = [{"code": dept, "count": count} for dept, count in departments if dept]
        return result

    def get_classes_by_department(self, department: str) -> List[ClassModel]:
        return self.class_repo.find_by_department(self.db, department)

    def get_prerequisites(self, class_id: str) -> List[Dict[str, Any]]:
        prereqs = self.class_repo.get_prerequisites_for_class(self.db, class_id)
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

    def format_class_response(self, cls: ClassModel, skip_ratings: bool = False) -> Dict[str, Any]:
        time_str = self.format_meeting_times(cls.meetingTimes)
        days = self.extract_days(cls.meetingTimes)
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"
        clean_title = self.clean_title(cls.title)
        
        sections = [{"id": cls.section, "time": time_str, "instructor": cls.instructor or "TBA", "seats": f"{cls.availableSeats or 0}/{cls.totalSeats or 0}"}]
        
        prerequisites = self.get_prerequisites(cls.id) if not skip_ratings else []
        
        response = {
            "id": cls.id, "subject": cls.subject, "number": cls.courseNumber, "courseNumber": cls.courseNumber,
            "title": clean_title, "instructor": cls.instructor or "TBA", "credits": cls.credits or 3,
            "time": time_str, "location": location, "days": days,
            "available_seats": cls.availableSeats or 0, "total_seats": cls.totalSeats or 0,
            "genEd": cls.genEd or "", "type": cls.type or "", "description": cls.description or "",
            "prerequisites": prerequisites, "sections": sections,
            "rating": 0.0, "difficulty": 0.0, "wouldTakeAgain": 0.0,
            "ratingDistribution": [0, 0, 0, 0, 0], "tags": []
        }
        return response

    def format_meeting_times(self, meeting_times: List[MeetingTime]) -> str:
        if not meeting_times:
            return "TBA"
        time_groups = {}
        for mt in meeting_times:
            time_key = f"{mt.startTime}-{mt.endTime}"
            if time_key not in time_groups:
                time_groups[time_key] = []
            if mt.days:
                time_groups[time_key].append(mt.days)
        
        formatted_times = []
        for time_range, days_list in time_groups.items():
            if days_list:
                unique_days = sorted(set(days_list))
                days_str = "".join(unique_days)
                formatted_times.append(f"{days_str} {time_range}")
            else:
                formatted_times.append(time_range)
        return ", ".join(formatted_times) if formatted_times else "TBA"

    def extract_days(self, meeting_times: List[MeetingTime]) -> List[str]:
        days = []
        for mt in meeting_times:
            if mt.days:
                days.append(mt.days)
        return days

    def check_time_conflicts(self, class_id: str, schedule_id: int) -> Dict[str, Any]:
        new_class = self.class_repo.get_by_id(self.db, class_id)
        if not new_class:
            return {"has_conflict": False, "conflicts": []}
        
        scheduled_classes = self.schedule_repo.get_scheduled_classes(self.db, schedule_id)
        
        conflicts = []
        for scheduled in scheduled_classes:
            existing_class = scheduled.class_
            if self._classes_have_time_conflict(new_class, existing_class):
                conflicts.append({
                    "class_id": existing_class.id, "subject": existing_class.subject,
                    "number": existing_class.courseNumber, "title": existing_class.title,
                    "time": self.format_meeting_times(existing_class.meetingTimes),
                    "days": self.extract_days(existing_class.meetingTimes)
                })
        return {"has_conflict": len(conflicts) > 0, "conflicts": conflicts}

    def _classes_have_time_conflict(self, class1: ClassModel, class2: ClassModel) -> bool:
        times1 = class1.meetingTimes
        times2 = class2.meetingTimes
        if not times1 or not times2:
            return False
        for mt1 in times1:
            for mt2 in times2:
                if self._meeting_times_overlap(mt1, mt2):
                    return True
        return False

    def _meeting_times_overlap(self, mt1: MeetingTime, mt2: MeetingTime) -> bool:
        if not mt1.days or not mt2.days:
            return False
        days1 = set(mt1.days)
        days2 = set(mt2.days)
        if not days1.intersection(days2):
            return False
        try:
            start1 = self._parse_time(mt1.startTime)
            end1 = self._parse_time(mt1.endTime)
            start2 = self._parse_time(mt2.startTime)
            end2 = self._parse_time(mt2.endTime)
        except:
            return False
        return not (end1 <= start2 or end2 <= start1)

    def _parse_time(self, time_str: str) -> time:
        if not time_str:
            return time(0, 0)
        time_str = time_str.strip().upper()
        is_pm = 'PM' in time_str
        time_str = time_str.replace('AM', '').replace('PM', '').strip()
        parts = time_str.split(':')
        hours = int(parts[0])
        minutes = int(parts[1]) if len(parts) > 1 else 0
        if is_pm and hours != 12:
            hours += 12
        elif not is_pm and hours == 12:
            hours = 0
        return time(hours, minutes)

    def clean_title(self, title: str) -> str:
        if not title:
            return ""
        if " (" in title and "@" in title:
            title = title.split(" (")[0]
        if title.startswith("Lab-"):
            title = title[4:]
        return title.strip()

    def detect_linked_lab(self, cls: ClassModel) -> Optional[str]:
        if cls.type != "Lecture":
            return None
        labs = self.class_repo.find_labs_for_lecture(self.db, cls.subject, cls.courseNumber)
        return labs[0].id if labs else None

    def get_lab_sections_for_lecture(self, lecture_id: str) -> List[Dict[str, Any]]:
        lecture = self.class_repo.get_by_id(self.db, lecture_id)
        if not lecture:
            return []
        labs = self.class_repo.find_labs_for_lecture(self.db, lecture.subject, lecture.courseNumber)
        return [self.format_class_response(lab, skip_ratings=True) for lab in labs]