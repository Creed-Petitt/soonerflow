import logging
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import sys
import os
# Get the path to the database directory (three levels up from current file)
current_dir = os.path.dirname(os.path.abspath(__file__))
database_path = os.path.abspath(os.path.join(current_dir, '..', '..', '..', 'database'))
sys.path.append(database_path)
print(f"Database path: {database_path}")
print(f"Python path: {sys.path}")
from models import create_engine_and_session, Class, MeetingTime

class ClassDatabaseClient:
    """Client for class database operations using SQLAlchemy"""
    
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
                self.logger.info(f"Class {class_data['id']} already exists, skipping...")
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
                additionalInfo=class_data.get('additionalInfo')
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
        except Exception as e:
            self.logger.error(f"Error getting class stats: {e}")
            return {}
        finally:
            session.close()
    
    def class_exists(self, class_id: str) -> bool:
        """Check if class already exists in database"""
        session = self.get_session()
        try:
            existing_class = session.query(Class).filter(Class.id == class_id).first()
            return existing_class is not None
        except Exception as e:
            self.logger.error(f"Error checking if class exists: {e}")
            return False
        finally:
            session.close()
    
    def get_sample_classes(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get sample classes with meeting times for testing"""
        session = self.get_session()
        try:
            classes = session.query(Class).filter(
                Class.instructor.isnot(None)
            ).limit(limit).all()
            
            return [
                {
                    'id': c.id,
                    'subject': c.subject,
                    'courseNumber': c.courseNumber,
                    'title': c.title,
                    'instructor': c.instructor,
                    'meetingTimes': [
                        {
                            'days': mt.days,
                            'startTime': mt.startTime,
                            'endTime': mt.endTime,
                            'location': mt.location
                        }
                        for mt in c.meetingTimes
                    ]
                }
                for c in classes
            ]
        except Exception as e:
            self.logger.error(f"Error getting sample classes: {e}")
            return []
        finally:
            session.close() 