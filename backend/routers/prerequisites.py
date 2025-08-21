"""
Router module for prerequisite and flowchart endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Dict, Any
from pydantic import BaseModel

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import (
    User, Schedule, ScheduledClass, Class as ClassModel, 
    CompletedCourse, Prerequisite, MajorCourse, Major,
    create_engine_and_session
)
from backend.services import ClassService

router = APIRouter(prefix="/api", tags=["prerequisites"])

# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class BulkPrerequisiteRequest(BaseModel):
    course_codes: List[str]  # List of course codes like ["MATH 2423", "C S 2813"]


@router.post("/prerequisites/bulk")
async def get_bulk_prerequisites(
    request: BulkPrerequisiteRequest,
    db: Session = Depends(get_db)
):
    """Get prerequisites for multiple courses at once."""
    class_service = ClassService(db)
    prerequisites_map = {}
    
    for course_code in request.course_codes:
        # Parse course code
        parts = course_code.split()
        if len(parts) >= 2:
            # Handle multi-word subjects
            if len(parts) >= 3 and len(parts[0]) <= 2:
                subject = f"{parts[0]} {parts[1]}"
                course_number = parts[2]
            else:
                subject = parts[0]
                course_number = parts[1]
            
            # Find the class
            cls = db.query(ClassModel).filter(
                ClassModel.subject == subject,
                ClassModel.courseNumber == course_number
            ).first()
            
            if cls:
                prereqs = class_service.get_prerequisites(cls.id)
                prerequisites_map[course_code] = prereqs
            else:
                prerequisites_map[course_code] = []
    
    return prerequisites_map


@router.get("/flowchart/semester-courses/{provider_id}/{semester}")
async def get_semester_courses(
    provider_id: str,
    semester: str,
    db: Session = Depends(get_db)
):
    """Get all courses from a specific semester for flowchart."""
    user = db.query(User).filter(
        (User.github_id == provider_id) | (User.google_id == provider_id)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get schedule for this semester
    schedule = db.query(Schedule).filter(
        Schedule.user_id == user.id,
        Schedule.semester == semester
    ).first()
    
    courses = []
    
    if schedule:
        # Get scheduled classes
        for sc in schedule.scheduled_classes:
            cls = sc.class_
            courses.append({
                "code": f"{cls.subject} {cls.courseNumber}",
                "title": cls.title,
                "credits": cls.credits or 3,
                "instructor": cls.instructor,
                "type": cls.type,
                "status": "scheduled"
            })
    
    # Also get completed courses for this semester
    semester_names = {
        "202410": "Fall 2024",
        "202420": "Spring 2025",
        "202510": "Fall 2025",
        "202520": "Spring 2026",
        "202530": "Summer 2025",
        "202630": "Summer 2026"
    }
    
    semester_name = semester_names.get(semester)
    if semester_name:
        completed = db.query(CompletedCourse).filter(
            CompletedCourse.user_id == user.id,
            CompletedCourse.semester_completed == semester_name
        ).all()
        
        for comp in completed:
            courses.append({
                "code": comp.course_code,
                "title": comp.course_name,
                "credits": comp.credits,
                "grade": comp.grade,
                "status": "completed"
            })
    
    return {"courses": courses}


@router.get("/flowchart/completed-courses/{provider_id}")
async def get_completed_courses(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Get all completed courses for flowchart."""
    user = db.query(User).filter(
        (User.github_id == provider_id) | (User.google_id == provider_id)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    completed = db.query(CompletedCourse).filter(
        CompletedCourse.user_id == user.id
    ).all()
    
    courses = []
    for comp in completed:
        courses.append({
            "code": comp.course_code,
            "title": comp.course_name,
            "credits": comp.credits,
            "grade": comp.grade,
            "semester": comp.semester_completed,
            "status": "completed"
        })
    
    return {"courses": courses}


@router.get("/flowchart/major-courses/{provider_id}")
async def get_major_courses(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Get all major requirement courses for flowchart."""
    user = db.query(User).filter(
        (User.github_id == provider_id) | (User.google_id == provider_id)
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.major:
        return {"courses": []}
    
    # Find the major
    major = db.query(Major).filter(
        or_(
            Major.name == user.major,
            Major.name.like(f"{user.major}%"),
            Major.name.contains(user.major)
        )
    ).first()
    
    if not major:
        return {"courses": []}
    
    # Get all major courses
    major_courses = db.query(MajorCourse).join(
        MajorCourse.requirement
    ).filter(
        MajorCourse.requirement.has(majorId=major.id)
    ).all()
    
    courses = []
    for mc in major_courses:
        # Try to get actual class details
        cls = db.query(ClassModel).filter(
            ClassModel.subject == mc.subject,
            ClassModel.courseNumber == mc.courseNumber
        ).first()
        
        courses.append({
            "code": f"{mc.subject} {mc.courseNumber}",
            "title": cls.title if cls else mc.title,
            "credits": cls.credits if cls else mc.credits,
            "category": mc.requirement.categoryName,
            "status": "required"
        })
    
    return {"courses": courses}


@router.get("/flowchart/available-semesters")
async def get_available_semesters():
    """Get list of available semesters for dropdown."""
    return {
        "semesters": [
            {"code": "202410", "name": "Fall 2024"},
            {"code": "202420", "name": "Spring 2025"},
            {"code": "202510", "name": "Fall 2025"},
            {"code": "202520", "name": "Spring 2026"},
            {"code": "202530", "name": "Summer 2025"},
            {"code": "202630", "name": "Summer 2026"}
        ]
    }


class AddCourseRequest(BaseModel):
    course_code: str


@router.post("/flowchart/add-course")
async def add_single_course(
    request: AddCourseRequest,
    db: Session = Depends(get_db)
):
    """Add a single course by code."""
    course_code = request.course_code
    # Parse course code
    parts = course_code.split()
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid course code format")
    
    # Handle multi-word subjects
    if len(parts) >= 3 and len(parts[0]) <= 2:
        subject = f"{parts[0]} {parts[1]}"
        course_number = parts[2]
    else:
        subject = parts[0]
        course_number = parts[1]
    
    # Find the class
    cls = db.query(ClassModel).filter(
        ClassModel.subject == subject,
        ClassModel.courseNumber == course_number
    ).first()
    
    if not cls:
        # Try to find in major courses
        mc = db.query(MajorCourse).filter(
            MajorCourse.subject == subject,
            MajorCourse.courseNumber == course_number
        ).first()
        
        if mc:
            return {
                "course": {
                    "code": course_code,
                    "title": mc.title,
                    "credits": mc.credits,
                    "status": "not-found"
                }
            }
        else:
            raise HTTPException(status_code=404, detail="Course not found")
    
    return {
        "course": {
            "code": course_code,
            "title": cls.title,
            "credits": cls.credits or 3,
            "instructor": cls.instructor,
            "type": cls.type,
            "status": "available"
        }
    }