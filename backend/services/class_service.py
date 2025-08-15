"""
Class service module for handling class-related business logic.
Includes data processing, formatting, and department-based loading.
"""
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import Class as ClassModel, MeetingTime
from backend.config import settings


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
        limit: int = 500,
        page: int = 1,
        skip_ratings: bool = False
    ) -> Dict[str, Any]:
        """
        Get classes with optional filtering and pagination.
        
        Args:
            subject: Filter by subject/department
            search: Search term for title, subject, or course number
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
            query = query.filter(
                or_(
                    ClassModel.title.ilike(f"%{search}%"),
                    ClassModel.subject.ilike(f"%{search}%"),
                    ClassModel.courseNumber.ilike(f"%{search}%")
                )
            )
        
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
        
        return {
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
            "description": cls.description or "",
            "prerequisites": "",  # Could be extracted from description if needed
            "genEd": cls.genEd or "",
            "type": cls.type or "",
            "sections": sections,
            # Ratings will be added by the controller if needed
            "rating": 0.0,
            "difficulty": 0.0,
            "wouldTakeAgain": 0.0,
            "ratingDistribution": [0, 0, 0, 0, 0],
            "tags": []
        }
    
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