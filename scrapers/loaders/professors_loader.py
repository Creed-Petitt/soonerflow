import requests
import os
import logging
import time
from dotenv import load_dotenv

load_dotenv('./scrapers/.env')

from scrapers.clients.professors_client import RateMyProfessorsAPIClient
from scrapers.processors.professors_processor import ProfessorDataProcessor
from scrapers.clients.database_client import SQLAlchemyDatabaseClient
from scrapers.config.api_config import APIConfig, EndpointConfig
from scrapers.config.queries import QueryTemplates

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler()]
    )
    return logging.getLogger(__name__)

def fetch_basic_professors(logger):
    logger.info("Fetching basic professor data...")
    
    all_teachers = []
    has_next_page = True
    after_cursor = None
    
    headers = APIConfig.get_browser_headers()
    query_template = QueryTemplates.get_professors_search_query()

    if not all([EndpointConfig.RATING_API, EndpointConfig.SCHOOL_ID, query_template]):
        logger.error("API endpoint, school ID, or query template is not configured. Aborting.")
        return []

    while has_next_page:
        variables = QueryTemplates.get_search_variables(EndpointConfig.SCHOOL_ID)
        variables['after'] = after_cursor

        try:
            response = requests.post(
                EndpointConfig.RATING_API,
                json={'query': query_template, 'variables': variables},
                headers=headers
            )
            response.raise_for_status()
            data = response.json()

            if 'data' in data and data['data'] and 'search' in data['data']:
                search_results = data['data']['search']['teachers']
                if search_results and 'edges' in search_results:
                    all_teachers.extend(search_results['edges'])
                    page_info = search_results.get('pageInfo', {})
                    has_next_page = page_info.get('hasNextPage', False)
                    after_cursor = page_info.get('endCursor')
                    logger.info(f"Fetched a page of {len(search_results['edges'])} professors. Total: {len(all_teachers)}. More pages: {has_next_page}")
                else:
                    has_next_page = False
            else:
                logger.error(f"Unexpected response structure: {data}")
                has_next_page = False

        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            has_next_page = False
            
    logger.info(f"Successfully fetched a total of {len(all_teachers)} professors.")
    return all_teachers

def load_professors_to_database(test_mode: bool = True, detailed_mode: bool = False, min_ratings: int = 10):
    logger = setup_logging()
    data_processor = ProfessorDataProcessor()
    db_client = SQLAlchemyDatabaseClient()
    api_client = RateMyProfessorsAPIClient()
    
    logger.info("STARTING PROFESSOR LOADER")
    logger.info(f"Test mode: {test_mode}, Detailed mode: {detailed_mode}, Min ratings: {min_ratings}")
    
    teachers = fetch_basic_professors(logger)
    
    if not teachers:
        logger.error("No professors fetched. Exiting.")
        return
    
    if test_mode:
        teachers = teachers[:5]

    logger.info(f"Processing {len(teachers)} professors...")
    
    successful_saves, failed_saves = 0, 0
    
    for i, teacher_edge in enumerate(teachers, 1):
        try:
            teacher = teacher_edge['node']
            processed_prof = data_processor.process_professor_data(teacher)
            if processed_prof and data_processor.validate_professor_data(processed_prof):
                if db_client.save_professor(processed_prof):
                    successful_saves += 1
                else:
                    failed_saves += 1
            else:
                failed_saves += 1
        except Exception as e:
            logger.error(f"Error processing professor at index {i}: {e}")
            failed_saves += 1
    
    logger.info(f"\nBASIC LOADING RESULTS: {successful_saves} successful, {failed_saves} failed.")
    
    if detailed_mode:
        logger.info("\nSTARTING DETAILED LOADING")
        # ... (detailed loading logic remains the same but will use the generic clients)
    
    logger.info("\nPROFESSOR LOADING COMPLETE")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Load professor data from a ratings API.')
    parser.add_argument('--test', action='store_true', help='Run in test mode (small sample)')
    parser.add_argument('--full', action='store_true', help='Run in full mode (all professors)')
    parser.add_argument('--detailed', action='store_true', help='Also fetch detailed ratings data')
    parser.add_argument('--min-ratings', type=int, default=10, help='Minimum number of ratings for detailed fetch')
    
    args = parser.parse_args()
    
    load_professors_to_database(test_mode=not args.full, detailed_mode=args.detailed, min_ratings=args.min_ratings)