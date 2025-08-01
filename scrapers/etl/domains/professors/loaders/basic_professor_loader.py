import requests
import json
import time
import os
import logging
from datetime import datetime
import subprocess
import sys

# Import universal config
project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..', '..', '..')
if project_root not in sys.path:
    sys.path.insert(0, project_root)
from config import Config, setup_environment

# Setup environment
setup_environment()

from basic_data_processor import DataProcessor

# Constants
GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"

# The exact working query from my browser
QUERY = '''
query TeacherSearchResultsPageQuery(
  $query: TeacherSearchQuery!
  $schoolID: ID
  $includeSchoolFilter: Boolean!
) {
  search: newSearch {
    ...TeacherSearchPagination_search_2MvZSr
  }
  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {
    __typename
    ... on School {
      name
      ...StickyHeaderContent_school
    }
    id
  }
}

fragment CardFeedback_teacher on Teacher {
  wouldTakeAgainPercent
  avgDifficulty
}

fragment CardName_teacher on Teacher {
  firstName
  lastName
}

fragment CardSchool_teacher on Teacher {
  department
  school {
    name
    id
  }
}

fragment CompareSchoolLink_school on School {
  legacyId
}

fragment HeaderDescription_school on School {
  name
  city
  state
  legacyId
  ...RateSchoolLink_school
  ...CompareSchoolLink_school
}

fragment HeaderRateButton_school on School {
  ...RateSchoolLink_school
  ...CompareSchoolLink_school
}

fragment RateSchoolLink_school on School {
  legacyId
}

fragment StickyHeaderContent_school on School {
  name
  ...HeaderDescription_school
  ...HeaderRateButton_school
}

fragment TeacherBookmark_teacher on Teacher {
  id
  isSaved
}

fragment TeacherCard_teacher on Teacher {
  id
  legacyId
  avgRating
  numRatings
  ...CardFeedback_teacher
  ...CardSchool_teacher
  ...CardName_teacher
  ...TeacherBookmark_teacher
}

fragment TeacherSearchPagination_search_2MvZSr on newSearch {
  teachers(query: $query, first: 100, after: "") {
    didFallback
    edges {
      cursor
      node {
        ...TeacherCard_teacher
        id
        __typename
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    resultCount
    filters {
      field
      options {
        value
        id
      }
    }
  }
}
'''

def setup_logging():
    """Set up logging for the professor loader"""
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Create professor loader specific log file
    log_filename = f'logs/professor_loader_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename),
            logging.StreamHandler()  # Also print to console
        ]
    )
    
    return logging.getLogger(__name__)

def fetch_all_ou_professors(max_professors=None):
    """Fetch ALL OU professors and save directly to database. If max_professors is set, only fetch up to that many."""
    
    # Headers that match my working browser request
    headers = {
        'authority': 'www.ratemyprofessors.com',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': 'null',
        'content-type': 'application/json',
        'origin': 'https://www.ratemyprofessors.com',
        'referer': 'https://www.ratemyprofessors.com/search/professors/1596?q=*&did=1',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
        'x-rmp-comp-id': 'DyzSUAEQZ5-20250728',
        'cookie': 'userSchoolId=U2Nob29sLTE1OTY=; userSchoolLegacyId=1596; userSchoolName=University%20of%20Oklahoma'
    }
    
    # Set up logging and data processor
    logger = setup_logging()
    data_processor = DataProcessor()
    
    all_professors = []
    page_count = 0
    after_cursor = ""  # Start with empty cursor
    total_saved = 0
    try:
        logger.info("Starting to fetch ALL OU professors and save to database...")
        
        while True:
            page_count += 1
            logger.info(f"Page {page_count}: Fetching professors...")
            
            # Variables for this page
            variables = {
                "query": {
                    "text": "",
                    "schoolID": "U2Nob29sLTE1OTY=",
                    "fallback": True
                },
                "schoolID": "U2Nob29sLTE1OTY=",
                "includeSchoolFilter": True
            }
            
            # Update the query to use the current cursor
            current_query = QUERY.replace('after: ""', f'after: "{after_cursor}"')
            
            payload = {
                'query': current_query,
                'variables': variables
            }
            
            response = requests.post(GRAPHQL_URL, headers=headers, json=payload)
        
            if response.status_code == 200:
                data = response.json()
                
                # Check for GraphQL errors
                if 'errors' in data:
                    logger.error("GraphQL Errors:")
                    for error in data['errors']:
                        logger.error(f"  {error}")
                    break
            
                # Extract professors data
                search_data = data.get('data', {}).get('search', {})
                teachers_data = search_data.get('teachers', {})
                
                if teachers_data:
                    professors = teachers_data.get('edges', [])
                    result_count = teachers_data.get('resultCount', 0)
                    page_info = teachers_data.get('pageInfo', {})
                    
                    logger.info(f"Found {len(professors)} professors on this page (Total: {result_count})")
                    logger.info(f"Has next page: {page_info.get('hasNextPage', False)}")
                    logger.info(f"End cursor: {page_info.get('endCursor', 'None')}")
                
                    # Extract professor data and save to database
                    for i, edge in enumerate(professors, 1):
                        if max_professors is not None and total_saved >= max_professors:
                            logger.info(f"TEST MODE: Stopping after {total_saved} professors")
                            return
                        professor = edge.get('node', {})
                        
                        name = f"{professor.get('firstName', '')} {professor.get('lastName', '')}".strip()
                        department = professor.get('department', 'Unknown')
                        rating = professor.get('avgRating', None)
                        difficulty = professor.get('avgDifficulty', None)
                        num_ratings = professor.get('numRatings', 0)
                        would_take_again = professor.get('wouldTakeAgainPercent', None)
                        professor_id = professor.get('id', 'Unknown')
                        legacy_id = professor.get('legacyId', None)
                        is_saved = professor.get('isSaved', False)
                        
                        # Get school info
                        school_data = professor.get('school', {})
                        school_name = school_data.get('name', 'University of Oklahoma')
                        
                        logger.info(f"  {len(all_professors) + i}. {name}")
                        logger.info(f"     ID: {professor_id}")
                        logger.info(f"     Department: {department}")
                        logger.info(f"     Rating: {rating}/5.0")
                        logger.info(f"     Difficulty: {difficulty}/5.0")
                        logger.info(f"     Number of Ratings: {num_ratings}")
                        logger.info(f"     Would Take Again: {would_take_again}%")
                        
                        # Process professor data for database
                        processed_professor = data_processor.process_professor_data(professor)
                        
                        # Save to database
                        if data_processor.save_to_database(processed_professor, 'professor'):
                            logger.info(f"     Successfully saved to database")
                            all_professors.append({
                                'id': professor_id,
                                'name': name,
                                'department': department,
                                'rating': rating,
                                'difficulty': difficulty,
                                'num_ratings': num_ratings,
                                'would_take_again': would_take_again,
                                'legacy_id': legacy_id,
                                'is_saved': is_saved
                            })
                            total_saved += 1
                        else:
                            logger.error(f"     Failed to save to database")
                    
                    # Check if there are more pages
                    if page_info.get('hasNextPage', False):
                        after_cursor = page_info.get('endCursor', '')
                        logger.info(f"Next cursor: {after_cursor}")
                        
                        # Add a small delay
                        time.sleep(0.5)
                    else:
                        logger.info("No more pages available.")
                        break
                        
                else:
                    logger.error("No professors data found in response")
                    break
            else:
                logger.error(f"HTTP Error: {response.status_code}")
                logger.error(f"Response: {response.text}")
                break
        
        logger.info(f"\n=== FINAL RESULTS ===")
        logger.info(f"Successfully collected and saved {len(all_professors)} professors to database")
        
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="OU Professor Loader")
    parser.add_argument('--test', action='store_true', help='Run in test mode (fetch only 10 professors)')
    args = parser.parse_args()
    if args.test:
        fetch_all_ou_professors(max_professors=10)
    else:
        fetch_all_ou_professors() 