"""
Majors Client - Fetches major data from OU CourseLeaf website
"""

import requests
import logging
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin

class MajorsClient:
    """Client for fetching major data from OU CourseLeaf"""
    
    def __init__(self):
        self.base_url = "https://ou-public.courseleaf.com"
        self.majors_url = "https://ou-public.courseleaf.com/academic-majors/"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.logger = logging.getLogger(__name__)
        
    def fetch_major_links(self) -> List[Dict[str, str]]:
        """Fetch all major links by first getting colleges, then majors from each college"""
        
        self.logger.info("Fetching majors page...")
        
        try:
            response = self.session.get(self.majors_url)
            response.raise_for_status()
        except requests.RequestException as e:
            self.logger.error(f"Failed to fetch majors page: {e}")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Step 1: Get college links (1 segment paths)
        college_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            link_text = link.get_text(strip=True)
            
            # Skip external links and anchors
            if href.startswith('http') or href.startswith('#'):
                continue
            
            # College links have 1 segment and contain "college" in the text
            path_segments = [seg for seg in href.strip('/').split('/') if seg]
            if len(path_segments) == 1 and 'college' in link_text.lower():
                college_url = urljoin(self.base_url, href)
                if college_url not in college_links:
                    college_links.append(college_url)
                    self.logger.debug(f"Found college: {link_text}")
        
        self.logger.info(f"Found {len(college_links)} colleges")
        
        # Step 2: For each college, get major links
        all_links = []
        
        for college_url in college_links:
            self.logger.debug(f"Fetching majors from: {college_url}")
            
            try:
                response = self.session.get(college_url)
                response.raise_for_status()
                college_soup = BeautifulSoup(response.text, 'html.parser')
                
                # Find major links on the college page
                for link in college_soup.find_all('a', href=True):
                    href = link['href']
                    link_text = link.get_text(strip=True)
                    
                    # Skip external links and anchors
                    if href.startswith('http') or href.startswith('#'):
                        continue
                    
                    # Major links have 3+ segments and contain degree keywords
                    path_segments = [seg for seg in href.strip('/').split('/') if seg]
                    if len(path_segments) >= 3:
                        # Look for bachelor's, master's degree links
                        if any(keyword in href.lower() for keyword in ['bachelor', 'master', 'bs-', 'ba-', 'bba-', 'barch']):
                            # Skip navigation/utility links
                            if any(skip in href.lower() for skip in ['search', 'index', 'home', 'about', 'elective']):
                                continue
                            
                            full_url = urljoin(self.base_url, href)
                            
                            # Avoid duplicates
                            if full_url not in [link['url'] for link in all_links]:
                                link_info = {
                                    'url': full_url,
                                    'title': link_text,
                                    'path': href
                                }
                                all_links.append(link_info)
                
            except requests.RequestException as e:
                self.logger.error(f"Failed to fetch college page {college_url}: {e}")
                continue
        
        self.logger.info(f"Found {len(all_links)} major links total")
        return all_links
    
    def fetch_major_page(self, url: str) -> Optional[Dict[str, Any]]:
        """Fetch and parse a single major page"""
        
        self.logger.debug(f"Fetching major page: {url}")
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            return {
                'url': url,
                'html': response.text,
                'status_code': response.status_code
            }
            
        except requests.RequestException as e:
            self.logger.error(f"Failed to fetch {url}: {e}")
            return None
    
    def fetch_major_section(self, base_url: str, section: str) -> Optional[str]:
        """Fetch a specific section of a major page (e.g., program requirements)"""
        
        section_url = f"{base_url}#{section}"
        self.logger.debug(f"Fetching section: {section_url}")
        
        try:
            response = self.session.get(section_url)
            response.raise_for_status()
            return response.text
            
        except requests.RequestException as e:
            self.logger.error(f"Failed to fetch section {section_url}: {e}")
            return None