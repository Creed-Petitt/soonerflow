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
from scrapers.api_clients.classes_client import ClassNavAPIClient
from scrapers.processors.classes_processor import ClassDataProcessor
from database_client import SQLAlchemyDatabaseClient

def setup_logging():
    """Set up logging for the class loader"""
    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Create class loader specific log file
    log_filename = f'logs/class_loader_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
    
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
            logger.info("Running in TEST MODE - will only fetch a small sample")
            # Fetch a small sample for testing (offset 0 has classes with full meeting times)
            raw_classes = api_client.fetch_classes(0, 100, semester)
            if raw_classes and raw_classes.get('aaData'):
                classes_data = raw_classes['aaData']
            else:
                logger.error("Failed to fetch test data")
                return
        else:
            logger.info("Running in FULL MODE - will fetch all classes")
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
        
        logger.info(f"Filtered to {len(filtered_classes)} classes that meet criteria")
        processed_classes = filtered_classes
        
        logger.info(f"Successfully processed {len(processed_classes)} classes")
        
        # Save classes to database
        successful_saves = 0
        failed_saves = 0
        
        for i, class_data in enumerate(processed_classes, 1):
            try:
                # Validate class data
                if not data_processor.validate_class_data(class_data):
                    logger.warning(f"Skipping invalid class data: {class_data.get('id', 'Unknown')}")
                    failed_saves += 1
                    continue
                
                # Save class to database
                if db_client.save_class(class_data):
                    successful_saves += 1
                    logger.info(f"Saved class {i}/{len(processed_classes)}: {class_data.get('subject', '')} {class_data.get('courseNumber', '')}")
                    
                    # Save meeting times for this class
                    meeting_times = class_data.get('meetingTimes', [])
                    if meeting_times:
                        for meeting_time in meeting_times:
                            processed_meeting_time = data_processor.process_meeting_time_data(meeting_time, class_data['id'])
                            if processed_meeting_time and data_processor.validate_meeting_time_data(processed_meeting_time):
                                if not db_client.save_meeting_time(processed_meeting_time):
                                    logger.error(f"Failed to save meeting time for class {class_data['id']}")
                        logger.info(f"Saved {len(meeting_times)} meeting times for class {class_data['id']}")
                    else:
                        logger.warning(f"No meeting times found for class {class_data['id']}")
                else:
                    failed_saves += 1
                    logger.error(f"Failed to save class: {class_data.get('id', 'Unknown')}")
                    
            except Exception as e:
                logger.error(f"Error processing class {class_data.get('id', 'Unknown')}: {e}")
                failed_saves += 1
        
        logger.info(f"\n=== LOADING RESULTS ===")
        logger.info(f"Total classes processed: {len(processed_classes)}")
        logger.info(f"Successfully saved: {successful_saves}")
        logger.info(f"Failed to save: {failed_saves}")
        
        # Get database stats
        stats = db_client.get_class_stats()
        if stats:
            logger.info(f"\n=== DATABASE STATS ===")
            logger.info(f"Total classes in database: {stats.get('total_classes', 0)}")
            logger.info(f"Total meeting times in database: {stats.get('total_meeting_times', 0)}")
            logger.info(f"Unique subjects: {stats.get('unique_subjects', 0)}")
            logger.info(f"Unique instructors: {stats.get('unique_instructors', 0)}")
        
    except Exception as e:
        logger.error(f"Error in load_classes_to_database: {e}")

def test_database_connection():
    """Test the database connection and show sample data"""
    logger = setup_logging()
    db_client = SQLAlchemyDatabaseClient()
    
    try:
        logger.info("Testing database connection...")
        
        # Get database stats
        stats = db_client.get_class_stats()
        if stats:
            logger.info("Database connection successful!")
            logger.info(f"Current database stats: {stats}")
        else:
            logger.error("Failed to get database stats")
        
        # Get sample classes
        sample_classes = db_client.get_sample_classes(3)
        if sample_classes:
            logger.info("Sample classes from database:")
            for i, class_data in enumerate(sample_classes, 1):
                logger.info(f"{i}. {class_data.get('subject', '')} {class_data.get('courseNumber', '')}: {class_data.get('title', '')}")
                logger.info(f"   Instructor: {class_data.get('instructor', 'N/A')}")
                logger.info("")
        else:
            logger.info("No sample classes found in database")
            
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