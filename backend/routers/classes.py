"""
Router module for class-related endpoints.
"""
from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import get_database_url, create_engine_and_session
from backend.services import ClassService, ProfessorService
from backend.config import settings


router = APIRouter(prefix="/api/classes", tags=["classes"])


# Pydantic models
class ClassResponse(BaseModel):
    id: str
    subject: str
    number: str = ""
    title: str
    instructor: str
    credits: int = 3
    time: str
    location: str
    days: List[str]
    available_seats: int = 0
    total_seats: int = 0
    rating: float = 0.0
    difficulty: float = 0.0
    wouldTakeAgain: float = 0.0
    description: str = ""
    prerequisites: List[dict] = []
    genEd: str = ""
    type: str = ""
    sections: List[dict] = []
    ratingDistribution: List[int] = []
    tags: List[str] = []
    
    class Config:
        from_attributes = True


# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/departments")
async def get_departments(semester: Optional[str] = "202510", db: Session = Depends(get_db)):
    """Get all unique departments/subjects for a semester."""
    class_service = ClassService(db)
    departments = class_service.get_all_departments_with_counts(semester)
    return {"departments": departments}


@router.get("")
async def get_classes(
    subject: Optional[str] = None,
    search: Optional[str] = None,
    semester: Optional[str] = None,
    limit: Optional[int] = 500,
    page: Optional[int] = 1,
    skip_ratings: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    """Get all classes with optional filtering."""
    # Use ClassService for data retrieval
    class_service = ClassService(db)
    professor_service = ProfessorService(db)
    
    # Enforce max limit from settings
    if limit > settings.max_classes_per_request:
        limit = settings.max_classes_per_request
    
    # Get classes using service
    result = class_service.get_classes(
        subject=subject,
        search=search,
        semester=semester,
        limit=limit,
        page=page,
        skip_ratings=skip_ratings or limit > settings.skip_ratings_threshold
    )
    
    # Add professor ratings if not skipped
    if not skip_ratings and limit <= settings.skip_ratings_threshold:
        for cls_data in result["classes"]:
            ratings = professor_service.get_rating(cls_data["id"], cls_data["instructor"])
            cls_data.update(ratings)
    
    # Convert to response objects
    response_classes = [ClassResponse(**cls_data) for cls_data in result["classes"]]
    
    # Get filter options
    departments = class_service.get_departments()
    levels = ["Undergraduate", "Graduate"]
    creditOptions = [1, 2, 3, 4, 5, 6]
    semesters = ["Spring", "Fall", "Summer"]
    
    return {
        "classes": response_classes,
        "pagination": result["pagination"],
        "filters": {
            "departments": departments,
            "levels": levels,
            "credits": creditOptions,
            "semesters": semesters
        }
    }


@router.get("/all")
async def get_all_courses(db: Session = Depends(get_db)):
    """Get all unique courses for course selection modal."""
    from sqlalchemy import text
    
    # Get all unique courses with their details
    courses = db.execute(text("""
        SELECT DISTINCT 
            subject, 
            courseNumber, 
            title, 
            credits,
            subject || ' ' || courseNumber as code
        FROM classes 
        WHERE title NOT LIKE 'Lab-%'
        ORDER BY subject, courseNumber
    """)).fetchall()
    
    return {
        "courses": [
            {
                "id": f"{course.subject}-{course.courseNumber}",
                "subject": course.subject,
                "courseNumber": course.courseNumber,
                "code": course.code,
                "name": course.title,
                "title": course.title,
                "credits": course.credits or 3,
                "category": course.subject
            }
            for course in courses
        ]
    }


@router.get("/{class_id}")
async def get_class(class_id: str, db: Session = Depends(get_db)):
    """Get a single class by ID."""
    class_service = ClassService(db)
    professor_service = ProfessorService(db)
    
    cls_data = class_service.get_class_by_id(class_id)
    if not cls_data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Add professor ratings
    ratings = professor_service.get_rating(cls_data["id"], cls_data["instructor"])
    cls_data.update(ratings)
    
    return ClassResponse(**cls_data)


@router.get("/{class_id}/labs")
async def get_class_labs(class_id: str, db: Session = Depends(get_db)):
    """Get lab sections for a lecture class."""
    class_service = ClassService(db)
    
    labs = class_service.get_lab_sections_for_lecture(class_id)
    
    return {
        "labs": [ClassResponse(**lab) for lab in labs]
    }