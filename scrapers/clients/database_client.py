import logging
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from database.models import create_engine_and_session, Class, MeetingTime, Professor, Rating, Prerequisite

class SQLAlchemyDatabaseClient:
    def __init__(self):
        self.engine, self.SessionLocal = create_engine_and_session()
        self.logger = logging.getLogger(__name__)
    
    def get_session(self) -> Session:
        return self.SessionLocal()
    
    def save_class(self, class_data: Dict[str, Any], semester: str = "202510") -> bool:
        session = self.get_session()
        try:
            # Create ID with semester
            class_id_with_semester = f"{class_data['id']}-{semester}"
            
            # Check if class already exists
            existing_class = session.query(Class).filter(Class.id == class_id_with_semester).first()
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
                existing_class.semester = semester
                
                # Save prerequisites if they exist
                if class_data.get('prerequisites'):
                    self._save_prerequisites(session, class_id_with_semester, class_data)
                
                session.commit()
                return True
            
            # Create new class
            new_class = Class(
                id=class_id_with_semester,
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
                credits=class_data.get('credits', 3),
                availableSeats=class_data.get('availableSeats', 0),
                totalSeats=class_data.get('totalSeats', 0),
                semester=semester
            )
            
            session.add(new_class)
            session.commit()
            
            # Save prerequisites if they exist
            if class_data.get('prerequisites'):
                self._save_prerequisites(session, class_id_with_semester, class_data)
            
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
    
    def _save_prerequisites(self, session: Session, class_id: str, class_data: Dict[str, Any]):
        try:
            # Remove existing prerequisites for this class
            session.query(Prerequisite).filter(Prerequisite.class_id == class_id).delete()
            
            # Get already-parsed prerequisites from class data
            prerequisites = class_data.get('prerequisites', [])
            
            # Save each prerequisite
            for prereq_data in prerequisites:
                prerequisite = Prerequisite(
                    class_id=class_id,
                    prerequisite_subject=prereq_data['prerequisite_subject'],
                    prerequisite_number=prereq_data['prerequisite_number'],
                    prerequisite_type=prereq_data.get('prerequisite_type', 'required'),
                    prerequisite_group=prereq_data.get('prerequisite_group', 1),
                    raw_text=prereq_data.get('raw_text', '')
                )
                session.add(prerequisite)
            
            session.commit()
            
                
        except Exception as e:
            self.logger.error(f"Error saving prerequisites for class {class_id}: {e}")
            session.rollback()
    
    def save_meeting_time(self, meeting_time_data: Dict[str, Any], semester: str = "202510") -> bool:
        """Save meeting time data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Update classId to include semester
            class_id_with_semester = f"{meeting_time_data['classId']}-{semester}"
            
            # Create new meeting time
            new_meeting_time = MeetingTime(
                classId=class_id_with_semester,
                days=meeting_time_data.get('days'),
                startTime=meeting_time_data.get('startTime'),
                endTime=meeting_time_data.get('endTime'),
                location=meeting_time_data.get('location'),
                building=meeting_time_data.get('building'),
                room=meeting_time_data.get('room')
            )
            
            session.add(new_meeting_time)
            session.commit()
            
            return True
            
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving meeting time: {e}")
            return False
        finally:
            session.close()
     
    def class_exists(self, class_id: str) -> bool:
        session = self.get_session()
        try:
            existing_class = session.query(Class).filter(Class.id == class_id).first()
            return existing_class is not None
        finally:
            session.close()
    
    def get_class_stats(self) -> Dict[str, Any]:
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
    
    def get_sample_classes(self, limit: int = 5) -> List[Dict[str, Any]]:
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
    
    def save_professor(self, professor_data: Dict[str, Any]) -> bool:
        session = self.get_session()
        try:
            # Check if professor already exists and update with detailed data
            existing_professor = session.query(Professor).filter(Professor.id == professor_data['id']).first()
            if existing_professor:
                # Update existing professor with detailed data
                existing_professor.avgRating = professor_data.get('avgRating', existing_professor.avgRating)
                existing_professor.numRatings = professor_data.get('numRatings', existing_professor.numRatings)
                existing_professor.avgDifficulty = professor_data.get('avgDifficulty', existing_professor.avgDifficulty)
                existing_professor.wouldTakeAgainPercent = professor_data.get('wouldTakeAgainPercent', existing_professor.wouldTakeAgainPercent)
                existing_professor.ratingTotal = professor_data.get('ratingTotal', existing_professor.ratingTotal)
                existing_professor.ratingR1 = professor_data.get('ratingR1', existing_professor.ratingR1)
                existing_professor.ratingR2 = professor_data.get('ratingR2', existing_professor.ratingR2) 
                existing_professor.ratingR3 = professor_data.get('ratingR3', existing_professor.ratingR3)
                existing_professor.ratingR4 = professor_data.get('ratingR4', existing_professor.ratingR4)
                existing_professor.ratingR5 = professor_data.get('ratingR5', existing_professor.ratingR5)
                existing_professor.teacherTags = professor_data.get('teacherTags', existing_professor.teacherTags)
                existing_professor.courseCodes = professor_data.get('courseCodes', existing_professor.courseCodes)
                session.commit()
                return True
            
            # Create new professor
            new_professor = Professor(
                id=professor_data['id'],
                firstName=professor_data['firstName'],
                lastName=professor_data['lastName'],
                department=professor_data.get('department'),
                avgRating=professor_data.get('avgRating'),
                numRatings=professor_data.get('numRatings', 0),
                avgDifficulty=professor_data.get('avgDifficulty'),
                wouldTakeAgainPercent=professor_data.get('wouldTakeAgainPercent'),
                ratingTotal=professor_data.get('ratingTotal', 0),
                ratingR1=professor_data.get('ratingR1', 0),
                ratingR2=professor_data.get('ratingR2', 0),
                ratingR3=professor_data.get('ratingR3', 0),
                ratingR4=professor_data.get('ratingR4', 0),
                ratingR5=professor_data.get('ratingR5', 0),
                teacherTags=professor_data.get('teacherTags'),
                courseCodes=professor_data.get('courseCodes')
            )
            
            session.add(new_professor)
            session.commit()
            
            return True
            
        except IntegrityError as e:
            session.rollback()
            self.logger.warning(f"Professor {professor_data.get('id', 'Unknown')} already exists: {e}")
            return True  # Consider this a success since the data exists
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving professor: {e}")
            return False
        finally:
            session.close()
    
    def save_rating(self, rating_data: Dict[str, Any]) -> bool:
        session = self.get_session()
        try:
            # Check if rating already exists
            existing_rating = session.query(Rating).filter(Rating.id == rating_data['id']).first()
            if existing_rating:
                return True
            
            # Create new rating
            new_rating = Rating(
                id=rating_data['id'],
                legacyId=rating_data.get('legacyId'),
                professorId=rating_data['professorId'],
                comment=rating_data.get('comment'),
                class_=rating_data.get('class'),
                difficultyRating=rating_data.get('difficultyRating'),
                clarityRating=rating_data.get('clarityRating'),
                helpfulRating=rating_data.get('helpfulRating'),
                wouldTakeAgain=rating_data.get('wouldTakeAgain'),
                grade=rating_data.get('grade'),
                attendanceMandatory=rating_data.get('attendanceMandatory'),
                textbookUse=rating_data.get('textbookUse'),
                isForOnlineClass=rating_data.get('isForOnlineClass'),
                isForCredit=rating_data.get('isForCredit'),
                ratingTags=rating_data.get('ratingTags'),
                flagStatus=rating_data.get('flagStatus'),
                createdByUser=rating_data.get('createdByUser'),
                thumbsUpTotal=rating_data.get('thumbsUpTotal', 0),
                thumbsDownTotal=rating_data.get('thumbsDownTotal', 0)
            )
            
            session.add(new_rating)
            session.commit()
            
            return True
            
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving rating: {e}")
            return False
        finally:
            session.close() 