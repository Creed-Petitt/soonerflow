import requests
import json
import time
import logging
import os
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv
from scrapers.config.api_config import APIConfig, EndpointConfig

load_dotenv()

class ClassNavAPIClient:
    def __init__(self):
        self.base_url = EndpointConfig.CLASSNAV_API
        self.headers = APIConfig.get_form_headers()
        self.logger = logging.getLogger(__name__)
    
    def fetch_classes(self, start_index: int = 0, length: int = 1000, semester: str = '202510') -> Optional[Dict[str, Any]]:
        try:
            # Get abstracted parameters
            params = APIConfig.get_pagination_params(start_index, length)
            params.update(APIConfig.get_search_params(semester))
            
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