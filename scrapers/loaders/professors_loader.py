"""
Combined Professor Loader - Fetches basic and detailed professor data from RateMyProfessors
"""

import requests
import json
import time
import os
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

# Import our modules
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scrapers.clients.professors_client import RateMyProfessorsAPIClient
from scrapers.processors.professors_processor import ProfessorDataProcessor
from scrapers.clients.database_client import SQLAlchemyDatabaseClient

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

fragment CardRatings_teacher on Teacher {
  avgRating
  numRatings
  ...CardFeedback_teacher
}

fragment CardSchool_teacher on Teacher {
  department
  school {
    name
    id
  }
}

fragment CardTeacherInfo_teacher on Teacher {
  ...CardName_teacher
  ...CardRatings_teacher
  ...CardSchool_teacher
  ...TeacherBookmark_teacher
}

fragment NewSearchResultsPageQuery_search on newSearch {
  teachers(query: $query, first: 8, after: "") {
    didFallback
    edges {
      cursor
      node {
        ...CardTeacherInfo_teacher
        id
        __typename
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    resultCount
  }
}

fragment StickyHeaderContent_school on School {
  name
}

fragment TeacherBookmark_teacher on Teacher {
  id
  isSaved
}

fragment TeacherSearchPagination_search_2MvZSr on newSearch {
  ...NewSearchResultsPageQuery_search
  teachers(query: $query, first: 1000, after: "") {
    edges {
      cursor
      node {
        ...CardTeacherInfo_teacher
        id
        __typename
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    resultCount
  }
}
'''

def setup_logging():
    """Setup logging for the professor loader"""
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

def fetch_basic_professors():
    """Fetch all professors from OU (School ID: U2Nob29sLTkyNA==)"""
    
    logger = setup_logging()
    logger.info("Fetching all OU professors from RateMyProfessors...")
    
    variables = {
        "query": {
            "text": "",
            "schoolID": "U2Nob29sLTkyNA==",  # OU school ID
            "fallback": True,
            "departmentID": None
        },
        "schoolID": "U2Nob29sLTkyNA==",
        "includeSchoolFilter": True
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic dGVzdDp0ZXN0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.post(
        GRAPHQL_URL,
        json={'query': QUERY, 'variables': variables},
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        
        # Navigate to the teachers array
        if 'data' in data and 'search' in data['data']:
            teachers = data['data']['search']['teachers']['edges']
            logger.info(f"Successfully fetched {len(teachers)} professors")
            return teachers
        else:
            logger.error("Unexpected response structure")
            return []
    else:
        logger.error(f"Request failed with status code: {response.status_code}")
        return []

def load_professors_to_database(test_mode: bool = True, detailed_mode: bool = False):
    """Load professors from RateMyProfessors to database"""
    
    # Setup clients and logging
    logger = setup_logging()
    data_processor = ProfessorDataProcessor()
    db_client = SQLAlchemyDatabaseClient()
    api_client = RateMyProfessorsAPIClient()
    
    logger.info("=== STARTING PROFESSOR LOADER ===")
    logger.info(f"Test mode: {test_mode}")
    logger.info(f"Detailed mode: {detailed_mode}")
    
    # Phase 1: Fetch and save basic professor data
    teachers = fetch_basic_professors()
    
    if not teachers:
        logger.error("No professors fetched. Exiting.")
        return
    
    if test_mode:
        logger.info("TEST MODE: Processing only first 5 professors")
        teachers = teachers[:5]
    
    logger.info(f"Processing {len(teachers)} professors...")
    
    successful_saves = 0
    failed_saves = 0
    
    for i, teacher_edge in enumerate(teachers, 1):
        try:
            teacher = teacher_edge['node']
            
            # Process the professor data
            processed_prof = data_processor.process_professor_data(teacher)
            
            if processed_prof and data_processor.validate_professor_data(processed_prof):
                # Save to database
                if db_client.save_professor(processed_prof):
                    successful_saves += 1
                    logger.info(f"Saved professor {i}/{len(teachers)}: {processed_prof['firstName']} {processed_prof['lastName']}")
                else:
                    failed_saves += 1
                    logger.error(f"Failed to save professor: {processed_prof.get('id', 'Unknown')}")
            else:
                logger.warning(f"Invalid professor data at index {i}")
                failed_saves += 1
                
        except Exception as e:
            logger.error(f"Error processing professor at index {i}: {e}")
            failed_saves += 1
    
    logger.info(f"\n=== BASIC LOADING RESULTS ===")
    logger.info(f"Total professors processed: {len(teachers)}")
    logger.info(f"Successfully saved: {successful_saves}")
    logger.info(f"Failed to save: {failed_saves}")
    
    # Phase 2: Fetch detailed data if requested
    if detailed_mode:
        logger.info("\n=== STARTING DETAILED LOADING ===")
        
        # Get professors with enough ratings for detailed fetching
        session = db_client.get_session()
        try:
            from database.models import Professor
            qualified_professors = session.query(Professor).filter(
                Professor.numRatings >= 10
            ).all()
            
            logger.info(f"Found {len(qualified_professors)} professors with >= 10 ratings")
            
            if test_mode:
                qualified_professors = qualified_professors[:3]
                logger.info("TEST MODE: Processing only 3 professors for detailed data")
            
            detailed_success = 0
            detailed_failed = 0
            total_ratings_saved = 0
            
            for i, professor in enumerate(qualified_professors, 1):
                try:
                    logger.info(f"\nFetching detailed data for {professor.firstName} {professor.lastName}")
                    
                    # Determine how many ratings to fetch
                    num_ratings = min(15, professor.numRatings)
                    
                    # Fetch detailed data
                    detailed_prof = api_client.fetch_professor_details(professor.id, num_ratings)
                    
                    if detailed_prof:
                        # Process the detailed data
                        processed_detailed = data_processor.process_professor_data(detailed_prof)
                        
                        if processed_detailed:
                            # Update professor with detailed data
                            if db_client.save_professor(processed_detailed):
                                detailed_success += 1
                                
                                # Process and save ratings
                                ratings = detailed_prof.get('ratings', {}).get('edges', [])
                                ratings_saved = 0
                                
                                for rating_edge in ratings:
                                    try:
                                        rating = rating_edge.get('node')
                                        if rating:
                                            processed_rating = data_processor.process_rating_data(rating, professor.id)
                                            if processed_rating and db_client.save_rating(processed_rating):
                                                ratings_saved += 1
                                    except Exception as e:
                                        logger.error(f"Error saving rating: {e}")
                                
                                total_ratings_saved += ratings_saved
                                logger.info(f"Saved {ratings_saved} ratings for {professor.firstName} {professor.lastName}")
                            else:
                                detailed_failed += 1
                    
                    # Add delay to be respectful to the API
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Error processing detailed data for professor: {e}")
                    detailed_failed += 1
            
            logger.info(f"\n=== DETAILED LOADING RESULTS ===")
            logger.info(f"Professors with detailed data: {detailed_success}")
            logger.info(f"Failed detailed fetches: {detailed_failed}")
            logger.info(f"Total ratings saved: {total_ratings_saved}")
            
        finally:
            session.close()
    
    logger.info("\n=== PROFESSOR LOADING COMPLETE ===")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Load OU professor data from RateMyProfessors')
    parser.add_argument('--test', action='store_true', help='Run in test mode (small sample)')
    parser.add_argument('--full', action='store_true', help='Run in full mode (all professors)')
    parser.add_argument('--detailed', action='store_true', help='Also fetch detailed ratings data')
    
    args = parser.parse_args()
    
    if args.full:
        load_professors_to_database(test_mode=False, detailed_mode=args.detailed)
    else:
        # Default to test mode
        load_professors_to_database(test_mode=True, detailed_mode=args.detailed)