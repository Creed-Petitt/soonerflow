import json
import os
import sys
from typing import Dict, Any, List, Optional
from datetime import datetime

# Import universal config
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', '..', '..'))
from config import Config, setup_environment

# Setup environment
setup_environment()

from database_client import DatabaseClient

class DataProcessor:
    """Processes scraped data and prepares it for database storage"""
    
    def __init__(self):
        # Initialize SQLAlchemy database client
        self.db_client = DatabaseClient()
        
    def process_professor_data(self, raw_professor_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process raw professor data from scraping into database format"""
        
        # Extract basic info
        professor_id = raw_professor_data.get('id')
        first_name = raw_professor_data.get('firstName', '')
        last_name = raw_professor_data.get('lastName', '')
        department = raw_professor_data.get('department', 'Unknown')
        
        # Process school info
        school_data = raw_professor_data.get('school', {})
        school_name = school_data.get('name', 'University of Oklahoma')
        school_city = school_data.get('city')
        school_state = school_data.get('state')
        school_country = school_data.get('country')
        
        # Process rating distribution
        ratings_dist = raw_professor_data.get('ratingsDistribution', {})
        rating_total = ratings_dist.get('total', 0)
        rating_r1 = ratings_dist.get('r1', 0)
        rating_r2 = ratings_dist.get('r2', 0)
        rating_r3 = ratings_dist.get('r3', 0)
        rating_r4 = ratings_dist.get('r4', 0)
        rating_r5 = ratings_dist.get('r5', 0)
        
        # Process teacher tags - convert to comma-separated string
        teacher_tags_raw = raw_professor_data.get('teacherRatingTags', [])
        teacher_tags_string = ""
        if teacher_tags_raw and isinstance(teacher_tags_raw, list):
            # Extract tagName from each tag object and join with commas
            tag_names = [tag.get('tagName', '') for tag in teacher_tags_raw if tag.get('tagName')]
            teacher_tags_string = ','.join(tag_names)
        
        # Process course codes
        course_codes = raw_professor_data.get('courseCodes', [])
        
        # Process related teachers
        related_teachers = raw_professor_data.get('relatedTeachers', [])
        
        # Prepare processed data
        processed_data = {
            'id': professor_id,
            'legacyId': raw_professor_data.get('legacyId'),
            'firstName': first_name,
            'lastName': last_name,
            'department': department,
            'departmentId': raw_professor_data.get('departmentId'),
            'lockStatus': raw_professor_data.get('lockStatus'),
            'isSaved': raw_professor_data.get('isSaved', False),
            'isProfCurrentUser': raw_professor_data.get('isProfCurrentUser', False),
            
            # School info
            'schoolName': school_name,
            'schoolCity': school_city,
            'schoolState': school_state,
            'schoolCountry': school_country,
            
            # Rating info
            'avgRating': raw_professor_data.get('avgRating'),
            'numRatings': raw_professor_data.get('numRatings', 0),
            'avgDifficulty': raw_professor_data.get('avgDifficulty'),
            'wouldTakeAgainPercent': raw_professor_data.get('wouldTakeAgainPercent'),
            
            # Rating distribution
            'ratingTotal': rating_total,
            'ratingR1': rating_r1,
            'ratingR2': rating_r2,
            'ratingR3': rating_r3,
            'ratingR4': rating_r4,
            'ratingR5': rating_r5,
            
            # Teacher tags as comma-separated string
            'teacherTags': teacher_tags_string,
            'courseCodes': course_codes,
            'relatedTeachers': related_teachers
        }
        
        return processed_data
    
    def process_rating_data(self, raw_rating_data: Dict[str, Any], professor_id: str) -> Dict[str, Any]:
        """Process raw rating data from scraping into database format"""
        
        # Process date
        date_str = raw_rating_data.get('date')
        processed_date = None
        if date_str:
            try:
                # Handle different date formats
                if 'UTC' in date_str:
                    processed_date = datetime.strptime(date_str.split(' UTC')[0], '%Y-%m-%d %H:%M:%S')
                else:
                    processed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except:
                processed_date = None
        
        # Process boolean fields
        would_take_again = raw_rating_data.get('wouldTakeAgain')
        if would_take_again is not None:
            would_take_again = bool(would_take_again)
        
        attendance_mandatory = raw_rating_data.get('attendanceMandatory')
        if attendance_mandatory == 'mandatory':
            attendance_mandatory = True
        elif attendance_mandatory == 'not_mandatory':
            attendance_mandatory = False
        else:
            attendance_mandatory = None
        
        # Process textbookUse - convert to boolean
        textbook_use = raw_rating_data.get('textbookUse')
        if textbook_use is not None:
            # Convert numeric values to boolean
            if isinstance(textbook_use, (int, float)):
                if textbook_use > 0:
                    textbook_use = True
                else:
                    textbook_use = False
            else:
                textbook_use = bool(textbook_use)
        else:
            textbook_use = None
        
        # Process rating tags
        rating_tags = raw_rating_data.get('ratingTags')
        if rating_tags and isinstance(rating_tags, str):
            rating_tags = rating_tags.split('--')
        
        processed_data = {
            'id': raw_rating_data.get('id'),
            'legacyId': raw_rating_data.get('legacyId'),
            'professorId': professor_id,
            
            # Rating data
            'comment': raw_rating_data.get('comment'),
            'date': processed_date,
            'class': raw_rating_data.get('class'),
            
            # Individual ratings
            'difficultyRating': raw_rating_data.get('difficultyRating'),
            'clarityRating': raw_rating_data.get('clarityRating'),
            'helpfulRating': raw_rating_data.get('helpfulRating'),
            
            # Course meta
            'wouldTakeAgain': would_take_again,
            'grade': raw_rating_data.get('grade'),
            'attendanceMandatory': attendance_mandatory,
            'textbookUse': textbook_use,
            'isForOnlineClass': raw_rating_data.get('isForOnlineClass'),
            'isForCredit': raw_rating_data.get('isForCredit'),
            
            # Tags and flags
            'ratingTags': rating_tags,
            'flagStatus': raw_rating_data.get('flagStatus'),
            'createdByUser': raw_rating_data.get('createdByUser'),
            
            # Thumbs up/down
            'thumbsUpTotal': raw_rating_data.get('thumbsUpTotal', 0),
            'thumbsDownTotal': raw_rating_data.get('thumbsDownTotal', 0),
            
            # Professor response
            'teacherNote': raw_rating_data.get('teacherNote')
        }
        
        return processed_data
    
    def determine_rating_count(self, total_ratings: int) -> int:
        """Determine how many ratings to fetch based on total ratings"""
        if total_ratings >= 15:
            return 15
        elif total_ratings >= 10:
            return 10
        else:
            return 5
    
    def save_to_database(self, data: Dict[str, Any], data_type: str = 'professor') -> bool:
        """Save processed data to database using SQLAlchemy"""
        
        try:
            if data_type == 'professor':
                return self.db_client.save_professor(data)
            elif data_type == 'rating':
                return self.db_client.save_rating(data)
            else:
                print(f"Unknown data type: {data_type}")
                return False
                
        except Exception as e:
            print(f"Error in save_to_database: {e}")
            return False 