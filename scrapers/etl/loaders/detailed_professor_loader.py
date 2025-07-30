import time
import logging
import sys
import os
from typing import List, Dict, Any

# Add the etl directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from clients.database_client import DatabaseClient
from clients.api_client import RateMyProfessorsAPIClient
from processors.data_processor import DataProcessor

class DetailedProfessorLoader:
    """Loader for detailed professor data with tiered rating strategy"""
    
    def __init__(self):
        self.db_client = DatabaseClient()
        self.api_client = RateMyProfessorsAPIClient()
        self.data_processor = DataProcessor()
        self.logger = self._setup_logging()
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)
        
        # Create console handler
        handler = logging.StreamHandler()
        handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        # Add handler to logger
        if not logger.handlers:
            logger.addHandler(handler)
        
        return logger
    
    def load_detailed_professors(self, min_ratings: int = 10, test_mode: bool = False, max_professors: int = None) -> Dict[str, int]:
        """Load detailed professor data with tiered rating strategy"""
        
        self.logger.info("=== STARTING DETAILED PROFESSOR LOADER ===")
        self.logger.info(f"Minimum ratings threshold: {min_ratings}")
        self.logger.info(f"Test mode: {test_mode}")
        
        # Get qualified professors from database
        self.logger.info("Fetching qualified professors from database...")
        qualified_professors = self.db_client.get_qualified_professors(min_ratings)
        
        if not qualified_professors:
            self.logger.error("No qualified professors found in database!")
            return {'successful': 0, 'failed': 0, 'ratings_saved': 0}
        
        self.logger.info(f"Found {len(qualified_professors)} qualified professors")
        
        # Limit professors if specified
        if test_mode:
            max_professors = 3
            self.logger.info("TEST MODE: Processing only 3 professors")
        elif max_professors:
            qualified_professors = qualified_professors[:max_professors]
            self.logger.info(f"Limited to {max_professors} professors")
        
        # Process professors
        successful_professors = 0
        failed_professors = 0
        total_ratings_saved = 0
        
        for i, professor in enumerate(qualified_professors, 1):
            try:
                self.logger.info(f"\n=== Processing {i}/{len(qualified_professors)} ===")
                self.logger.info(f"Professor: {professor['firstName']} {professor['lastName']}")
                self.logger.info(f"Department: {professor['department']}")
                self.logger.info(f"Total Ratings: {professor['numRatings']}")
                self.logger.info(f"Average Rating: {professor['avgRating']}/5.0")
                
                # Determine how many ratings to fetch
                ratings_to_fetch = self.data_processor.determine_rating_count(professor['numRatings'])
                self.logger.info(f"Will fetch {ratings_to_fetch} detailed ratings")
                
                # Fetch detailed professor data
                detailed_prof = self.api_client.fetch_professor_details(
                    professor['id'], 
                    ratings_to_fetch
                )
                
                if detailed_prof:
                    self.logger.info("SUCCESS: Successfully fetched detailed data")
                    
                    # Process professor data
                    processed_professor = self.data_processor.process_professor_data(detailed_prof)
                    
                    # Save professor to database
                    if self.db_client.save_professor(processed_professor):
                        self.logger.info("SUCCESS: Successfully saved professor to database")
                        successful_professors += 1
                        
                        # Process and save ratings
                        ratings = detailed_prof.get('ratings', {}).get('edges', [])
                        self.logger.info(f"Found {len(ratings)} ratings to process")
                        
                        ratings_saved = 0
                        for j, rating_edge in enumerate(ratings, 1):
                            try:
                                rating_data = rating_edge.get('node', {})
                                if rating_data:
                                    processed_rating = self.data_processor.process_rating_data(rating_data, professor['id'])
                                    if self.db_client.save_rating(processed_rating):
                                        self.logger.info(f"SUCCESS: Saved rating {j}/{len(ratings)}")
                                        ratings_saved += 1
                                    else:
                                        self.logger.error(f"FAILED: Failed to save rating {j}/{len(ratings)}")
                                else:
                                    self.logger.warning(f"Invalid rating data for rating {j}")
                            except Exception as rating_error:
                                self.logger.error(f"ERROR processing rating {j}: {rating_error}")
                                continue
                        
                        total_ratings_saved += ratings_saved
                        self.logger.info(f"Saved {ratings_saved}/{len(ratings)} ratings for this professor")
                    else:
                        self.logger.error("FAILED: Failed to save professor to database")
                        failed_professors += 1
                else:
                    self.logger.error("FAILED: Failed to fetch detailed data")
                    failed_professors += 1
                
                # Add delay to be respectful to the API
                time.sleep(1)
                
            except Exception as professor_error:
                self.logger.error(f"CRITICAL ERROR processing professor {professor.get('firstName', 'Unknown')} {professor.get('lastName', 'Unknown')}: {professor_error}")
                failed_professors += 1
                continue
            
            # If in test mode and we've processed enough, break
            if test_mode and i >= 3:
                self.logger.info("TEST MODE: Stopping after 3 professors")
                break
        
        # Summary
        self.logger.info(f"\n=== LOADER COMPLETED ===")
        self.logger.info(f"SUCCESS: Successfully processed: {successful_professors} professors")
        self.logger.info(f"SUCCESS: Successfully saved: {total_ratings_saved} ratings")
        self.logger.info(f"FAILED: Failed: {failed_professors} professors")
        
        if test_mode:
            self.logger.info("TEST MODE COMPLETED - Ready for full run!")
        else:
            self.logger.info("FULL RUN COMPLETED!")
        
        return {
            'successful': successful_professors,
            'failed': failed_professors,
            'ratings_saved': total_ratings_saved
        }
    
    def get_processing_stats(self) -> Dict[str, Any]:
        """Get statistics about the processing"""
        try:
            qualified_professors = self.db_client.get_qualified_professors(10)
            
            # Categorize by rating count
            tier_1 = [p for p in qualified_professors if 10 <= p['numRatings'] <= 14]
            tier_2 = [p for p in qualified_professors if p['numRatings'] >= 15]
            
            stats = {
                'total_qualified': len(qualified_professors),
                'tier_1_10_14_ratings': len(tier_1),
                'tier_2_15_plus_ratings': len(tier_2),
                'estimated_processing_time_minutes': len(qualified_professors) * 2,  # ~2 min per professor
                'estimated_total_ratings': sum(p['numRatings'] for p in qualified_professors)
            }
            
            return stats
            
        except Exception as e:
            self.logger.error(f"Error getting processing stats: {e}")
            return {}


if __name__ == "__main__":
    loader = DetailedProfessorLoader()
    
    # Get processing statistics
    stats = loader.get_processing_stats()
    print(f"\n=== PROCESSING STATISTICS ===")
    print(f"Total qualified professors: {stats.get('total_qualified', 0)}")
    print(f"Tier 1 (10-14 ratings): {stats.get('tier_1_10_14_ratings', 0)}")
    print(f"Tier 2 (15+ ratings): {stats.get('tier_2_15_plus_ratings', 0)}")
    print(f"Estimated processing time: {stats.get('estimated_processing_time_minutes', 0)} minutes")
    print(f"Estimated total ratings: {stats.get('estimated_total_ratings', 0)}")
    
    # Run full ETL process
    print(f"\n=== STARTING FULL ETL RUN ===")
    print("This will process all qualified professors with detailed data...")
    print("Estimated time: ~38 hours")
    print("Press Ctrl+C to stop at any time")
    print("=" * 50)
    
    try:
        results = loader.load_detailed_professors(min_ratings=10, test_mode=False)
        
        print(f"\n=== FULL RUN RESULTS ===")
        print(f"Successful professors: {results['successful']}")
        print(f"Failed professors: {results['failed']}")
        print(f"Ratings saved: {results['ratings_saved']}")
        print(f"Success rate: {(results['successful'] / (results['successful'] + results['failed']) * 100):.1f}%")
        
    except KeyboardInterrupt:
        print("\n\n=== ETL PROCESS INTERRUPTED BY USER ===")
        print("The process has been stopped. You can resume later by running the script again.")
        print("Progress has been saved to the database.")
        
    except Exception as e:
        print(f"\n\n=== CRITICAL ERROR ===")
        print(f"An unexpected error occurred: {e}")
        print("Please check the logs above for details.")
        print("The process has been stopped.") 