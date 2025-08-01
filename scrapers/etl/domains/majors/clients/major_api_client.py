import os
import sys
import logging
import asyncio
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse

# Add the crawl4ai import path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

try:
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig, CacheMode, JsonCssExtractionStrategy
except ImportError:
    print("crawl4ai not installed. Please install with: pip install crawl4ai")
    sys.exit(1)

class MajorRequirementsAPIClient:
    """Client for scraping OU major requirements from CourseLeaf"""
    
    def __init__(self):
        self.base_url = "https://ou-public.courseleaf.com"
        self.majors_url = f"{self.base_url}/academic-majors/"
        self.logger = logging.getLogger(__name__)
        
    async def get_all_major_links(self) -> List[Dict[str, str]]:
        """Extract all major links from the academic-majors page"""
        try:
            browser_config = BrowserConfig(headless=True)
            crawler_config = CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
                css_selector="a[href*='/']",  # Get all links
            )
            
            async with AsyncWebCrawler(config=browser_config) as crawler:
                result = await crawler.arun(url=self.majors_url, config=crawler_config)
                
                # Parse links to extract major information
                major_links = []
                for link in result.extracted_content.get('links', []):
                    href = link.get('href', '')
                    if self._is_major_link(href):
                        major_info = self._parse_major_url(href)
                        if major_info:
                            major_links.append(major_info)
                
                self.logger.info(f"Found {len(major_links)} major links")
                return major_links
                
        except Exception as e:
            self.logger.error(f"Error getting major links: {e}")
            return []
    
    async def scrape_major_requirements(self, major_url: str) -> Dict[str, Any]:
        """Scrape requirements for a specific major"""
        try:
            browser_config = BrowserConfig(headless=True)
            
            # Define schema for extracting requirement tables
            schema = {
                "type": "object",
                "properties": {
                    "major_name": {"type": "string"},
                    "college": {"type": "string"},
                    "total_credits": {"type": "integer"},
                    "requirements": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "category": {"type": "string"},
                                "credits_needed": {"type": "integer"},
                                "courses": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "subject": {"type": "string"},
                                            "course_number": {"type": "string"},
                                            "title": {"type": "string"},
                                            "credits": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            crawler_config = CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
                css_selector="table, .requirement-section",
                extraction_strategy=JsonCssExtractionStrategy(schema)
            )
            
            async with AsyncWebCrawler(config=browser_config) as crawler:
                result = await crawler.arun(url=major_url, config=crawler_config)
                return result.extracted_content
                
        except Exception as e:
            self.logger.error(f"Error scraping major requirements: {e}")
            return {}
    
    def _is_major_link(self, href: str) -> bool:
        """Check if a link is a major requirements page"""
        # Major links typically have college/department/major structure
        return (
            href.startswith('/') and 
            len(href.split('/')) >= 4 and
            not href.endswith('/') and
            'academic-majors' not in href
        )
    
    def _parse_major_url(self, href: str) -> Optional[Dict[str, str]]:
        """Parse major URL to extract college, department, and major info"""
        try:
            # Remove leading slash and split
            path = href.lstrip('/')
            parts = path.split('/')
            
            if len(parts) >= 3:
                college = parts[0]
                department = parts[1]
                major = parts[2]
                
                return {
                    'college': college,
                    'department': department,
                    'major': major,
                    'url': f"{self.base_url}{href}",
                    'name': major.replace('-', ' ').title()
                }
        except Exception as e:
            self.logger.error(f"Error parsing major URL {href}: {e}")
        
        return None
    
    async def get_major_stats(self) -> Dict[str, Any]:
        """Get statistics about available majors"""
        major_links = await self.get_all_major_links()
        
        colleges = {}
        for major in major_links:
            college = major['college']
            if college not in colleges:
                colleges[college] = []
            colleges[college].append(major)
        
        return {
            'total_majors': len(major_links),
            'colleges': {college: len(majors) for college, majors in colleges.items()},
            'majors_by_college': colleges
        } 