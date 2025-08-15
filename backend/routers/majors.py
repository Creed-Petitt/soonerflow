"""
Router module for major-related endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import Major, create_engine_and_session


router = APIRouter(prefix="/api", tags=["majors"])


# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/majors")
async def get_majors(db: Session = Depends(get_db)):
    """Get all available majors."""
    majors = db.query(Major).all()
    return [
        {
            "id": major.id,
            "name": major.name,
            "department": major.department,
            "college": major.college,
        }
        for major in majors
    ]


@router.get("/major-courses")
async def get_major_courses(major_name: str, db: Session = Depends(get_db)):
    """Get all courses for a specific major by name."""
    # Find the major - try exact match first
    major = db.query(Major).filter(Major.name == major_name).first()
    
    # If no exact match, try partial match (for "Computer Science" vs "Computer Science, B.S.")
    if not major:
        major = db.query(Major).filter(Major.name.like(f"{major_name}%")).first()
    
    # If still no match, try contains
    if not major:
        major = db.query(Major).filter(Major.name.contains(major_name)).first()
    
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    
    # Get all courses across all requirements for this major, with actual titles from classes table
    courses = db.execute(text("""
        SELECT 
            mc.subject, 
            mc.courseNumber, 
            COALESCE(c.title, mc.title) as title, 
            COALESCE(c.credits, mc.credits, 3) as credits, 
            r.categoryName
        FROM major_courses mc
        JOIN requirements r ON mc.requirementId = r.id
        LEFT JOIN (
            SELECT DISTINCT subject, courseNumber, title, credits
            FROM classes 
            WHERE title NOT LIKE 'Lab-%'
        ) c ON mc.subject = c.subject AND mc.courseNumber = c.courseNumber
        WHERE r.majorId = :major_id
        ORDER BY r.categoryName, mc.subject, mc.courseNumber
    """), {"major_id": major.id}).fetchall()
    
    return [
        {
            "subject": course.subject,
            "courseNumber": course.courseNumber,
            "title": course.title or f"{course.subject} {course.courseNumber}",
            "credits": course.credits or 3,
            "category": course.categoryName
        }
        for course in courses
    ]


@router.get("/majors/{major_id}")
async def get_major(major_id: str, db: Session = Depends(get_db)):
    """Get a specific major by ID."""
    major = db.query(Major).filter(Major.id == major_id).first()
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    
    return {
        "id": major.id,
        "name": major.name,
        "department": major.department,
        "college": major.college,
        "totalCredits": major.totalCredits,
        "description": major.description,
        "url": major.url
    }


@router.get("/majors/{major_id}/requirements")
async def get_major_requirements(major_id: str, db: Session = Depends(get_db)):
    """Get requirements for a specific major."""
    major = db.query(Major).filter(Major.id == major_id).first()
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    
    requirements = []
    for req in major.requirements:
        courses = []
        for course in req.courses:
            courses.append({
                "subject": course.subject,
                "courseNumber": course.courseNumber,
                "title": course.title,
                "credits": course.credits
            })
        
        requirements.append({
            "id": req.id,
            "categoryName": req.categoryName,
            "creditsNeeded": req.creditsNeeded,
            "description": req.description,
            "courses": courses
        })
    
    return {
        "major": {
            "id": major.id,
            "name": major.name,
            "totalCredits": major.totalCredits
        },
        "requirements": requirements
    }