from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session

from database.models import get_db, SessionLocal
from backend.services import ClassService, ProfessorService
from backend.config import settings
from backend.schemas import ClassResponse, DepartmentListResponse, CourseResponse


router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.get("/departments")
async def get_departments(semester: Optional[str] = "202510", db: Session = Depends(get_db)):
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
    # Use ClassService for data retrieval
    class_service = ClassService(db)
    
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
                    # Use a separate database session for professor service to prevent session poisoning
                    professor_db = SessionLocal()
                    try:
                        isolated_professor_service = ProfessorService(professor_db)
                        instructor_names = [cls["instructor"] for cls in result["classes"] if cls.get("instructor")]
                        all_ratings = isolated_professor_service.get_ratings_for_instructors(instructor_names)
        
                        for cls_data in result["classes"]:
                            ratings = all_ratings.get(cls_data["instructor"], {})
                            cls_data.update(ratings)
                    except Exception as e:
                        # Continue without ratings rather than failing the entire request
                        pass
                    finally:
                        try:
                            professor_db.close()
                        except:
                            pass    
    # Convert to response objects
    response_classes = [ClassResponse(**cls_data) for cls_data in result["classes"]]

    return {
        "classes": response_classes,
        "pagination": result["pagination"]
    }


@router.get("/all")
async def get_all_courses(db: Session = Depends(get_db)):
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
    class_service = ClassService(db)
    
    cls_data = class_service.get_class_by_id(class_id)
    if not cls_data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Add professor ratings with isolated session
    professor_db = SessionLocal()
    try:
        professor_service = ProfessorService(professor_db)
        ratings = professor_service.get_rating(cls_data["id"], cls_data["instructor"])
        cls_data.update(ratings)
    except Exception as e:
        # Continue without ratings
        pass
    finally:
        try:
            professor_db.close()
        except:
            pass
    
    return ClassResponse(**cls_data)


@router.get("/{class_id}/labs")
async def get_class_labs(class_id: str, db: Session = Depends(get_db)):
    class_service = ClassService(db)
    
    labs = class_service.get_lab_sections_for_lecture(class_id)
    
    return {
        "labs": [ClassResponse(**lab) for lab in labs]
    }