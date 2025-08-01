"""
OU Bachelor's Degree Scraper - Extracts program and degree requirements
Focuses only on bachelor's degree programs (B.A., B.S., B.B.A., etc.)
"""

import requests
import json
import re
import os
import logging
import time
import sys
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
from typing import List, Dict, Any

# Add clients directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'clients'))
from major_database_client import MajorDatabaseClient


class BachelorDegreeScraper:
    def __init__(self):
        self.base_url = "https://ou-public.courseleaf.com"
        self.majors_url = "https://ou-public.courseleaf.com/academic-majors/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Setup logging
        self.setup_logging()
        
        # Initialize database client
        self.db_client = MajorDatabaseClient()
        
        # Bachelor's degree patterns to match
        self.bachelor_patterns = [
            r'bachelor[- ]?(of[- ]?)?(science|arts|business|administration|fine[- ]?arts)',
            r'b\.[a-z]\.?[a-z]?\.?',  # B.A., B.S., B.B.A., etc.
            r'bachelor',
        ]
        
        # Department categorization based on URL paths and titles
        self.department_categories = {
            'engineering': {
                'url_keywords': ['engineering', 'gallogly'],
                'title_keywords': ['engineering', 'computer science', 'petroleum', 'aerospace', 'civil', 'electrical', 'mechanical', 'industrial', 'chemical'],
                'degree_types': ['B.S.']
            },
            'business': {
                'url_keywords': ['business', 'price-business'],
                'title_keywords': ['business', 'accounting', 'finance', 'marketing', 'management', 'economics', 'entrepreneurship'],
                'degree_types': ['B.B.A.', 'B.S.']
            },
            'arts_sciences': {
                'url_keywords': ['arts-sciences', 'college-arts-sciences'],
                'title_keywords': ['arts', 'sciences', 'biology', 'chemistry', 'physics', 'mathematics', 'psychology', 'english', 'history', 'philosophy'],
                'degree_types': ['B.A.', 'B.S.', 'B.F.A.']
            },
            'journalism': {
                'url_keywords': ['journalism', 'gaylord'],
                'title_keywords': ['journalism', 'communication', 'media', 'advertising', 'public relations'],
                'degree_types': ['B.A.']
            },
            'education': {
                'url_keywords': ['education', 'jeannine-rainbolt'],
                'title_keywords': ['education', 'teaching', 'elementary', 'secondary', 'early childhood'],
                'degree_types': ['B.A.', 'B.S.']
            },
            'fine_arts': {
                'url_keywords': ['fine-arts', 'weitzenhoffer'],
                'title_keywords': ['music', 'dance', 'drama', 'theatre', 'art', 'fine arts'],
                'degree_types': ['B.F.A.', 'B.M.', 'B.A.']
            },
            'health_sciences': {
                'url_keywords': ['health-sciences', 'allied-health'],
                'title_keywords': ['health', 'nursing', 'medical', 'pharmacy', 'dentistry'],
                'degree_types': ['B.S.']
            },
            'other': {
                'url_keywords': [],
                'title_keywords': [],
                'degree_types': []
            }
        }
    
    def setup_logging(self):
        """Setup production logging for the scraper"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_dir = os.path.join(os.path.dirname(__file__), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, f'bachelor_scraper_{timestamp}.log')
        
        # Create custom logger
        self.logger = logging.getLogger(f'bachelor_scraper_{timestamp}')
        self.logger.setLevel(logging.INFO)
        
        # Remove any existing handlers
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # File handler
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        
        # Console handler (stdout)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # Add handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        self.logger.propagate = False  # Prevent duplicate logs
        
    def is_bachelor_degree(self, title: str, url: str) -> bool:
        """Check if a degree is a bachelor's degree"""
        text_to_check = f"{title} {url}".lower()
        
        for pattern in self.bachelor_patterns:
            if re.search(pattern, text_to_check, re.IGNORECASE):
                return True
        return False
    
    def get_bachelor_degree_links(self) -> List[Dict[str, str]]:
        """Get all bachelor's degree links from main page"""
        
        self.logger.info("Fetching majors page...")
        response = self.session.get(self.majors_url)
        
        if response.status_code != 200:
            self.logger.error(f"Failed to fetch majors page: {response.status_code}")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        all_links = []
        bachelor_links = []
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            link_text = link.get_text(strip=True)
            
            if href.startswith('http') or href.startswith('#'):
                continue
                
            path_segments = [seg for seg in href.strip('/').split('/') if seg]
            if len(path_segments) >= 3:
                if any(skip in href.lower() for skip in ['search', 'index', 'home', 'about']):
                    continue
                
                full_url = urljoin(self.base_url, href)
                if full_url not in [link['url'] for link in all_links]:
                    link_info = {
                        'url': full_url,
                        'title': link_text,
                        'path': href
                    }
                    all_links.append(link_info)
                    
                    # Check if it's a bachelor's degree
                    if self.is_bachelor_degree(link_text, href):
                        bachelor_links.append(link_info)
        
        self.logger.info(f"Found {len(all_links)} total major links")
        self.logger.info(f"Found {len(bachelor_links)} bachelor's degree links")
        return bachelor_links
    
    def scrape_degree_sections(self, degree_info: Dict[str, str]) -> Dict[str, Any]:
        """Scrape program and degree requirements from a bachelor's degree page"""
        
        major_url = degree_info['url']
        self.logger.info(f"Scraping: {major_url}")
        
        try:
            # Scrape main page
            response = self.session.get(major_url)
            
            if response.status_code != 200:
                self.logger.error(f"HTTP {response.status_code} for {major_url}")
                return {"url": major_url, "error": f"HTTP {response.status_code}"}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            major_data = {
                "url": major_url,
                "title": degree_info.get('title', ''),
                "scraped_at": time.time()
            }
            
            # Extract basic info from main page
            title_elem = soup.find('h1')
            if title_elem:
                major_data["full_title"] = title_elem.get_text(strip=True)
            
            # Extract credit hours and GPA from main page
            self._extract_basic_requirements(soup, major_data, response.text)
            
            # Now scrape the two specific sections
            program_url = f"{major_url}#programrequirementstext"
            degree_url = f"{major_url}#degreerequirementstext"
            
            major_data["program_requirements"] = self._scrape_section(program_url, "Program Requirements")
            major_data["degree_requirements"] = self._scrape_section(degree_url, "Degree Requirements")
            
            return major_data
            
        except Exception as e:
            self.logger.error(f"Error scraping {major_url}: {str(e)}")
            return {"url": major_url, "error": str(e)}
    
    def _extract_basic_requirements(self, soup: BeautifulSoup, major_data: Dict, html_text: str):
        """Extract basic requirements from the main page"""
        
        # Extract credit hours
        credit_patterns = [
            r'minimum\s+total\s+(?:credit\s+)?hours?[:\s]*(\d+)',
            r'total\s+credit\s+hours?[:\s]*(\d+)',
            r'(\d+)\s+credit\s+hours?\s+required',
        ]
        
        for pattern in credit_patterns:
            match = re.search(pattern, html_text, re.IGNORECASE)
            if match:
                major_data["credit_hours"] = int(match.group(1))
                break
        
        # Extract GPA requirements
        gpa_patterns = [
            r'overall\s+gpa[:\s-]*(\d+\.\d+)',
            r'minimum\s+gpa[:\s-]*(\d+\.\d+)',
            r'(\d+\.\d+)\s+gpa\s+required',
        ]
        
        for pattern in gpa_patterns:
            match = re.search(pattern, html_text, re.IGNORECASE)
            if match:
                major_data["gpa_requirement"] = float(match.group(1))
                break
    
    def _scrape_section(self, section_url: str, section_name: str) -> Dict[str, Any]:
        """Scrape a specific section (program or degree requirements)"""
        
        try:
            response = self.session.get(section_url)
            
            if response.status_code != 200:
                self.logger.warning(f"HTTP {response.status_code} for {section_name} section")
                return {"error": f"HTTP {response.status_code}", "content": None}
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove scripts and styles
            for element in soup(["script", "style"]):
                element.decompose()
            
            # Try to find the specific content area
            content_area = (
                soup.find('div', class_='contentarea') or
                soup.find('div', id='contentarea') or
                soup.find('main') or
                soup
            )
            
            if content_area:
                text_content = content_area.get_text(separator='\n', strip=True)
                
                # Extract course codes from this section
                course_codes = re.findall(r'\b[A-Z]{2,4}\s+\d{4}[A-Z]?\b', text_content)
                
                return {
                    "content": text_content[:3000],  # Limit length
                    "course_codes": list(set(course_codes)) if course_codes else [],
                    "scraped_successfully": True
                }
            else:
                return {"error": "No content area found", "content": None}
                
        except Exception as e:
            self.logger.error(f"Error scraping {section_name} section: {str(e)}")
            return {"error": str(e), "content": None}
    
    def test_scrape_and_save_bachelor_degrees(self, limit: int = 3) -> List[Dict[str, Any]]:
        """Test scraping and saving bachelor's degrees to database"""
        
        # Get bachelor's degree links
        bachelor_links = self.get_bachelor_degree_links()
        
        if not bachelor_links:
            self.logger.error("No bachelor's degree links found")
            return []
        
        if limit:
            bachelor_links = bachelor_links[:limit]
        
        self.logger.info(f"Testing with {len(bachelor_links)} bachelor's degrees...")
        
        results = []
        for i, degree_info in enumerate(bachelor_links, 1):
            self.logger.info(f"Progress: {i}/{len(bachelor_links)} - {degree_info['title']}")
            
            # Scrape degree data
            degree_data = self.scrape_degree_sections(degree_info)
            results.append(degree_data)
            
            # Save to database
            if "error" not in degree_data:
                save_success = self.db_client.save_bachelor_degree(degree_data)
                degree_data["saved_to_db"] = save_success
                
                if save_success:
                    self.logger.info(f"Successfully saved {degree_info['title']} to database")
                else:
                    self.logger.error(f"Failed to save {degree_info['title']} to database")
            
            # Rate limit
            time.sleep(2)
        
        return results
    
    def verify_database_integrity(self, scraped_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Verify that scraped data was correctly saved to database"""
        
        self.logger.info("=== DATABASE VERIFICATION ===")
        
        verification_results = {
            "total_scraped": len(scraped_results),
            "saved_successfully": 0,
            "database_matches": 0,
            "verification_details": []
        }
        
        for result in scraped_results:
            if "error" in result:
                continue
                
            verification_results["saved_successfully"] += 1
            
            # Verify data in database
            db_data = self.db_client.verify_major_in_database(result['url'])
            
            if db_data:
                verification_results["database_matches"] += 1
                
                # Compare key data points
                details = {
                    "major_name": result.get('title', ''),
                    "url_matches": db_data['url'] == result['url'],
                    "requirements_count": len(db_data['requirements']),
                    "total_courses": sum(req['course_count'] for req in db_data['requirements']),
                    "college": db_data['college'],
                    "department": db_data['department']
                }
                
                self.logger.info(f"DB VERIFIED: {details['major_name']} - "
                               f"{details['requirements_count']} requirements, "
                               f"{details['total_courses']} courses")
                
            else:
                details = {
                    "major_name": result.get('title', ''),
                    "error": "Not found in database",
                    "url": result['url']
                }
                
                self.logger.error(f"DB MISSING: {details['major_name']}")
            
            verification_results["verification_details"].append(details)
        
        success_rate = (verification_results["database_matches"] / verification_results["saved_successfully"] * 100) if verification_results["saved_successfully"] > 0 else 0
        
        self.logger.info(f"Database verification: {verification_results['database_matches']}/{verification_results['saved_successfully']} ({success_rate:.1f}%) verified")
        
        return verification_results
    
    def save_results(self, data: List[Dict[str, Any]], filename: str = None):
        """Save results to JSON file in logs directory"""
        
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"bachelor_degrees_{timestamp}.json"
        
        # Save to logs directory
        log_dir = os.path.join(os.path.dirname(__file__), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        filepath = os.path.join(log_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"Saved {len(data)} degrees to {filepath}")
        return filepath
    
    def print_summary(self, results: List[Dict[str, Any]]):
        """Print summary of scraping results"""
        
        successful = [r for r in results if "error" not in r]
        failed = [r for r in results if "error" in r]
        
        self.logger.info(f"=== SCRAPING SUMMARY ===")
        self.logger.info(f"Total degrees processed: {len(results)}")
        self.logger.info(f"Successful: {len(successful)}")
        self.logger.info(f"Failed: {len(failed)}")
        
        if successful:
            self.logger.info(f"\nSuccessfully scraped degrees:")
            for result in successful:
                program_ok = result.get('program_requirements', {}).get('scraped_successfully', False)
                degree_ok = result.get('degree_requirements', {}).get('scraped_successfully', False)
                status = f"[Program: {'OK' if program_ok else 'FAIL'}, Degree: {'OK' if degree_ok else 'FAIL'}]"
                self.logger.info(f"  - {result.get('title', 'Unknown')} {status}")
        
        if failed:
            self.logger.info(f"\nFailed degrees:")
            for result in failed:
                self.logger.info(f"  - {result.get('title', result['url'])}: {result['error']}")


def load_all_bachelor_degrees(self) -> List[Dict[str, Any]]:
    """Load all bachelor's degrees from OU CourseLeaf"""
    
    scraper = BachelorDegreeScraper()
    
    scraper.logger.info("Starting OU Bachelor's Degree Scraper - FULL LOAD")
    
    # Load all degrees (no limit)
    results = scraper.test_scrape_and_save_bachelor_degrees(limit=None)
    
    # Save results to JSON
    filepath = scraper.save_results(results)
    
    # Print scraping summary
    scraper.print_summary(results)
    
    # Verify database integrity
    verification = scraper.verify_database_integrity(results)
    
    # Final summary
    scraper.logger.info("=== FINAL LOAD RESULTS ===")
    scraper.logger.info(f"Scraped: {verification['total_scraped']} degrees")
    scraper.logger.info(f"Saved to DB: {verification['saved_successfully']} degrees")
    scraper.logger.info(f"DB Verified: {verification['database_matches']} degrees")
    
    if verification['database_matches'] == verification['saved_successfully'] and verification['saved_successfully'] > 0:
        scraper.logger.info("SUCCESS: All scraped data verified in database!")
    else:
        scraper.logger.error("FAILURE: Database verification failed!")
    
    scraper.logger.info(f"Results saved to {filepath}")
    
    return verification['database_matches'] == verification['saved_successfully']


def main():
    """Test the bachelor's degree scraper with full database integration"""
    
    scraper = BachelorDegreeScraper()
    
    scraper.logger.info("Starting OU Bachelor's Degree Scraper - DATABASE INTEGRATION TEST")
    
    # Test with 3 degrees from different colleges - scrape AND save to database
    results = scraper.test_scrape_and_save_bachelor_degrees(limit=3)
    
    # Save results to JSON
    filepath = scraper.save_results(results)
    
    # Print scraping summary
    scraper.print_summary(results)
    
    # Verify database integrity
    verification = scraper.verify_database_integrity(results)
    
    # Final summary
    scraper.logger.info("=== FINAL TEST RESULTS ===")
    scraper.logger.info(f"Scraped: {verification['total_scraped']} degrees")
    scraper.logger.info(f"Saved to DB: {verification['saved_successfully']} degrees")
    scraper.logger.info(f"DB Verified: {verification['database_matches']} degrees")
    
    if verification['database_matches'] == verification['saved_successfully'] and verification['saved_successfully'] > 0:
        scraper.logger.info("SUCCESS: All scraped data verified in database!")
    else:
        scraper.logger.error("FAILURE: Database verification failed!")
    
    scraper.logger.info(f"Results saved to {filepath}")
    
    return verification['database_matches'] == verification['saved_successfully']


def load_all_majors():
    """Load all bachelor's degrees - main function for full load"""
    
    scraper = BachelorDegreeScraper()
    
    scraper.logger.info("Starting OU Bachelor's Degree Scraper - FULL LOAD")
    
    # Load all degrees (no limit)
    results = scraper.test_scrape_and_save_bachelor_degrees(limit=None)
    
    # Save results to JSON
    filepath = scraper.save_results(results)
    
    # Print scraping summary
    scraper.print_summary(results)
    
    # Verify database integrity
    verification = scraper.verify_database_integrity(results)
    
    # Final summary
    scraper.logger.info("=== FINAL LOAD RESULTS ===")
    scraper.logger.info(f"Scraped: {verification['total_scraped']} degrees")
    scraper.logger.info(f"Saved to DB: {verification['saved_successfully']} degrees")
    scraper.logger.info(f"DB Verified: {verification['database_matches']} degrees")
    
    if verification['database_matches'] == verification['saved_successfully'] and verification['saved_successfully'] > 0:
        scraper.logger.info("SUCCESS: All scraped data verified in database!")
    else:
        scraper.logger.error("FAILURE: Database verification failed!")
    
    scraper.logger.info(f"Results saved to {filepath}")
    
    return verification['database_matches'] == verification['saved_successfully']


if __name__ == "__main__":
    # For testing, use main()
    # For full load, use load_all_majors()
    load_all_majors()