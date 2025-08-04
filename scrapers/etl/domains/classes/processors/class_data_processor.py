import json
import logging
from typing import Dict, List, Any, Optional

class ClassDataProcessor:
    """Process raw class data into database-ready format"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Field mapping based on actual API response
        self.FIELD_MAPPING = {
            1: 'class_id',
            2: 'subject', 
            3: 'course_number',
            4: 'section',
            5: 'title',
            6: 'instructor',
            7: 'type',
            8: 'delivery',
            9: 'gen_ed',
            10: 'term',
            11: 'dates',
            12: 'credit_hours',
            13: 'meeting_times',
            14: 'description',
            15: 'all_instructors',
            17: 'exam_info',
            18: 'repeatability',
            19: 'additional_info'
        }
    
    def parse_meeting_times(self, meeting_string: str) -> List[Dict[str, Any]]:
        """Parse meeting times string into structured data"""
        if not meeting_string or meeting_string.strip() == '':
            return []
        
        meeting_times = []
        
        # Split by # to handle multiple meeting times
        time_blocks = meeting_string.split('#')
        
        for time_block in time_blocks:
            time_block = time_block.strip()
            if not time_block:
                continue
                
            # Example: "Aug 25 , Dec 12 , 10:00 am , 10:50 am , Felgar Hall , 300 , MWF , CLAS"
            parts = [p.strip() for p in time_block.split(' , ')]
            
            if len(parts) < 7:
                continue
            
            start_time = parts[2]
            end_time = parts[3]
            building = parts[4]
            room = parts[5]
            days = parts[6]
            
            meeting_times.append({
                'days': days,
                'startTime': start_time,
                'endTime': end_time,
                'location': f"{building} {room}",
                'building': building,
                'room': room
            })
        
        return meeting_times
    
    def parse_class_data(self, class_array: List[Any]) -> Dict[str, Any]:
        """Convert API array to structured class object"""
        class_data = {}
        
        for index, field in self.FIELD_MAPPING.items():
            value = class_array[int(index)] if int(index) < len(class_array) else None
            if value and value != '' and value is not None:
                class_data[field] = value
        
        return {
            'id': class_data.get('class_id'),
            'subject': class_data.get('subject', ''),
            'courseNumber': class_data.get('course_number', ''),
            'section': class_data.get('section', ''),
            'title': class_data.get('title', ''),
            'description': class_data.get('description'),
            'instructor': class_data.get('instructor'),
            'allInstructors': class_data.get('all_instructors'),
            'type': class_data.get('type'),
            'delivery': class_data.get('delivery'),
            'genEd': class_data.get('gen_ed'),
            'term': class_data.get('term'),
            'semesterDates': class_data.get('dates'),
            'examInfo': class_data.get('exam_info'),
            'repeatability': class_data.get('repeatability'),
            'credits': int(class_data.get('credit_hours', 3)) if class_data.get('credit_hours') and class_data.get('credit_hours').isdigit() else 3,
            'meetingTimes': self.parse_meeting_times(class_data.get('meeting_times', ''))
        }
    
    def process_class_data(self, raw_class_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process raw class data for database storage"""
        try:
            # Extract meeting times
            meeting_times = raw_class_data.get('meetingTimes', [])
            
            # Process class data
            processed_data = {
                'id': raw_class_data.get('id'),
                'subject': raw_class_data.get('subject'),
                'courseNumber': raw_class_data.get('courseNumber'),
                'section': raw_class_data.get('section'),
                'title': raw_class_data.get('title'),
                'description': raw_class_data.get('description'),
                'instructor': raw_class_data.get('instructor'),
                'allInstructors': raw_class_data.get('allInstructors'),
                'type': raw_class_data.get('type'),
                'delivery': raw_class_data.get('delivery'),
                'genEd': raw_class_data.get('genEd'),
                'term': raw_class_data.get('term'),
                'semesterDates': raw_class_data.get('semesterDates'),
                'examInfo': raw_class_data.get('examInfo'),
                'repeatability': raw_class_data.get('repeatability'),
                'credits': raw_class_data.get('credits', 3)
            }
            
            return processed_data
            
        except Exception as e:
            self.logger.error(f"Error processing class data: {e}")
            return {}
    
    def process_meeting_time_data(self, raw_meeting_time_data: Dict[str, Any], class_id: str) -> Dict[str, Any]:
        """Process raw meeting time data for database storage"""
        try:
            processed_data = {
                'classId': class_id,
                'days': raw_meeting_time_data.get('days'),
                'startTime': raw_meeting_time_data.get('startTime'),
                'endTime': raw_meeting_time_data.get('endTime'),
                'location': raw_meeting_time_data.get('location'),
                'building': raw_meeting_time_data.get('building'),
                'room': raw_meeting_time_data.get('room')
            }
            
            return processed_data
            
        except Exception as e:
            self.logger.error(f"Error processing meeting time data: {e}")
            return {}
    
    def process_meeting_times_batch(self, meeting_times_data: List[Dict[str, Any]], class_id: str) -> List[Dict[str, Any]]:
        """Process a batch of meeting times for a class"""
        processed_meeting_times = []
        
        for meeting_time_data in meeting_times_data:
            processed_meeting_time = self.process_meeting_time_data(meeting_time_data, class_id)
            if processed_meeting_time:
                processed_meeting_times.append(processed_meeting_time)
        
        return processed_meeting_times
    
    def process_classes_batch(self, classes_data: List[List[Any]]) -> List[Dict[str, Any]]:
        """Process a batch of raw class arrays"""
        processed_classes = []
        
        for class_array in classes_data:
            try:
                # Parse the raw array into structured data
                parsed_class = self.parse_class_data(class_array)
                
                if parsed_class.get('id'):
                    processed_classes.append(parsed_class)
                else:
                    self.logger.warning(f"Skipping class without ID: {class_array}")
                    
            except Exception as e:
                self.logger.error(f"Error processing class array: {e}")
                continue
        
        return processed_classes
    
    def validate_class_data(self, class_data: Dict[str, Any]) -> bool:
        """Validate that class data has required fields"""
        required_fields = ['id', 'subject', 'courseNumber', 'section', 'title']
        
        for field in required_fields:
            if not class_data.get(field):
                self.logger.warning(f"Missing required field '{field}' in class data")
                return False
        
        return True
    
    def validate_meeting_time_data(self, meeting_time_data: Dict[str, Any]) -> bool:
        """Validate that meeting time data has required fields"""
        required_fields = ['classId', 'days', 'startTime', 'endTime']
        
        for field in required_fields:
            if not meeting_time_data.get(field):
                self.logger.warning(f"Missing required field '{field}' in meeting time data")
                return False
        
        return True 