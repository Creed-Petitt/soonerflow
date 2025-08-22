"""
Class service module for handling class-related business logic.
Includes data processing, formatting, and department-based loading.
"""
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import Class as ClassModel, MeetingTime, Prerequisite, ScheduledClass, Schedule, CompletedCourse
from backend.config import settings
from datetime import datetime, time

_department_cache: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 1800


class ClassService:
    """Service for managing class data and operations."""
    
    def __init__(self, db: Session):
        """
        Initialize the class service.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self._department_cache: Dict[str, List[ClassModel]] = {}
    
    def get_classes(
        self,
        subject: Optional[str] = None,
        search: Optional[str] = None,
        semester: Optional[str] = None,
        limit: int = 500,
        page: int = 1,
        skip_ratings: bool = False
    ) -> Dict[str, Any]:
        """
        Get classes with optional filtering and pagination.
        
        Args:
            subject: Filter by subject/department
            search: Search term for title, subject, or course number
            semester: Filter by semester code (e.g., "202510" for Fall 2025)
            limit: Maximum number of classes to return
            page: Page number for pagination
            skip_ratings: Whether to skip professor ratings
            
        Returns:
            Dictionary containing classes and pagination info
        """
        # Build query
        query = self.db.query(ClassModel)
        
        # Apply filters
        if subject:
            query = query.filter(ClassModel.subject.ilike(f"%{subject}%"))
        
        if search:
            # Check if search term matches course code pattern (e.g., "ENGR 2002" or "C S 2413")
            import re
            course_pattern = re.match(r'^([A-Z]+(?:\s+[A-Z]+)?)\s+(\d+[A-Z]?)$', search.upper().strip())
            
            if course_pattern:
                # Split into subject and course number
                subject_part = course_pattern.group(1).strip()
                number_part = course_pattern.group(2).strip()
                
                # Search for exact subject and course number match
                query = query.filter(
                    and_(
                        ClassModel.subject == subject_part,
                        ClassModel.courseNumber == number_part
                    )
                )
            else:
                # Fallback to fuzzy search for non-course-code searches
                query = query.filter(
                    or_(
                        ClassModel.title.ilike(f"%{search}%"),
                        ClassModel.subject.ilike(f"%{search}%"),
                        ClassModel.courseNumber.ilike(f"%{search}%")
                    )
                )
        
        if semester:
            query = query.filter(ClassModel.semester == semester)
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        offset = (page - 1) * limit
        query = query.order_by(ClassModel.courseNumber, ClassModel.subject)
        classes = query.offset(offset).limit(limit).all()
        
        # Determine if we should skip ratings based on threshold
        if not skip_ratings and limit > settings.skip_ratings_threshold:
            skip_ratings = True
        
        # Format classes for response
        formatted_classes = [
            self.format_class_response(cls, skip_ratings)
            for cls in classes
        ]
        
        # Calculate pagination info
        total_pages = max(1, (total_count + limit - 1) // limit)
        
        return {
            "classes": formatted_classes,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "totalPages": total_pages,
                "hasNext": offset + limit < total_count,
                "hasPrev": page > 1
            }
        }
    
    def get_class_by_id(self, class_id: str, skip_ratings: bool = False) -> Optional[Dict[str, Any]]:
        """
        Get a single class by ID.
        
        Args:
            class_id: The class ID
            skip_ratings: Whether to skip professor ratings
            
        Returns:
            Formatted class data or None if not found
        """
        cls = self.db.query(ClassModel).filter(ClassModel.id == class_id).first()
        
        if not cls:
            return None
        
        return self.format_class_response(cls, skip_ratings)
    
    def get_departments(self) -> List[str]:
        """
        Get all unique departments/subjects.
        
        Returns:
            Sorted list of department codes
        """
        subjects = self.db.query(ClassModel.subject).distinct().all()
        return sorted([s[0] for s in subjects if s[0]])
    
    def get_all_departments_with_counts(self, semester: str = "202510") -> List[Dict[str, Any]]:
        global _department_cache
        
        cache_key = f"departments_{semester}"
        now = datetime.now().timestamp()
        
        if cache_key in _department_cache:
            cached_data = _department_cache[cache_key]
            if now - cached_data["timestamp"] < _CACHE_TTL_SECONDS:
                return cached_data["data"]
        
        from sqlalchemy import func
        
        departments = self.db.query(
            ClassModel.subject,
            func.count(ClassModel.id).label('count')
        ).filter(ClassModel.semester == semester).group_by(ClassModel.subject).order_by(ClassModel.subject).all()
        
        result = [
            {"code": dept, "count": count}
            for dept, count in departments if dept
        ]
        
        _department_cache[cache_key] = {
            "data": result,
            "timestamp": now
        }
        
        return result
    
    def get_classes_by_department(
        self,
        department: str,
        use_cache: bool = True
    ) -> List[ClassModel]:
        """
        Get all classes for a specific department.
        
        Args:
            department: Department code (e.g., "ECE", "MATH")
            use_cache: Whether to use cached results
            
        Returns:
            List of class objects
        """
        # Check cache if enabled
        if use_cache and department in self._department_cache:
            return self._department_cache[department]
        
        # Query database
        classes = self.db.query(ClassModel).filter(
            ClassModel.subject == department
        ).order_by(ClassModel.courseNumber).all()
        
        # Cache results
        if use_cache:
            self._department_cache[department] = classes
        
        return classes
    
    def get_prerequisites(self, class_id: str) -> List[Dict[str, Any]]:
        """
        Get prerequisites for a specific class.
        
        Args:
            class_id: The class ID to get prerequisites for
            
        Returns:
            List of prerequisite dictionaries
        """
        prereqs = self.db.query(Prerequisite).filter(
            Prerequisite.class_id == class_id
        ).all()
        
        if not prereqs:
            return []
        
        # Group prerequisites by group number for OR conditions
        prereq_groups = {}
        for prereq in prereqs:
            group_num = prereq.prerequisite_group or 1
            if group_num not in prereq_groups:
                prereq_groups[group_num] = {
                    'type': prereq.prerequisite_type,
                    'courses': []
                }
            prereq_groups[group_num]['courses'].append({
                'subject': prereq.prerequisite_subject,
                'number': prereq.prerequisite_number
            })
        
        # Format for response
        formatted_prereqs = []
        for group_num, group_data in sorted(prereq_groups.items()):
            formatted_prereqs.append({
                'group': group_num,
                'type': group_data['type'],
                'courses': group_data['courses']
            })
        
        return formatted_prereqs
    
    def format_class_response(
        self,
        cls: ClassModel,
        skip_ratings: bool = False
    ) -> Dict[str, Any]:
        """
        Format a class object for API response.
        
        Args:
            cls: Class model object
            skip_ratings: Whether to skip professor ratings
            
        Returns:
            Dictionary with formatted class data
        """
        # Format meeting times
        time_str = self.format_meeting_times(cls.meetingTimes)
        
        # Extract days from meeting times
        days = self.extract_days(cls.meetingTimes)
        
        # Get location
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"
        
        # Clean up title
        clean_title = self.clean_title(cls.title)
        
        # Build sections info
        sections = [{
            "id": cls.section,
            "time": time_str,
            "instructor": cls.instructor or "TBA",
            "seats": f"{cls.availableSeats or 0}/{cls.totalSeats or 0}"
        }]
        
        # Get prerequisites
        prerequisites = self.get_prerequisites(cls.id) if not skip_ratings else []
        
        # Build base response
        response = {
            "id": cls.id,
            "subject": cls.subject,
            "number": cls.courseNumber,
            "title": clean_title,
            "instructor": cls.instructor or "TBA",
            "credits": cls.credits or 3,
            "time": time_str,
            "location": location,
            "days": days,
            "available_seats": cls.availableSeats or 0,
            "total_seats": cls.totalSeats or 0,
            "genEd": cls.genEd or "",
            "type": cls.type or "",
            "description": cls.description or "",  # Always include description
            # Ratings will be added by the controller if needed
            "rating": 0.0,
            "difficulty": 0.0,
            "wouldTakeAgain": 0.0,
            "ratingDistribution": [0, 0, 0, 0, 0],
            "tags": []
        }
        
        # Add expensive fields only when not skipping
        if not skip_ratings:
            response.update({
                "prerequisites": prerequisites,
                "sections": sections
            })
        else:
            # Lightweight response for lists
            response.update({
                "prerequisites": [],
                "sections": []
            })
        
        return response
    
    def format_meeting_times(self, meeting_times: List[MeetingTime]) -> str:
        """
        Format meeting times into a readable string.
        
        Args:
            meeting_times: List of MeetingTime objects
            
        Returns:
            Formatted string like 'MWF 10:00-10:50'
        """
        if not meeting_times:
            return "TBA"
        
        # Group by time for classes that meet at the same time on different days
        time_groups = {}
        for mt in meeting_times:
            time_key = f"{mt.startTime}-{mt.endTime}"
            if time_key not in time_groups:
                time_groups[time_key] = []
            if mt.days:
                time_groups[time_key].append(mt.days)
        
        # Format each time group
        formatted_times = []
        for time_range, days_list in time_groups.items():
            if days_list:
                # Remove duplicates and sort
                unique_days = sorted(set(days_list))
                days_str = "".join(unique_days)
                formatted_times.append(f"{days_str} {time_range}")
            else:
                formatted_times.append(time_range)
        
        return ", ".join(formatted_times) if formatted_times else "TBA"
    
    def extract_days(self, meeting_times: List[MeetingTime]) -> List[str]:
        """
        Extract unique days from meeting times.
        
        Args:
            meeting_times: List of MeetingTime objects
            
        Returns:
            List of day strings
        """
        days = []
        for mt in meeting_times:
            if mt.days:
                days.append(mt.days)
        return days
    
    def check_time_conflicts(self, class_id: str, schedule_id: int) -> Dict[str, Any]:
        """
        Check if a class has time conflicts with existing scheduled classes.
        
        Args:
            class_id: ID of the class to check
            schedule_id: ID of the schedule to check against
            
        Returns:
            Dictionary with conflict status and details
        """
        # Get the class to check
        new_class = self.db.query(ClassModel).filter(ClassModel.id == class_id).first()
        if not new_class:
            return {"has_conflict": False, "conflicts": []}
        
        # Get existing scheduled classes
        scheduled_classes = self.db.query(ScheduledClass).filter(
            ScheduledClass.schedule_id == schedule_id
        ).all()
        
        conflicts = []
        
        for scheduled in scheduled_classes:
            existing_class = scheduled.class_
            
            # Check if there's a time conflict
            if self._classes_have_time_conflict(new_class, existing_class):
                conflicts.append({
                    "class_id": existing_class.id,
                    "subject": existing_class.subject,
                    "number": existing_class.courseNumber,
                    "title": existing_class.title,
                    "time": self.format_meeting_times(existing_class.meetingTimes),
                    "days": self.extract_days(existing_class.meetingTimes)
                })
        
        return {
            "has_conflict": len(conflicts) > 0,
            "conflicts": conflicts
        }
    
    def _classes_have_time_conflict(self, class1: ClassModel, class2: ClassModel) -> bool:
        """
        Check if two classes have overlapping meeting times.
        
        Args:
            class1: First class to compare
            class2: Second class to compare
            
        Returns:
            True if classes have time conflict, False otherwise
        """
        # Get meeting times for both classes
        times1 = class1.meetingTimes
        times2 = class2.meetingTimes
        
        # If either has no meeting times, no conflict
        if not times1 or not times2:
            return False
        
        # Check each combination of meeting times
        for mt1 in times1:
            for mt2 in times2:
                if self._meeting_times_overlap(mt1, mt2):
                    return True
        
        return False
    
    def _meeting_times_overlap(self, mt1: MeetingTime, mt2: MeetingTime) -> bool:
        """
        Check if two meeting times overlap.
        
        Args:
            mt1: First meeting time
            mt2: Second meeting time
            
        Returns:
            True if meeting times overlap, False otherwise
        """
        # Check if days overlap
        if not mt1.days or not mt2.days:
            return False
        
        # Convert day strings to sets for overlap checking
        days1 = set(mt1.days)
        days2 = set(mt2.days)
        
        # If no common days, no conflict
        if not days1.intersection(days2):
            return False
        
        # Parse times
        try:
            start1 = self._parse_time(mt1.startTime)
            end1 = self._parse_time(mt1.endTime)
            start2 = self._parse_time(mt2.startTime)
            end2 = self._parse_time(mt2.endTime)
        except:
            # If can't parse times, assume no conflict
            return False
        
        # Check if time ranges overlap
        # Overlap occurs if one starts before the other ends
        return not (end1 <= start2 or end2 <= start1)
    
    def _parse_time(self, time_str: str) -> time:
        """
        Parse a time string into a time object.
        
        Args:
            time_str: Time string (e.g., "10:30am", "2:45pm")
            
        Returns:
            time object
        """
        if not time_str:
            return time(0, 0)
        
        # Remove am/pm and parse
        time_str = time_str.strip().upper()
        is_pm = 'PM' in time_str
        time_str = time_str.replace('AM', '').replace('PM', '').strip()
        
        # Split hours and minutes
        parts = time_str.split(':')
        hours = int(parts[0])
        minutes = int(parts[1]) if len(parts) > 1 else 0
        
        # Adjust for PM
        if is_pm and hours != 12:
            hours += 12
        elif not is_pm and hours == 12:
            hours = 0
        
        return time(hours, minutes)
    
    def check_prerequisites(self, class_id: str, user_id: int, schedule_id: int) -> Dict[str, Any]:
        """
        Check if prerequisites are met for a class.
        
        Args:
            class_id: ID of the class to check
            user_id: ID of the user
            schedule_id: ID of the current schedule
            
        Returns:
            Dictionary with prerequisite status and details
        """
        # Get prerequisites for the class
        prereqs = self.get_prerequisites(class_id)
        if not prereqs:
            return {"prerequisites_met": True, "missing": []}
        
        # Get completed courses
        completed = self.db.query(CompletedCourse).filter(
            CompletedCourse.user_id == user_id
        ).all()
        
        # Get currently scheduled courses (in same or earlier semesters)
        current_schedule = self.db.query(Schedule).filter(
            Schedule.id == schedule_id
        ).first()
        
        scheduled = []
        if current_schedule:
            # Get all schedules for same or earlier semesters
            all_schedules = self.db.query(Schedule).filter(
                Schedule.user_id == user_id,
                Schedule.semester <= current_schedule.semester
            ).all()
            
            for sched in all_schedules:
                scheduled.extend(sched.scheduled_classes)
        
        # Check each prerequisite group
        missing_prereqs = []
        
        # Create sets of completed course codes for easier checking
        completed_course_codes = set()
        for c in completed:
            # Normalize the course code format
            completed_course_codes.add(c.course_code.upper().strip())
            # Also add without spaces for flexibility
            completed_course_codes.add(c.course_code.upper().replace(' ', ''))
        
        # Create set of scheduled course codes
        scheduled_course_codes = set()
        for sc in scheduled:
            code = f"{sc.class_.subject} {sc.class_.courseNumber}".upper().strip()
            scheduled_course_codes.add(code)
            scheduled_course_codes.add(code.replace(' ', ''))
        
        for prereq_group in prereqs:
            group_met = False
            group_courses = []
            
            # For OR groups, only one needs to be met
            for course in prereq_group['courses']:
                course_code = f"{course['subject']} {course['number']}".upper().strip()
                course_code_no_space = course_code.replace(' ', '')
                group_courses.append(course_code)
                
                # Check if completed (check both with and without space)
                if course_code in completed_course_codes or course_code_no_space in completed_course_codes:
                    group_met = True
                    break
                
                # Check if scheduled
                if course_code in scheduled_course_codes or course_code_no_space in scheduled_course_codes:
                    group_met = True
                    break
            
            if not group_met:
                if prereq_group['type'] == 'or':
                    missing_prereqs.append({
                        "type": "or",
                        "courses": group_courses,
                        "message": f"One of: {' or '.join(group_courses)}"
                    })
                else:
                    missing_prereqs.append({
                        "type": "required",
                        "courses": group_courses,
                        "message": ' and '.join(group_courses)
                    })
        
        return {
            "prerequisites_met": len(missing_prereqs) == 0,
            "missing": missing_prereqs
        }
    
    def clean_title(self, title: str) -> str:
        """
        Clean up class title.
        
        Args:
            title: Original title string
            
        Returns:
            Cleaned title
        """
        if not title:
            return ""
        
        # Remove location info in parentheses (e.g., "(Norman)")
        if " (" in title and "@" in title:
            title = title.split(" (")[0]
        
        # Remove "Lab-" prefix if present
        if title.startswith("Lab-"):
            title = title[4:]
        
        return title.strip()
    
    def detect_linked_lab(self, cls: ClassModel) -> Optional[str]:
        """
        Detect if a class has a linked lab section.
        
        Args:
            cls: Class model object
            
        Returns:
            Lab section ID if found, None otherwise
        """
        if cls.type != "Lecture":
            return None
        
        # Look for lab sections with matching subject and course number
        lab_course_number = cls.courseNumber
        lab = self.db.query(ClassModel).filter(
            and_(
                ClassModel.subject == cls.subject,
                ClassModel.courseNumber == lab_course_number,
                ClassModel.type == "Lab with No Credit"
            )
        ).first()
        
        return lab.id if lab else None
    
    def get_lab_sections_for_lecture(self, lecture_id: str) -> List[Dict[str, Any]]:
        """
        Get all lab sections for a given lecture.
        
        Args:
            lecture_id: ID of the lecture class
            
        Returns:
            List of formatted lab section data
        """
        lecture = self.db.query(ClassModel).filter(ClassModel.id == lecture_id).first()
        
        if not lecture:
            return []
        
        # Find all lab sections
        labs = self.db.query(ClassModel).filter(
            and_(
                ClassModel.subject == lecture.subject,
                ClassModel.courseNumber == lecture.courseNumber,
                ClassModel.type == "Lab with No Credit"
            )
        ).all()
        
        return [self.format_class_response(lab, skip_ratings=True) for lab in labs]
    
    def clear_department_cache(self, department: Optional[str] = None):
        """
        Clear the department cache.
        
        Args:
            department: Specific department to clear, or None to clear all
        """
        if department:
            self._department_cache.pop(department, None)
        else:
            self._department_cache.clear()