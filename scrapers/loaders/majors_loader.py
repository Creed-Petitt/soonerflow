"""
Majors Loader - Orchestrates loading of OU major data to database
"""

import os
import sys
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

# Add paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scrapers.clients.majors_client import MajorsClient
from scrapers.processors.majors_processor import MajorsProcessor
from scrapers.clients.database_client import SQLAlchemyDatabaseClient

def setup_logging():
    """Set up logging for the majors loader"""
    # Configure logging to stdout only (cloud providers will capture this)
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()  # Only print to console/stdout
        ]
    )
    
    return logging.getLogger(__name__)

def load_majors_to_database(test_mode: bool = False, limit: Optional[int] = None):
    """
    Load majors from OU CourseLeaf to database
    
    Args:
        test_mode: If True, only process first 3 majors
        limit: Maximum number of majors to process (None for all)
    """
    
    # Set up logging and clients
    logger = setup_logging()
    client = MajorsClient()
    processor = MajorsProcessor()
    db_client = SQLAlchemyDatabaseClient()
    
    try:
        logger.info("Starting to load OU major data to database...")
        
        # Fetch all major links
        major_links = client.fetch_major_links()
        
        if not major_links:
            logger.error("No major links found")
            return
        
        # Filter for bachelor's degrees only
        bachelor_links = [
            link for link in major_links 
            if processor.is_bachelor_degree(link['title'], link['url'])
        ]
        
        logger.info(f"Found {len(bachelor_links)} bachelor's degree programs")
        
        # Apply limits
        if test_mode:
            bachelor_links = bachelor_links[:3]
            logger.info("TEST MODE: Processing only first 3 majors")
        elif limit:
            bachelor_links = bachelor_links[:limit]
            logger.info(f"Processing first {limit} majors")
        
        # Process statistics
        total_majors = len(bachelor_links)
        saved_count = 0
        updated_count = 0
        failed_count = 0
        
        # Process each major
        for i, major_info in enumerate(bachelor_links, 1):
            logger.info(f"[{i}/{total_majors}] Processing {major_info['title']}...")
            
            try:
                # Fetch the major page
                page_data = client.fetch_major_page(major_info['url'])
                
                if not page_data:
                    logger.error(f"  Failed to fetch page for {major_info['title']}")
                    failed_count += 1
                    continue
                
                # Process the major data
                processed_major = processor.process_major_data(major_info, page_data)
                
                if 'error' in processed_major:
                    logger.error(f"  Error processing {major_info['title']}: {processed_major['error']}")
                    failed_count += 1
                    continue
                
                # Prepare for database
                db_data = processor.prepare_for_database(processed_major)
                
                # Save to database
                if db_client.save_major(db_data):
                    logger.info(f"  ✓ Saved {major_info['title']}: {db_data['totalCredits']} credits")
                    saved_count += 1
                else:
                    logger.info(f"  - Major already exists: {major_info['title']}")
                    updated_count += 1
                
                # Also fetch and save program/degree requirements if needed
                # This can be expanded to save requirements and courses
                
            except Exception as e:
                logger.error(f"  Error processing {major_info['title']}: {str(e)}")
                failed_count += 1
            
            # Rate limiting
            if i % 10 == 0:
                logger.info(f"Progress: Saved: {saved_count}, Updated: {updated_count}, Failed: {failed_count}")
                time.sleep(2)  # Longer pause every 10 requests
            else:
                time.sleep(0.5)  # Short pause between requests
        
        # Final summary
        logger.info("=" * 60)
        logger.info("LOADING COMPLETE")
        logger.info(f"Total majors processed: {total_majors}")
        logger.info(f"Newly saved: {saved_count}")
        logger.info(f"Already existed: {updated_count}")
        logger.info(f"Failed: {failed_count}")
        logger.info("=" * 60)
        
        # Get database statistics
        db_stats = db_client.get_major_stats()
        logger.info(f"Database now contains: {db_stats['total_majors']} majors")
        
    except Exception as e:
        logger.error(f"Fatal error in major loading: {str(e)}")
        raise

def main():
    """Main entry point for the majors loader"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Load OU major data to database')
    parser.add_argument('--test', action='store_true', help='Run in test mode (3 majors only)')
    parser.add_argument('--limit', type=int, help='Limit number of majors to process')
    
    args = parser.parse_args()
    
    # Load majors
    load_majors_to_database(test_mode=args.test, limit=args.limit)

if __name__ == "__main__":
    main()