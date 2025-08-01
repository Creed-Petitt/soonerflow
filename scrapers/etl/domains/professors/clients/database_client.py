import logging
import json
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import sys
import os

# Import universal config
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', '..', '..'))
from config import Config, setup_environment

# Setup environment
setup_environment()

from models import create_engine_and_session, Professor, Rating

class DatabaseClient:
    """Client for database operations using SQLAlchemy"""
    
    def __init__(self):
        self.engine, self.SessionLocal = create_engine_and_session()
        self.logger = logging.getLogger(__name__)
    
    def get_session(self) -> Session:
        """Get a database session"""
        return self.SessionLocal()
    
    def save_professor(self, professor_data: Dict[str, Any]) -> bool:
        """Save professor data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Check if professor already exists
            existing_professor = session.query(Professor).filter(Professor.id == professor_data['id']).first()
            if existing_professor:
                self.logger.info(f"Professor {professor_data['id']} already exists, skipping...")
                return True
            
            # Create new professor
            new_professor = Professor(
                id=professor_data['id'],
                legacyId=professor_data.get('legacyId'),
                firstName=professor_data['firstName'],
                lastName=professor_data['lastName'],
                department=professor_data.get('department'),
                departmentId=professor_data.get('departmentId'),
                lockStatus=professor_data.get('lockStatus'),
                isSaved=professor_data.get('isSaved', False),
                isProfCurrentUser=professor_data.get('isProfCurrentUser', False),
                schoolName=professor_data.get('schoolName'),
                schoolCity=professor_data.get('schoolCity'),
                schoolState=professor_data.get('schoolState'),
                schoolCountry=professor_data.get('schoolCountry'),
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
                teacherTags=json.dumps(professor_data.get('teacherTags', [])) if professor_data.get('teacherTags') else None,
                courseCodes=json.dumps(professor_data.get('courseCodes', [])) if professor_data.get('courseCodes') else None,
                relatedTeachers=json.dumps(professor_data.get('relatedTeachers', [])) if professor_data.get('relatedTeachers') else None
            )
            
            session.add(new_professor)
            session.commit()
            
            self.logger.info(f"Successfully saved professor: {professor_data.get('firstName', '')} {professor_data.get('lastName', '')}")
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
        """Save rating data to database using SQLAlchemy"""
        session = self.get_session()
        try:
            # Check if rating already exists
            existing_rating = session.query(Rating).filter(Rating.id == rating_data['id']).first()
            if existing_rating:
                self.logger.info(f"Rating {rating_data['id']} already exists, skipping...")
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
                ratingTags=json.dumps(rating_data.get('ratingTags', [])) if rating_data.get('ratingTags') else None,
                flagStatus=rating_data.get('flagStatus'),
                createdByUser=rating_data.get('createdByUser'),
                thumbsUpTotal=rating_data.get('thumbsUpTotal', 0),
                thumbsDownTotal=rating_data.get('thumbsDownTotal', 0),
                teacherNote=rating_data.get('teacherNote')
            )
            
            session.add(new_rating)
            session.commit()
            
            self.logger.info(f"Successfully saved rating for professor: {rating_data.get('professorId', '')}")
            return True
            
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving rating: {e}")
            return False
        finally:
            session.close()
    
    def get_qualified_professors(self, min_ratings: int = 10) -> List[Dict[str, Any]]:
        """Get professors from database that meet the minimum rating threshold"""
        session = self.get_session()
        try:
            professors = session.query(Professor).filter(
                Professor.numRatings >= min_ratings
            ).order_by(Professor.numRatings.desc()).all()
            
            return [
                {
                    'id': p.id,
                    'firstName': p.firstName,
                    'lastName': p.lastName,
                    'department': p.department,
                    'avgRating': p.avgRating,
                    'numRatings': p.numRatings,
                    'avgDifficulty': p.avgDifficulty,
                    'wouldTakeAgainPercent': p.wouldTakeAgainPercent
                }
                for p in professors
            ]
        except Exception as e:
            self.logger.error(f"Error getting qualified professors: {e}")
            return []
        finally:
            session.close()
    
    def professor_exists(self, professor_id: str) -> bool:
        """Check if professor already exists in database"""
        session = self.get_session()
        try:
            existing_professor = session.query(Professor).filter(Professor.id == professor_id).first()
            return existing_professor is not None
        except Exception as e:
            self.logger.error(f"Error checking if professor exists: {e}")
            return False
        finally:
            session.close()
    
    def get_professor_stats(self) -> Dict[str, Any]:
        """Get database statistics for professors"""
        session = self.get_session()
        try:
            total_professors = session.query(Professor).count()
            total_ratings = session.query(Rating).count()
            professors_with_ratings = session.query(Professor).filter(Professor.numRatings > 0).count()
            avg_rating = session.query(Professor.avgRating).filter(Professor.avgRating.isnot(None)).all()
            avg_rating = sum([r[0] for r in avg_rating]) / len(avg_rating) if avg_rating else 0
            
            return {
                'total_professors': total_professors,
                'total_ratings': total_ratings,
                'professors_with_ratings': professors_with_ratings,
                'average_rating': round(avg_rating, 2)
            }
        except Exception as e:
            self.logger.error(f"Error getting professor stats: {e}")
            return {}
        finally:
            session.close() 