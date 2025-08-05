import logging
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database.models import create_engine_and_session, Class, MeetingTime, Professor, Rating, Major, Requirement, MajorCourse

class SQLAlchemyDatabaseClient:
    """Database client using SQLAlchemy for all operations"""
    
    def __init__(self):
        self.engine, self.SessionLocal = create_engine_and_session()
        self.logger = logging.getLogger(__name__)
    
    def get_session(self) -> Session:
        """Get a database session"""
        return self.SessionLocal()
    
    def save_class(self, class_data: Dict[str, Any]) -> bool:
        """Save class data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Check if class already exists
            existing_class = session.query(Class).filter(Class.id == class_data['id']).first()
            if existing_class:
                # Update existing class with new data (including seat availability)
                existing_class.subject = class_data.get('subject', existing_class.subject)
                existing_class.courseNumber = class_data.get('courseNumber', existing_class.courseNumber)
                existing_class.section = class_data.get('section', existing_class.section)
                existing_class.title = class_data.get('title', existing_class.title)
                existing_class.description = class_data.get('description', existing_class.description)
                existing_class.instructor = class_data.get('instructor', existing_class.instructor)
                existing_class.allInstructors = class_data.get('allInstructors', existing_class.allInstructors)
                existing_class.type = class_data.get('type', existing_class.type)
                existing_class.delivery = class_data.get('delivery', existing_class.delivery)
                existing_class.genEd = class_data.get('genEd', existing_class.genEd)
                existing_class.term = class_data.get('term', existing_class.term)
                existing_class.semesterDates = class_data.get('semesterDates', existing_class.semesterDates)
                existing_class.examInfo = class_data.get('examInfo', existing_class.examInfo)
                existing_class.repeatability = class_data.get('repeatability', existing_class.repeatability)
                existing_class.credits = class_data.get('credits', existing_class.credits or 3)
                existing_class.availableSeats = class_data.get('availableSeats', 0)
                existing_class.totalSeats = class_data.get('totalSeats', 0)
                
                self.logger.info(f"Updated existing class {class_data['id']} with seat data: {class_data.get('availableSeats', 0)}/{class_data.get('totalSeats', 0)}")
                session.commit()
                return True
            
            # Create new class
            new_class = Class(
                id=class_data['id'],
                subject=class_data['subject'],
                courseNumber=class_data['courseNumber'],
                section=class_data['section'],
                title=class_data['title'],
                description=class_data.get('description'),
                instructor=class_data.get('instructor'),
                allInstructors=class_data.get('allInstructors'),
                type=class_data.get('type'),
                delivery=class_data.get('delivery'),
                genEd=class_data.get('genEd'),
                term=class_data.get('term'),
                semesterDates=class_data.get('semesterDates'),
                examInfo=class_data.get('examInfo'),
                repeatability=class_data.get('repeatability'),
                additionalInfo=class_data.get('additionalInfo'),
                credits=class_data.get('credits', 3),
                availableSeats=class_data.get('availableSeats', 0),
                totalSeats=class_data.get('totalSeats', 0)
            )
            
            session.add(new_class)
            session.commit()
            
            self.logger.info(f"Successfully saved class: {class_data.get('subject', '')} {class_data.get('courseNumber', '')}")
            return True
            
        except IntegrityError as e:
            session.rollback()
            self.logger.warning(f"Class {class_data.get('id', 'Unknown')} already exists: {e}")
            return True  # Consider this a success since the data exists
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving class: {e}")
            return False
        finally:
            session.close()
    
    def save_meeting_time(self, meeting_time_data: Dict[str, Any]) -> bool:
        """Save meeting time data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Create new meeting time
            new_meeting_time = MeetingTime(
                classId=meeting_time_data['classId'],
                days=meeting_time_data.get('days'),
                startTime=meeting_time_data.get('startTime'),
                endTime=meeting_time_data.get('endTime'),
                location=meeting_time_data.get('location'),
                building=meeting_time_data.get('building'),
                room=meeting_time_data.get('room')
            )
            
            session.add(new_meeting_time)
            session.commit()
            
            self.logger.info(f"Successfully saved meeting time for class: {meeting_time_data.get('classId', '')}")
            return True
            
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving meeting time: {e}")
            return False
        finally:
            session.close()
    
    def save_major(self, major_data: Dict[str, Any]) -> bool:
        """Save major data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Check if major already exists
            existing_major = session.query(Major).filter(Major.id == major_data['id']).first()
            if existing_major:
                self.logger.info(f"Major {major_data['id']} already exists, skipping...")
                return True
            
            # Create new major
            new_major = Major(
                id=major_data['id'],
                name=major_data['name'],
                college=major_data['college'],
                department=major_data.get('department'),
                totalCredits=major_data.get('totalCredits', 120),
                description=major_data.get('description'),
                url=major_data.get('url')
            )
            
            session.add(new_major)
            session.commit()
            
            self.logger.info(f"Successfully saved major: {major_data.get('name', '')}")
            return True
            
        except IntegrityError as e:
            session.rollback()
            self.logger.warning(f"Major {major_data.get('id', 'Unknown')} already exists: {e}")
            return True
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving major: {e}")
            return False
        finally:
            session.close()
    
    def save_requirement(self, requirement_data: Dict[str, Any]) -> bool:
        """Save requirement data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Check if requirement already exists
            existing_requirement = session.query(Requirement).filter(Requirement.id == requirement_data['id']).first()
            if existing_requirement:
                self.logger.info(f"Requirement {requirement_data['id']} already exists, skipping...")
                return True
            
            # Create new requirement
            new_requirement = Requirement(
                id=requirement_data['id'],
                majorId=requirement_data['majorId'],
                categoryName=requirement_data['categoryName'],
                creditsNeeded=requirement_data.get('creditsNeeded', 0),
                description=requirement_data.get('description')
            )
            
            session.add(new_requirement)
            session.commit()
            
            self.logger.info(f"Successfully saved requirement: {requirement_data.get('categoryName', '')}")
            return True
            
        except IntegrityError as e:
            session.rollback()
            self.logger.warning(f"Requirement {requirement_data.get('id', 'Unknown')} already exists: {e}")
            return True
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving requirement: {e}")
            return False
        finally:
            session.close()
    
    def save_major_course(self, course_data: Dict[str, Any]) -> bool:
        """Save major course data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Check if course already exists
            existing_course = session.query(MajorCourse).filter(MajorCourse.id == course_data['id']).first()
            if existing_course:
                self.logger.info(f"Major course {course_data['id']} already exists, skipping...")
                return True
            
            # Create new major course
            new_course = MajorCourse(
                id=course_data['id'],
                requirementId=course_data['requirementId'],
                subject=course_data['subject'],
                courseNumber=course_data['courseNumber'],
                title=course_data.get('title'),
                credits=course_data.get('credits', 3)
            )
            
            session.add(new_course)
            session.commit()
            
            self.logger.info(f"Successfully saved major course: {course_data.get('subject', '')} {course_data.get('courseNumber', '')}")
            return True
            
        except IntegrityError as e:
            session.rollback()
            self.logger.warning(f"Major course {course_data.get('id', 'Unknown')} already exists: {e}")
            return True
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving major course: {e}")
            return False
        finally:
            session.close()
    
    def class_exists(self, class_id: str) -> bool:
        """Check if a class exists in the database"""
        session = self.get_session()
        try:
            existing_class = session.query(Class).filter(Class.id == class_id).first()
            return existing_class is not None
        finally:
            session.close()
    
    def major_exists(self, major_id: str) -> bool:
        """Check if a major exists in the database"""
        session = self.get_session()
        try:
            existing_major = session.query(Major).filter(Major.id == major_id).first()
            return existing_major is not None
        finally:
            session.close()
    
    def get_class_stats(self) -> Dict[str, Any]:
        """Get database statistics for classes"""
        session = self.get_session()
        try:
            total_classes = session.query(Class).count()
            total_meeting_times = session.query(MeetingTime).count()
            unique_subjects = session.query(Class.subject).distinct().count()
            unique_instructors = session.query(Class.instructor).filter(Class.instructor.isnot(None)).distinct().count()
            
            return {
                'total_classes': total_classes,
                'total_meeting_times': total_meeting_times,
                'unique_subjects': unique_subjects,
                'unique_instructors': unique_instructors
            }
        finally:
            session.close()
    
    def get_major_stats(self) -> Dict[str, Any]:
        """Get database statistics for majors"""
        session = self.get_session()
        try:
            total_majors = session.query(Major).count()
            total_requirements = session.query(Requirement).count()
            total_courses = session.query(MajorCourse).count()
            
            return {
                'total_majors': total_majors,
                'total_requirements': total_requirements,
                'total_courses': total_courses
            }
        finally:
            session.close()
    
    def get_sample_classes(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get a sample of classes from the database"""
        session = self.get_session()
        try:
            classes = session.query(Class).limit(limit).all()
            return [
                {
                    'id': c.id,
                    'subject': c.subject,
                    'courseNumber': c.courseNumber,
                    'title': c.title,
                    'instructor': c.instructor
                }
                for c in classes
            ]
        finally:
            session.close() 