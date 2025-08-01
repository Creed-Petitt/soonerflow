import logging
import json
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import hashlib

import sys
import os
# Add the database directory to the path
database_path = os.path.join(os.getcwd(), 'database')
sys.path.append(database_path)
from models import create_engine_and_session, Major, Requirement, MajorCourse

class MajorDatabaseClient:
    """Database client for major requirements data"""
    
    def __init__(self):
        self.engine, self.SessionLocal = create_engine_and_session()
        self.logger = logging.getLogger(__name__)
    
    def get_session(self) -> Session:
        """Get a database session"""
        return self.SessionLocal()
    
    def _generate_major_id(self, url: str) -> str:
        """Generate a unique ID for a major based on URL"""
        return hashlib.md5(url.encode()).hexdigest()[:16]
    
    def _generate_requirement_id(self, major_id: str, category: str) -> str:
        """Generate a unique ID for a requirement"""
        combined = f"{major_id}_{category}"
        return hashlib.md5(combined.encode()).hexdigest()[:16]
    
    def _generate_course_id(self, requirement_id: str, subject: str, course_number: str) -> str:
        """Generate a unique ID for a course"""
        import time
        timestamp = str(int(time.time() * 1000000))  # Microsecond precision
        combined = f"{requirement_id}_{subject}_{course_number}_{timestamp}"
        return hashlib.md5(combined.encode()).hexdigest()[:16]
    
    def save_bachelor_degree(self, degree_data: Dict[str, Any]) -> bool:
        """Save bachelor's degree data to database"""
        session = self.get_session()
        
        try:
            major_id = self._generate_major_id(degree_data['url'])
            
            # Check if major already exists
            existing_major = session.query(Major).filter(Major.id == major_id).first()
            if existing_major:
                self.logger.info(f"Major {degree_data.get('title', 'Unknown')} already exists, updating...")
                major = existing_major
                # Clear existing requirements to update them
                session.query(Requirement).filter(Requirement.majorId == major_id).delete()
            else:
                # Create new major
                major = Major(
                    id=major_id,
                    name=degree_data.get('title', ''),
                    college=self._extract_college_from_url(degree_data['url']),
                    department=self._extract_department_from_url(degree_data['url']),
                    totalCredits=degree_data.get('credit_hours', 120),
                    description=degree_data.get('full_title', ''),
                    url=degree_data['url']
                )
                session.add(major)
            
            # Save program requirements
            if degree_data.get('program_requirements') and degree_data['program_requirements'].get('scraped_successfully'):
                self._save_requirement(
                    session, major_id, "Program Requirements", 
                    degree_data['program_requirements']
                )
            
            # Save degree requirements  
            if degree_data.get('degree_requirements') and degree_data['degree_requirements'].get('scraped_successfully'):
                self._save_requirement(
                    session, major_id, "Degree Requirements",
                    degree_data['degree_requirements']
                )
            
            # Flush to get any constraint violations early
            session.flush()
            session.commit()
            self.logger.info(f"Successfully saved major: {degree_data.get('title', 'Unknown')}")
            return True
            
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error saving major {degree_data.get('title', 'Unknown')}: {str(e)}")
            return False
        finally:
            session.close()
    
    def _save_requirement(self, session: Session, major_id: str, category: str, requirement_data: Dict[str, Any]):
        """Save a requirement category and its courses"""
        
        requirement_id = self._generate_requirement_id(major_id, category)
        
        # Create requirement
        requirement = Requirement(
            id=requirement_id,
            majorId=major_id,
            categoryName=category,
            creditsNeeded=0,  # TODO: Extract from content if needed
            description=requirement_data.get('content', '')[:1000]  # Limit length
        )
        session.add(requirement)
        
        # Add courses for this requirement - remove duplicates first
        course_codes = list(set(requirement_data.get('course_codes', [])))  # Remove duplicates
        for course_code in course_codes:
            parts = course_code.split()
            if len(parts) == 2:
                subject = parts[0]
                course_number = parts[1]
                
                course_id = self._generate_course_id(requirement_id, subject, course_number)
                
                # Check if this course already exists for this requirement
                existing_course = session.query(MajorCourse).filter(
                    MajorCourse.requirementId == requirement_id,
                    MajorCourse.subject == subject,
                    MajorCourse.courseNumber == course_number
                ).first()
                
                if not existing_course:
                    major_course = MajorCourse(
                        id=course_id,
                        requirementId=requirement_id,
                        subject=subject,
                        courseNumber=course_number,
                        title="",  # We don't have titles from the scraper
                        credits=3  # Default to 3 credits
                    )
                    session.add(major_course)
    
    def _extract_college_from_url(self, url: str) -> str:
        """Extract college name from URL path"""
        parts = url.strip('/').split('/')
        if len(parts) >= 3:
            college_part = parts[3]  # e.g., "price-business"
            return college_part.replace('-', ' ').title()
        return "Unknown College"
    
    def _extract_department_from_url(self, url: str) -> str:
        """Extract department name from URL path"""
        parts = url.strip('/').split('/')
        if len(parts) >= 4:
            dept_part = parts[4]  # e.g., "steed-accounting"
            return dept_part.replace('-', ' ').title()
        return "Unknown Department"
    
    def verify_major_in_database(self, url: str) -> Optional[Dict[str, Any]]:
        """Verify a major exists in database and return its data"""
        session = self.get_session()
        
        try:
            major_id = self._generate_major_id(url)
            major = session.query(Major).filter(Major.id == major_id).first()
            
            if not major:
                return None
            
            # Get requirements and courses
            requirements = session.query(Requirement).filter(Requirement.majorId == major_id).all()
            
            result = {
                "id": major.id,
                "name": major.name,
                "college": major.college,
                "department": major.department,
                "total_credits": major.totalCredits,
                "url": major.url,
                "requirements": []
            }
            
            for req in requirements:
                courses = session.query(MajorCourse).filter(MajorCourse.requirementId == req.id).all()
                
                req_data = {
                    "category": req.categoryName,
                    "credits_needed": req.creditsNeeded,
                    "description_length": len(req.description or ""),
                    "course_count": len(courses),
                    "courses": [f"{c.subject} {c.courseNumber}" for c in courses]
                }
                result["requirements"].append(req_data)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error verifying major in database: {str(e)}")
            return None
        finally:
            session.close()
    
    def get_all_majors_summary(self) -> List[Dict[str, Any]]:
        """Get summary of all majors in database"""
        session = self.get_session()
        
        try:
            majors = session.query(Major).all()
            
            summary = []
            for major in majors:
                req_count = session.query(Requirement).filter(Requirement.majorId == major.id).count()
                course_count = session.query(MajorCourse).join(Requirement).filter(Requirement.majorId == major.id).count()
                
                summary.append({
                    "name": major.name,
                    "college": major.college,
                    "department": major.department,
                    "total_credits": major.totalCredits,
                    "requirement_categories": req_count,
                    "total_courses": course_count,
                    "url": major.url
                })
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Error getting majors summary: {str(e)}")
            return []
        finally:
            session.close()