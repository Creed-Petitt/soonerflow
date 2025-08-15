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
    create_engine_and_session
)
from backend.services import ClassService, ProfessorService


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


# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
            semester="202510"
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
            "wouldTakeAgain": ratings["wouldTakeAgain"]
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