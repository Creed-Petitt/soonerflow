import requests
import json
import time
import logging
from typing import Dict, List, Optional, Any

class ClassNavAPIClient:
    """Client for OU ClassNav API with pagination support"""
    
    def __init__(self):
        self.base_url = "https://classnav.ou.edu/index_ajax.php"
        self.headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.logger = logging.getLogger(__name__)
    
    def fetch_classes(self, start_index: int = 0, length: int = 1000, semester: str = '202510') -> Optional[Dict[str, Any]]:
        """Fetch classes from OU ClassNav API with pagination"""
        try:
            # Build parameters based on the JavaScript scraper
            params = {
                'sEcho': 1,
                'iColumns': 18,
                'sColumns': '',
                'iDisplayStart': start_index,
                'iDisplayLength': length,
                'mDataProp_0': 0, 'mDataProp_1': 1, 'mDataProp_2': 2, 'mDataProp_3': 3,
                'mDataProp_4': 4, 'mDataProp_5': 5, 'mDataProp_6': 6, 'mDataProp_7': 7,
                'mDataProp_8': 8, 'mDataProp_9': 9, 'mDataProp_10': 10, 'mDataProp_11': 11,
                'mDataProp_12': 12, 'mDataProp_13': 13, 'mDataProp_14': 14, 'mDataProp_15': 15,
                'mDataProp_16': 16, 'mDataProp_17': 17,
                'sSearch': '',
                'bRegex': False,
                'semester': semester,  # Spring 2025
                'subject_code': '',
                'subject': 'all',
                'schedule': 'all',
                'delivery': 'all',
                'gened': '',
                'term': 'all',
                'available': True,
                'waitlist': True,
                'iSortingCols': 0
            }
            
            # Add search parameters
            for i in range(18):
                params[f'sSearch_{i}'] = ''
                params[f'bRegex_{i}'] = False
                params[f'bSearchable_{i}'] = True
                params[f'bSortable_{i}'] = True
            
            response = requests.get(self.base_url, params=params, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Debug logging
            self.logger.debug(f"Fetched {len(data.get('aaData', []))} classes from index {start_index}")
            
            return data
            
        except Exception as e:
            self.logger.error(f"Error fetching classes: {e}")
            return None
    
    def fetch_all_classes(self, semester: str = '202510', batch_size: int = 1000) -> List[List[Any]]:
        """Fetch all classes for a semester with automatic pagination"""
        all_classes = []
        start_index = 0
        
        self.logger.info(f"Starting to fetch all classes for semester {semester}")
        
        while True:
            self.logger.info(f"Fetching classes starting from index {start_index}...")
            
            response = self.fetch_classes(start_index, batch_size, semester)
            if not response or not response.get('aaData') or len(response['aaData']) == 0:
                self.logger.info("No more classes to fetch.")
                break
            
            classes_batch = response['aaData']
            all_classes.extend(classes_batch)
            
            self.logger.info(f"Fetched {len(classes_batch)} classes (Total: {len(all_classes)})")
            
            # Check if we got fewer results than requested (end of data)
            if len(classes_batch) < batch_size:
                break
            
            start_index += batch_size
            
            # Add a small delay to be respectful to the server
            time.sleep(0.5)
        
        self.logger.info(f"Completed fetching all classes. Total: {len(all_classes)}")
        return all_classes 