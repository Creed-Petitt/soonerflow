#!/usr/bin/env python3
"""
Professor Data Loader
Orchestrates the entire process of loading professors and their details into the database.
"""

import os
import sys
import logging
from datetime import datetime
from typing import List, Dict, Any

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fetch_ou_professors import fetch_all_ou_professors
from fetch_professor_details import fetch_professor_details, fetch_top_professor_details
from data_processor import DataProcessor

def setup_logging():
    """Set up logging for the loader"""
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    log_filename = f'logs/professor_loader_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

def load_all_professors():
    """Load all professors with basic info"""
    logger = setup_logging()
    logger.info("=== STARTING PROFESSOR LOADER ===")
    logger.info("Step 1: Loading all professors with basic info...")
    
    try:
        fetch_all_ou_professors()
        logger.info("Step 1 completed: All professors loaded with basic info")
        return True
    except Exception as e:
        logger.error(f"Step 1 failed: {e}")
        return False

def load_professor_details(min_ratings: int = 5, max_professors: int = None):
    """Load detailed info for professors with minimum ratings"""
    logger = setup_logging()
    logger.info(f"Step 2: Loading detailed info for professors with {min_ratings}+ ratings...")
    
    try:
        # This will fetch detailed data and save to database
        fetch_top_professor_details(min_ratings=min_ratings, max_professors=max_professors)
        logger.info("Step 2 completed: Detailed professor info loaded")
        return True
    except Exception as e:
        logger.error(f"Step 2 failed: {e}")
        return False

def load_specific_professor(professor_id: str):
    """Load detailed info for a specific professor"""
    logger = setup_logging()
    logger.info(f"Step 3: Loading detailed info for professor {professor_id}...")
    
    try:
        data_processor = DataProcessor()
        
        # Fetch detailed data
        detailed_data = fetch_professor_details(professor_id)
        
        if detailed_data:
            # Process and save to database
            processed_data = data_processor.process_professor_data(detailed_data)
            
            if data_processor.save_to_database(processed_data, 'professor'):
                logger.info(f"Successfully loaded detailed info for professor {professor_id}")
                
                # Also load ratings if available
                ratings = detailed_data.get('ratings', {}).get('edges', [])
                for rating_edge in ratings:
                    rating_data = rating_edge.get('node', {})
                    if rating_data:
                        processed_rating = data_processor.process_rating_data(rating_data, professor_id)
                        data_processor.save_to_database(processed_rating, 'rating')
                
                return True
            else:
                logger.error(f"Failed to save professor {professor_id} to database")
                return False
        else:
            logger.error(f"Failed to fetch detailed data for professor {professor_id}")
            return False
            
    except Exception as e:
        logger.error(f"Step 3 failed: {e}")
        return False

def main():
    """Main loader function"""
    logger = setup_logging()
    
    print("=== OU Professor Data Loader ===")
    print("This will load all professors and their details into the database.")
    print()
    
    # Step 1: Load all professors with basic info
    print("Step 1: Loading all professors with basic info...")
    if not load_all_professors():
        logger.error("Failed to load basic professor info. Stopping.")
        return
    
    print("Step 1 completed successfully!")
    print()
    
    # Step 2: Load detailed info for professors with 5+ ratings
    print("Step 2: Loading detailed info for professors with 5+ ratings...")
    if not load_professor_details(min_ratings=5, max_professors=50):
        logger.error("Failed to load detailed professor info.")
        return
    
    print("Step 2 completed successfully!")
    print()
    
    logger.info("=== LOADER COMPLETED SUCCESSFULLY ===")
    print("All professor data has been loaded into the database!")
    print("You can now view the data in your Next.js app.")

if __name__ == "__main__":
    main() 