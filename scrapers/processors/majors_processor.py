"""
Majors Processor - Processes raw major data into database-ready format
"""

import re
import logging
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional
import hashlib

class MajorsProcessor:
    """Process raw major data into database-ready format"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Bachelor's degree patterns
        self.bachelor_patterns = [
            r'bachelor[- ]?(of[- ]?)?(science|arts|business|administration|fine[- ]?arts)',
            r'b\.[a-z]\.?[a-z]?\.?',  # B.A., B.S., B.B.A., etc.
            r'bachelor',
        ]
    
    def is_bachelor_degree(self, title: str, url: str) -> bool:
        """Check if a degree is a bachelor's degree"""
        text_to_check = f"{title} {url}".lower()
        
        for pattern in self.bachelor_patterns:
            if re.search(pattern, text_to_check, re.IGNORECASE):
                return True
        return False
    
    def process_major_data(self, major_info: Dict[str, str], page_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a major's page data into structured format"""
        
        if not page_data or 'html' not in page_data:
            return {'error': 'No page data', 'url': major_info.get('url')}
        
        soup = BeautifulSoup(page_data['html'], 'html.parser')
        
        # Extract basic info
        major_data = {
            'url': major_info.get('url', ''),
            'title': major_info.get('title', ''),
            'path': major_info.get('path', '')
        }
        
        # Extract full title from page
        title_elem = soup.find('h1')
        if title_elem:
            major_data['full_title'] = title_elem.get_text(strip=True)
        
        # Extract credit hours with fixed patterns
        major_data['totalCredits'] = self.extract_credit_hours(soup, page_data['html'])
        
        # Extract GPA requirements
        major_data['gpa_requirement'] = self.extract_gpa_requirement(soup, page_data['html'])
        
        # Extract college and department
        major_data['college'] = self.extract_college(major_info['path'])
        major_data['department'] = self.extract_department(soup, major_info['path'])
        
        # Generate ID for database
        major_data['id'] = self.generate_major_id(major_data['title'], major_data['url'])
        
        # Extract description
        major_data['description'] = self.extract_description(soup)
        
        return major_data
    
    def extract_credit_hours(self, soup: BeautifulSoup, html_text: str) -> int:
        """
        Extract credit hours with improved patterns that handle HTML formatting
        Returns default 120 if not found
        """
        
        # Get clean text from BeautifulSoup
        text_content = soup.get_text()
        
        # Patterns to find credit hours
        credit_patterns = [
            r'Total\s*Credit\s*Hours[:\s]*(\d+)',
            r'Minimum\s*Total\s*Credit\s*Hours[:\s]*(\d+)',
            r'minimum\s+total\s+(?:credit\s+)?hours?[:\s]*(\d+)',
            r'(\d+)\s+credit\s+hours?\s+required',
            r'Total\s*Hours[:\s]*(\d+)',
        ]
        
        all_matches = []
        for pattern in credit_patterns:
            matches = re.findall(pattern, text_content, re.IGNORECASE)
            all_matches.extend([int(m) for m in matches if m.isdigit()])
        
        # Filter for valid degree totals (typically 120-150)
        valid_credits = [c for c in all_matches if 120 <= c <= 150]
        
        if valid_credits:
            # Use the maximum valid value (most likely the total, not subcategory)
            return max(valid_credits)
        
        # If no valid credits found, default to 120
        self.logger.warning(f"Could not extract credit hours, defaulting to 120")
        return 120
    
    def extract_gpa_requirement(self, soup: BeautifulSoup, html_text: str) -> Optional[float]:
        """Extract GPA requirements from the page"""
        
        text_content = soup.get_text()
        
        gpa_patterns = [
            r'overall\s+gpa[:\s-]*(\d+\.\d+)',
            r'minimum\s+gpa[:\s-]*(\d+\.\d+)',
            r'(\d+\.\d+)\s+gpa\s+required',
            r'cumulative\s+gpa[:\s-]*(\d+\.\d+)',
        ]
        
        for pattern in gpa_patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                return float(match.group(1))
        
        return None
    
    def extract_college(self, path: str) -> str:
        """Extract college from URL path"""
        
        # College mappings based on URL patterns
        college_mappings = {
            'gallogly-engineering': 'Gallogly College of Engineering',
            'price-business': 'Michael F. Price College of Business',
            'arts-sciences': 'College of Arts and Sciences',
            'weitzenhoffer-fine-arts': 'Weitzenhoffer Family College of Fine Arts',
            'rainbolt-education': 'Jeannine Rainbolt College of Education',
            'gaylord': 'Gaylord College of Journalism and Mass Communication',
            'health-sciences': 'College of Health Sciences',
            'allied-health': 'College of Allied Health',
            'atmospheric-geographic-sciences': 'College of Atmospheric and Geographic Sciences',
            'international-area-studies': 'College of International and Area Studies',
            'liberal-studies': 'College of Liberal Studies',
            'architecture': 'Christopher C. Gibbs College of Architecture',
        }
        
        path_lower = path.lower()
        for key, college in college_mappings.items():
            if key in path_lower:
                return college
        
        return 'Unknown College'
    
    def extract_department(self, soup: BeautifulSoup, path: str) -> Optional[str]:
        """Extract department from page or path"""
        
        # Try to extract from breadcrumb or navigation
        breadcrumb = soup.find('nav', {'aria-label': 'breadcrumb'})
        if breadcrumb:
            links = breadcrumb.find_all('a')
            if len(links) >= 2:
                # Usually the second-to-last link is the department
                return links[-2].get_text(strip=True)
        
        # Extract from path segments
        segments = [s for s in path.strip('/').split('/') if s]
        if len(segments) >= 2:
            # Clean up the department name
            dept = segments[1].replace('-', ' ').title()
            return dept
        
        return None
    
    def generate_major_id(self, title: str, url: str) -> str:
        """Generate a unique ID for the major"""
        # Use URL as the unique identifier source
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    def extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract program description"""
        
        # Look for description in common containers
        description_selectors = [
            'div.program-description',
            'div.description',
            'section.description',
            'div.content p:first-of-type'
        ]
        
        for selector in description_selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)[:1000]  # Limit length
        
        # Fallback: get first paragraph after h1
        h1 = soup.find('h1')
        if h1:
            next_p = h1.find_next_sibling('p')
            if next_p:
                return next_p.get_text(strip=True)[:1000]
        
        return None
    
    def prepare_for_database(self, processed_major: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare major data for database insertion"""
        
        return {
            'id': processed_major.get('id'),
            'name': processed_major.get('title', ''),
            'college': processed_major.get('college', 'Unknown'),
            'department': processed_major.get('department'),
            'totalCredits': processed_major.get('totalCredits', 120),
            'description': processed_major.get('description'),
            'url': processed_major.get('url', '')
        }