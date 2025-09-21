"""
Class Loader - Fetches and loads OU class data from ClassNav API
"""

import os
import sys
import logging
from datetime import datetime
from typing import List, Dict, Any

# Import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scrapers.clients.classes_client import ClassNavAPIClient
from scrapers.processors.classes_processor import ClassDataProcessor
from scrapers.clients.database_client import SQLAlchemyDatabaseClient

def setup_logging():
    """Set up logging for the class loader"""
    # Configure logging to stdout only (cloud providers will capture this)
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()  # Only print to console/stdout
        ]
    )
    
    return logging.getLogger(__name__)

def load_classes_to_database(test_mode: bool = True, semester: str = '202510'):
    """Load classes from OU API to database"""
    
    # Set up logging and clients
    logger = setup_logging()
    api_client = ClassNavAPIClient()
    db_client = SQLAlchemyDatabaseClient()
    data_processor = ClassDataProcessor()
    
    try:
        logger.info("Starting to load OU class data to database...")
        
        if test_mode:
            # Fetch a small sample for testing (offset 0 has classes with full meeting times)
            raw_classes = api_client.fetch_classes(0, 100, semester)
            if raw_classes and raw_classes.get('aaData'):
                classes_data = raw_classes['aaData']
            else:
                logger.error("Failed to fetch test data")
                return
        else:
            # Fetch all classes
            classes_data = api_client.fetch_all_classes(semester)
        
        logger.info(f"Processing {len(classes_data)} classes...")
        
        # Process the raw class data
        processed_classes = data_processor.process_classes_batch(classes_data)
        
        # Filter classes based on criteria
        filtered_classes = []
        for class_data in processed_classes:
            delivery = class_data.get('delivery', '')
            class_type = class_data.get('type', '')
            
            # Include Traditional In-Person, Asynchronous Online, and Synchronous Web
            if delivery in ['Traditional In-Person', 'Asynchronous Online', 'Synchronous Web']:
                # Include Lecture, Lab, Lecture/Lab Combined, and Lab with No Credit
                if class_type in ['Lecture', 'Lab', 'Lecture/Lab Combined', 'Lab with No Credit']:
                    filtered_classes.append(class_data)
        
        processed_classes = filtered_classes
        
        # Save classes to database
        successful_saves = 0
        failed_saves = 0
        
        for i, class_data in enumerate(processed_classes, 1):
            try:
                # Validate class data
                if not data_processor.validate_class_data(class_data):
                    failed_saves += 1
                    continue

                # Save class to database
                if db_client.save_class(class_data, semester):
                    successful_saves += 1
                    
                    # Save meeting times for this class
                    meeting_times = class_data.get('meetingTimes', [])
                    if meeting_times:
                        for meeting_time in meeting_times:
                            processed_meeting_time = data_processor.process_meeting_time_data(meeting_time, class_data['id'])
                            if processed_meeting_time and data_processor.validate_meeting_time_data(processed_meeting_time):
                                if not db_client.save_meeting_time(processed_meeting_time, semester):
                else:
                    failed_saves += 1
                    
            except Exception as e:
                logger.error(f"Error processing class {class_data.get('id', 'Unknown')}: {e}")
                failed_saves += 1
        
        logger.info(f"\n=== LOADING RESULTS ===")
        logger.info(f"Total classes processed: {len(processed_classes)}")
        logger.info(f"Successfully saved: {successful_saves}")
        logger.info(f"Failed to save: {failed_saves}")
        
        # Get database stats
        stats = db_client.get_class_stats()
        
    except Exception as e:
        logger.error(f"Error in load_classes_to_database: {e}")

def test_database_connection():
    """Test the database connection and show sample data"""
    logger = setup_logging()
    db_client = SQLAlchemyDatabaseClient()
    
    try:
        # Get database stats
        stats = db_client.get_class_stats()
        if stats:
            logger.info("Database connection successful!")
            logger.info(f"Current database stats: {stats}")
        else:
            logger.error("Failed to get database stats")
        
            
    except Exception as e:
        logger.error(f"Error testing database connection: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Load OU class data to database')
    parser.add_argument('--test', action='store_true', help='Run in test mode (small sample)')
    parser.add_argument('--full', action='store_true', help='Run in full mode (all classes)')
    parser.add_argument('--test-db', action='store_true', help='Test database connection only')
    parser.add_argument('--semester', default='202510', help='Semester code (default: 202510 for Spring 2025)')
    
    args = parser.parse_args()
    
    if args.test_db:
        test_database_connection()
    elif args.test:
        load_classes_to_database(test_mode=True, semester=args.semester)
    elif args.full:
        load_classes_to_database(test_mode=False, semester=args.semester)
    else:
        # Default to test mode
        load_classes_to_database(test_mode=True, semester=args.semester)