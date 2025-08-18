"""
Router module for schedule-related endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import (
    User, Schedule, ScheduledClass, Class as ClassModel, 
    CompletedCourse, create_engine_and_session
)
from backend.services import ClassService, ProfessorService
from pydantic import BaseModel


router = APIRouter(prefix="/api", tags=["schedules"])


# Pydantic models
class ScheduleResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    semester: str
    created_at: datetime
    class_ids: List[str]


class ScheduleUpdate(BaseModel):
    class_ids: List[str]
    colors: Optional[Dict[str, str]] = {}


class ValidationRequest(BaseModel):
    class_id: str
    schedule_id: int
    user_id: Optional[int] = None


# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/semesters")
async def get_available_semesters(db: Session = Depends(get_db)):
    """Get available semesters with metadata - current (Fall 2025) and future only."""
    from sqlalchemy import func
    
    # Define semester names
    semester_names = {
        "202410": "Fall 2024",
        "202420": "Spring 2025",
        "202510": "Fall 2025",
        "202520": "Spring 2026",
        "202530": "Summer 2025",
        "202630": "Summer 2026"
    }
    
    # Get class counts per semester
    semester_data = db.query(
        ClassModel.semester,
        func.count(ClassModel.id).label("class_count")
    ).group_by(ClassModel.semester).all()
    
    semesters = []
    for sem, count in semester_data:
        # Only include current semester (Fall 2025) and future semesters
        if sem >= "202510":
            semesters.append({
                "code": sem,
                "name": semester_names.get(sem, sem),
                "class_count": count,
                "is_summer": sem.endswith("30")
            })
    
    # Sort by semester code
    semesters.sort(key=lambda x: x["code"])
    
    return semesters


@router.get("/users/{github_id}/schedule/{semester}")
async def get_or_create_semester_schedule(
    github_id: str, 
    semester: str,
    db: Session = Depends(get_db)
):
    """Get or create user's schedule for a specific semester."""
    from database.models import CompletedCourse
    
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get or create schedule for this semester
    schedule = db.query(Schedule).filter(
        Schedule.user_id == user.id,
        Schedule.semester == semester
    ).first()
    
    if not schedule:
        # Create schedule for this semester
        semester_names = {
            "202410": "Fall 2024",
            "202420": "Spring 2025",
            "202510": "Fall 2025",
            "202520": "Spring 2026",
            "202530": "Summer 2025",
            "202630": "Summer 2026"
        }
        
        semester_name = semester_names.get(semester, semester)
        
        schedule = Schedule(
            user_id=user.id,
            name=f"{semester_name} Schedule",
            is_active=False,  # Will be set active when user switches to it
            semester=semester
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        
        # Check for completed courses in this semester and auto-populate
        completed_courses = db.query(CompletedCourse).filter(
            CompletedCourse.user_id == user.id,
            CompletedCourse.semester_completed == semester_name
        ).all()
        
        if completed_courses:
            print(f"Found {len(completed_courses)} completed courses for {semester_name}")
            
            # For each completed course, create or find a synthetic class entry
            for completed_course in completed_courses:
                # Parse course code - handle cases like "C S 2414" or "MATH 3333"
                parts = completed_course.course_code.split()
                if len(parts) >= 2:
                    # Handle multi-word subjects like "C S", "A HI", "B AD"
                    if len(parts) >= 3 and len(parts[0]) <= 2:
                        # Case: "C S 2414" -> subject="C S", number="2414" 
                        subject = f"{parts[0]} {parts[1]}"
                        course_number = parts[2]
                    else:
                        # Case: "MATH 3333" -> subject="MATH", number="3333"
                        subject = parts[0]
                        course_number = parts[1]
                    
                    # Create synthetic class ID for completed courses
                    synthetic_class_id = f"COMPLETED-{subject}-{course_number}-{semester}"
                    
                    # Check if we already have this synthetic class
                    existing_class = db.query(ClassModel).filter(
                        ClassModel.id == synthetic_class_id
                    ).first()
                    
                    if not existing_class:
                        # Try to find the original class in the semester to preserve meeting times
                        original_class = db.query(ClassModel).filter(
                            ClassModel.subject == subject,
                            ClassModel.courseNumber == course_number,
                            ClassModel.semester == semester,
                            ClassModel.type != "Completed Course"
                        ).first()
                        
                        if original_class:
                            # Use the original class as the scheduled class (but mark as completed)
                            existing_class = original_class
                        else:
                            # Create synthetic class entry for completed course (fallback)
                            synthetic_class = ClassModel(
                                id=synthetic_class_id,
                                subject=subject,
                                courseNumber=course_number,
                                section="COMPLETED",
                                title=completed_course.course_name or f"{subject} {course_number}",
                                instructor="Completed",
                                credits=completed_course.credits,
                                semester=semester,
                                type="Completed Course",
                                availableSeats=0,
                                totalSeats=0
                            )
                            db.add(synthetic_class)
                            db.flush()  # Get the ID
                            existing_class = synthetic_class
                    
                    # Check if already scheduled
                    existing_scheduled = db.query(ScheduledClass).filter(
                        ScheduledClass.schedule_id == schedule.id,
                        ScheduledClass.class_id == synthetic_class_id
                    ).first()
                    
                    if not existing_scheduled:
                        # Create scheduled class entry
                        scheduled_class = ScheduledClass(
                            schedule_id=schedule.id,
                            class_id=synthetic_class_id,
                            color="#10b981"  # Green for completed courses
                        )
                        db.add(scheduled_class)
                        print(f"  Added completed course {subject} {course_number} to schedule")
            
            db.commit()
    
    # Get scheduled classes with full details
    class_service = ClassService(db)
    professor_service = ProfessorService(db)
    scheduled_classes = []
    
    for sc in schedule.scheduled_classes:
        cls = sc.class_
        ratings = professor_service.get_rating(cls.id, cls.instructor)
        time_str = class_service.format_meeting_times(cls.meetingTimes)
        days = [mt.days for mt in cls.meetingTimes if mt.days]
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"
        
        # Clean up title (remove "Lab-" prefix if present)
        clean_title = cls.title
        if clean_title.startswith("Lab-"):
            clean_title = clean_title[4:]
        
        scheduled_classes.append({
            "id": cls.id,
            "subject": cls.subject,
            "number": cls.courseNumber,
            "title": clean_title,
            "instructor": cls.instructor or "TBA",
            "credits": cls.credits or 3,
            "time": time_str,
            "location": location,
            "days": days,
            "type": cls.type or "",
            "color": sc.color,
            "available_seats": cls.availableSeats or 0,
            "total_seats": cls.totalSeats or 0,
            "rating": ratings["rating"],
            "difficulty": ratings["difficulty"],
            "wouldTakeAgain": ratings["wouldTakeAgain"],
            "prerequisites": []  # Add empty prerequisites array for compatibility
        })
    
    return {
        "schedule_id": schedule.id,
        "schedule_name": schedule.name,
        "semester": schedule.semester,
        "classes": scheduled_classes
    }


@router.get("/users/{github_id}/active-schedule")
async def get_active_schedule(github_id: str, db: Session = Depends(get_db)):
    """Get user's active schedule with full class details."""
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get active schedule
    schedule = db.query(Schedule).filter(
        Schedule.user_id == user.id,
        Schedule.is_active == True
    ).first()
    
    if not schedule:
        # Create default schedule if none exists
        schedule = Schedule(
            user_id=user.id,
            name="Spring 2025 Schedule",
            is_active=True,
            semester="202420"  # Spring 2025
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
    
    # Get scheduled classes with full details
    class_service = ClassService(db)
    professor_service = ProfessorService(db)
    scheduled_classes = []
    
    for sc in schedule.scheduled_classes:
        cls = sc.class_
        ratings = professor_service.get_rating(cls.id, cls.instructor)
        time_str = class_service.format_meeting_times(cls.meetingTimes)
        days = [mt.days for mt in cls.meetingTimes if mt.days]
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"
        
        # Clean up title (remove "Lab-" prefix if present)
        clean_title = cls.title
        if clean_title.startswith("Lab-"):
            clean_title = clean_title[4:]
        
        scheduled_classes.append({
            "id": cls.id,
            "subject": cls.subject,
            "number": cls.courseNumber,
            "title": clean_title,
            "instructor": cls.instructor or "TBA",
            "credits": cls.credits or 3,
            "time": time_str,
            "location": location,
            "days": days,
            "type": cls.type or "",
            "color": sc.color,
            "available_seats": cls.availableSeats or 0,
            "total_seats": cls.totalSeats or 0,
            "rating": ratings["rating"],
            "difficulty": ratings["difficulty"],
            "wouldTakeAgain": ratings["wouldTakeAgain"],
            "prerequisites": []  # Add empty prerequisites array for compatibility
        })
    
    return {
        "schedule_id": schedule.id,
        "schedule_name": schedule.name,
        "classes": scheduled_classes
    }


@router.put("/schedules/{schedule_id}/classes")
async def update_schedule_classes(
    schedule_id: int,
    update: ScheduleUpdate,
    db: Session = Depends(get_db)
):
    """Update classes in a schedule (add/remove)."""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Remove all existing scheduled classes
    db.query(ScheduledClass).filter(ScheduledClass.schedule_id == schedule_id).delete()
    
    # Add new scheduled classes
    for class_id in update.class_ids:
        # Verify class exists
        cls = db.query(ClassModel).filter(ClassModel.id == class_id).first()
        if not cls:
            continue
        
        color = update.colors.get(class_id, "#3b82f6")
        scheduled_class = ScheduledClass(
            schedule_id=schedule_id,
            class_id=class_id,
            color=color
        )
        db.add(scheduled_class)
    
    schedule.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Schedule updated successfully", "class_count": len(update.class_ids)}


@router.get("/schedules/{schedule_id}")
async def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Get a specific schedule by ID."""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    class_ids = [sc.class_id for sc in schedule.scheduled_classes]
    
    return ScheduleResponse(
        id=schedule.id,
        name=schedule.name,
        is_active=schedule.is_active,
        semester=schedule.semester,
        created_at=schedule.created_at,
        class_ids=class_ids
    )


@router.post("/users/{user_id}/schedules")
async def create_schedule(
    user_id: int,
    name: str,
    semester: str = "202510",
    db: Session = Depends(get_db)
):
    """Create a new schedule for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Deactivate other schedules if this will be active
    db.query(Schedule).filter(
        Schedule.user_id == user_id
    ).update({"is_active": False})
    
    schedule = Schedule(
        user_id=user_id,
        name=name,
        is_active=True,
        semester=semester
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    
    return ScheduleResponse(
        id=schedule.id,
        name=schedule.name,
        is_active=schedule.is_active,
        semester=schedule.semester,
        created_at=schedule.created_at,
        class_ids=[]
    )


@router.post("/users/{github_id}/clean-duplicate-schedules")
async def clean_duplicate_scheduled_classes(
    github_id: str,
    db: Session = Depends(get_db)
):
    """Remove duplicate scheduled classes for a user across all schedules."""
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all schedules for the user
    schedules = db.query(Schedule).filter(Schedule.user_id == user.id).all()
    
    removed_count = 0
    cleaned_schedules = []
    
    for schedule in schedules:
        # Get all scheduled classes for this schedule
        scheduled_classes = db.query(ScheduledClass).join(ClassModel).filter(
            ScheduledClass.schedule_id == schedule.id
        ).all()
        
        # Group by subject + course number to find duplicates
        course_groups = {}
        for sc in scheduled_classes:
            cls = sc.class_
            course_key = f"{cls.subject}-{cls.courseNumber}"
            
            if course_key not in course_groups:
                course_groups[course_key] = []
            course_groups[course_key].append(sc)
        
        # For each course with duplicates, keep only the best one
        schedule_cleaned = False
        for course_key, duplicate_classes in course_groups.items():
            if len(duplicate_classes) > 1:
                schedule_cleaned = True
                # Sort by preference: original class > completed class > synthetic class
                def sort_priority(sc):
                    cls = sc.class_
                    if cls.type == "Completed Course":
                        return 2  # Completed courses are lower priority
                    elif cls.id.startswith("COMPLETED-"):
                        return 3  # Synthetic classes are lowest priority
                    else:
                        return 1  # Original classes are highest priority
                
                duplicate_classes.sort(key=sort_priority)
                
                # Keep the first (best) one, remove the rest
                to_keep = duplicate_classes[0]
                to_remove = duplicate_classes[1:]
                
                print(f"  Keeping: {to_keep.class_.id}")
                for sc in to_remove:
                    print(f"  Removing duplicate: {sc.class_.id}")
                    db.delete(sc)
                    removed_count += 1
        
        if schedule_cleaned:
            cleaned_schedules.append(schedule.name)
    
    db.commit()
    
    return {
        "message": f"Removed {removed_count} duplicate scheduled classes",
        "removed_count": removed_count,
        "cleaned_schedules": cleaned_schedules
    }


@router.post("/users/{github_id}/migrate-completed-courses")
async def migrate_completed_courses_to_schedules(
    github_id: str,
    db: Session = Depends(get_db)
):
    """Migrate all completed courses to scheduled classes for a user."""
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Semester name to code mapping
    semester_map = {
        "Fall 2024": "202410",
        "Spring 2025": "202420",
        "Summer 2025": "202430",
        "Fall 2025": "202510",
        "Spring 2026": "202520",
        "Summer 2026": "202530",
        "Fall 2023": "202310",
        "Spring 2024": "202320",
        "Summer 2024": "202330",
        "Fall 2022": "202210",
        "Spring 2023": "202220",
        "Summer 2023": "202230",
    }
    
    # Get all completed courses for the user
    completed_courses = db.query(CompletedCourse).filter(
        CompletedCourse.user_id == user.id
    ).all()
    
    migrated_count = 0
    errors = []
    
    for completed_course in completed_courses:
        semester_code = semester_map.get(completed_course.semester_completed)
        if not semester_code:
            errors.append(f"Unknown semester: {completed_course.semester_completed}")
            continue
        
        # Get or create schedule for this semester
        schedule = db.query(Schedule).filter(
            Schedule.user_id == user.id,
            Schedule.semester == semester_code
        ).first()
        
        if not schedule:
            schedule = Schedule(
                user_id=user.id,
                name=f"{completed_course.semester_completed} Schedule",
                is_active=False,
                semester=semester_code
            )
            db.add(schedule)
            db.flush()
        
        # Parse course code - handle cases like "C S 2414" or "MATH 3333"
        parts = completed_course.course_code.split()
        if len(parts) >= 2:
            # Handle multi-word subjects like "C S", "A HI", "B AD"
            if len(parts) >= 3 and len(parts[0]) <= 2:
                # Case: "C S 2414" -> subject="C S", number="2414" 
                subject = f"{parts[0]} {parts[1]}"
                course_number = parts[2]
            else:
                # Case: "MATH 3333" -> subject="MATH", number="3333"
                subject = parts[0]
                course_number = parts[1]
            
            # ENHANCED DEDUPLICATION: Check if this course is already scheduled in ANY form
            existing_scheduled = db.query(ScheduledClass).join(ClassModel).filter(
                ScheduledClass.schedule_id == schedule.id,
                ClassModel.subject == subject,
                ClassModel.courseNumber == course_number
            ).first()
            
            if existing_scheduled:
                print(f"  Course {subject} {course_number} already scheduled in {completed_course.semester_completed}, skipping")
                continue
            
            # Try to find the original class in the semester to preserve meeting times
            original_class = db.query(ClassModel).filter(
                ClassModel.subject == subject,
                ClassModel.courseNumber == course_number,
                ClassModel.semester == semester_code,
                ClassModel.type != "Completed Course"
            ).first()
            
            if original_class:
                # Use the original class as the scheduled class
                class_to_schedule = original_class
                print(f"  Using original class {original_class.id} for {subject} {course_number}")
            else:
                # Create synthetic class ID for completed courses
                synthetic_class_id = f"COMPLETED-{subject}-{course_number}-{semester_code}"
                
                # Check if we already have this synthetic class
                existing_synthetic = db.query(ClassModel).filter(
                    ClassModel.id == synthetic_class_id
                ).first()
                
                if existing_synthetic:
                    class_to_schedule = existing_synthetic
                else:
                    # Create synthetic class entry for completed course (fallback)
                    synthetic_class = ClassModel(
                        id=synthetic_class_id,
                        subject=subject,
                        courseNumber=course_number,
                        section="COMPLETED",
                        title=completed_course.course_name or f"{subject} {course_number}",
                        instructor="Completed",
                        credits=completed_course.credits,
                        semester=semester_code,
                        type="Completed Course",
                        availableSeats=0,
                        totalSeats=0
                    )
                    db.add(synthetic_class)
                    db.flush()
                    class_to_schedule = synthetic_class
                    print(f"  Created synthetic class {synthetic_class_id} for {subject} {course_number}")
            
            # Schedule the class
            scheduled_class = ScheduledClass(
                schedule_id=schedule.id,
                class_id=class_to_schedule.id,
                color="#10b981"  # Green for completed courses
            )
            db.add(scheduled_class)
            migrated_count += 1
            print(f"  Scheduled {subject} {course_number} in {completed_course.semester_completed}")
    
    db.commit()
    
    return {
        "message": f"Migrated {migrated_count} completed courses to scheduled classes",
        "migrated_count": migrated_count,
        "errors": errors if errors else None
    }


@router.post("/schedules/{schedule_id}/validate-time")
async def validate_time_conflicts(
    schedule_id: int,
    request: ValidationRequest,
    db: Session = Depends(get_db)
):
    """Check if a class has time conflicts with existing schedule."""
    class_service = ClassService(db)
    result = class_service.check_time_conflicts(request.class_id, schedule_id)
    return result


@router.post("/schedules/{schedule_id}/validate-prerequisites")
async def validate_prerequisites(
    schedule_id: int,
    request: ValidationRequest,
    db: Session = Depends(get_db)
):
    """Check if prerequisites are met for a class."""
    # Always get user_id from the schedule - this ensures we use the correct database user ID
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    user_id = schedule.user_id
    
    class_service = ClassService(db)
    result = class_service.check_prerequisites(request.class_id, user_id, schedule_id)
    return result