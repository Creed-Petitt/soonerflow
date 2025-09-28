import requests
import json
import time
import logging
from typing import Dict, List, Optional, Any
from scrapers.config.api_config import APIConfig, EndpointConfig
from scrapers.config.queries import QueryTemplates

class RateMyProfessorsAPIClient:

    def __init__(self):
        self.base_url = EndpointConfig.RATING_API
        self.headers = APIConfig.get_browser_headers()
        self.school_id = EndpointConfig.SCHOOL_ID
        self.logger = logging.getLogger(__name__)
    
    def fetch_all_professors(self, school_id: str = None) -> List[Dict[str, Any]]:
        try:
            if school_id is None:
                school_id = self.school_id

            # Get abstracted query and variables
            query = QueryTemplates.get_professors_search_query()
            variables = QueryTemplates.get_search_variables(school_id)

            response = requests.post(
                self.base_url,
                json={'query': query, 'variables': variables},
                headers=self.headers
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Debug: Check response structure
            if data is None:
                self.logger.error("Response returned None")
                return []
            
            # Navigate to the teachers array
            if 'data' in data and data['data'] and 'search' in data['data']:
                teachers = data['data']['search']['teachers']['edges']
                return teachers
            else:
                self.logger.error("Unexpected response structure from fetch_all_professors")
                return []
                
        except Exception as e:
            self.logger.error(f"Error fetching all professors: {e}")
            return []
    
    def fetch_professor_details(self, professor_id: str, num_ratings: int = 10) -> Optional[Dict[str, Any]]:
        try:
            # Determine how many ratings to fetch based on professor's total
            if num_ratings >= 15:
                ratings_to_fetch = 15
            elif num_ratings >= 10:
                ratings_to_fetch = 10
            else:
                ratings_to_fetch = 5
            
            query = QueryTemplates.get_professor_details_query(ratings_to_fetch)
            
            payload = {
                "query": query,
                "variables": {
                    "id": professor_id
                }
            }
            
            response = requests.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            # Check for errors first
            if 'errors' in data and data['errors']:
                self.logger.error(f"GraphQL errors: {data['errors']}")
                return None
            
            if 'data' in data and 'node' in data['data']:
                professor_data = data['data']['node']
                
                # Check if we need to paginate for more ratings
                ratings = professor_data.get('ratings', {}).get('edges', [])
                page_info = professor_data.get('ratings', {}).get('pageInfo', {})
                
                # Ensure ratings is a list
                if ratings is None:
                    ratings = []
                
                # If we have more pages and want more ratings, fetch them
                if page_info.get('hasNextPage') and len(ratings) < ratings_to_fetch:
                    additional_ratings = self._fetch_additional_ratings(
                        professor_id, ratings_to_fetch - len(ratings), page_info.get('endCursor')
                    )
                    if additional_ratings:
                        ratings.extend(additional_ratings)
                    professor_data['ratings']['edges'] = ratings
                
                return professor_data
            else:
                self.logger.error(f"No professor data found for ID: {professor_id}")
                return None
                
        except Exception as e:
            self.logger.error(f"Error fetching professor details: {e}")
            return None
    
    def _fetch_additional_ratings(self, professor_id: str, num_additional: int, cursor: str) -> List[Dict[str, Any]]:
        try:
            query = QueryTemplates.get_ratings_pagination_query(num_additional)
            
            payload = {
                "query": query,
                "variables": {
                    "id": professor_id,
                    "cursor": cursor
                }
            }
            
            response = requests.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and 'node' in data['data']:
                return data['data']['node'].get('ratings', {}).get('edges', [])
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error fetching additional ratings: {e}")
            return []
    
 