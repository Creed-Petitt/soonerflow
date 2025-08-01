import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

class DataProcessor:
    """Process raw API data into database-ready format"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def process_professor_data(self, raw_professor_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process raw professor data for database storage"""
        try:
            # Extract school information
            school = raw_professor_data.get('school', {})
            
            # Process teacher tags
            teacher_tags = raw_professor_data.get('teacherRatingTags', [])
            teacher_tags_json = json.dumps(teacher_tags) if teacher_tags else None
            
            # Process course codes
            course_codes = raw_professor_data.get('courseCodes', [])
            course_codes_json = json.dumps(course_codes) if course_codes else None
            
            # Process related teachers
            related_teachers = raw_professor_data.get('relatedTeachers', [])
            related_teachers_json = json.dumps(related_teachers) if related_teachers else None
            
            processed_data = {
                'id': raw_professor_data.get('id'),
                'legacyId': raw_professor_data.get('legacyId'),
                'firstName': raw_professor_data.get('firstName'),
                'lastName': raw_professor_data.get('lastName'),
                'department': raw_professor_data.get('department'),
                'departmentId': raw_professor_data.get('departmentId'),
                'lockStatus': raw_professor_data.get('lockStatus'),
                'isSaved': raw_professor_data.get('isSaved', False),
                'isProfCurrentUser': raw_professor_data.get('isProfCurrentUser', False),
                
                # School info
                'schoolName': school.get('name'),
                'schoolCity': school.get('city'),
                'schoolState': school.get('state'),
                'schoolCountry': 'US',  # Default for OU
                
                # Rating info
                'avgRating': raw_professor_data.get('avgRating'),
                'numRatings': raw_professor_data.get('numRatings', 0),
                'avgDifficulty': raw_professor_data.get('avgDifficulty'),
                'wouldTakeAgainPercent': raw_professor_data.get('wouldTakeAgainPercent'),
                
                # Rating distribution
                'ratingTotal': raw_professor_data.get('ratingTotal', 0),
                'ratingR1': raw_professor_data.get('ratingR1', 0),
                'ratingR2': raw_professor_data.get('ratingR2', 0),
                'ratingR3': raw_professor_data.get('ratingR3', 0),
                'ratingR4': raw_professor_data.get('ratingR4', 0),
                'ratingR5': raw_professor_data.get('ratingR5', 0),
                
                # JSON fields
                'teacherTags': teacher_tags_json,
                'courseCodes': course_codes_json,
                'relatedTeachers': related_teachers_json
            }
            
            return processed_data
            
        except Exception as e:
            self.logger.error(f"Error processing professor data: {e}")
            return {}
    
    def process_rating_data(self, raw_rating_data: Dict[str, Any], professor_id: str) -> Dict[str, Any]:
        """Process raw rating data for database storage"""
        try:
            # Process date
            date_str = raw_rating_data.get('date')
            processed_date = None
            if date_str:
                try:
                    # Try ISO format first
                    parsed_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    processed_date = parsed_date.isoformat()
                except Exception:
                    try:
                        # Try 'YYYY-MM-DD HH:MM:SS +0000 UTC' format
                        parsed_date = datetime.strptime(date_str.split(' +')[0], '%Y-%m-%d %H:%M:%S')
                        processed_date = parsed_date.isoformat()
                    except Exception:
                        self.logger.warning(f"Could not parse date: {date_str}")
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
            
        except Exception as e:
            self.logger.error(f"Error processing rating data: {e}")
            return {}
    
    def process_ratings_batch(self, ratings_data: List[Dict[str, Any]], professor_id: str) -> List[Dict[str, Any]]:
        """Process a batch of ratings for a professor"""
        processed_ratings = []
        
        for rating_data in ratings_data:
            processed_rating = self.process_rating_data(rating_data, professor_id)
            if processed_rating:
                processed_ratings.append(processed_rating)
        
        return processed_ratings
    
    def determine_rating_count(self, total_ratings: int) -> int:
        """Determine how many ratings to fetch based on total ratings"""
        if total_ratings >= 15:
            return 15
        elif total_ratings >= 10:
            return 10
        else:
            return 5 