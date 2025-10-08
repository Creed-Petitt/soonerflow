from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database.models import (
    User, Schedule, ScheduledClass, Class as ClassModel,
    get_db
)
from backend.services import ClassService, ProfessorService
from backend.auth.auth import get_current_user_optional
from backend.schemas import ScheduleUpdate, SemesterResponse


router = APIRouter(prefix="/api", tags=["schedules"])


@router.get("/semesters")
async def get_available_semesters(
    include_summers: bool = False,
    include_historical: bool = False,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func

    # Define semester names
    semester_names = {
        "202110": "Fall 2021",
        "202120": "Spring 2022",
        "202130": "Summer 2022",
        "202210": "Fall 2022",
        "202220": "Spring 2023",
        "202230": "Summer 2023",
        "202310": "Fall 2023",
        "202320": "Spring 2024",
        "202330": "Summer 2024",
        "202410": "Fall 2024",
        "202420": "Spring 2025",
        "202430": "Summer 2025",
        "202510": "Fall 2025",
        "202520": "Spring 2026",
        "202530": "Summer 2026",
        "202610": "Fall 2026",
        "202620": "Spring 2027",
        "202630": "Summer 2027"
    }

    # Get class counts per semester
    semester_data = db.query(
        ClassModel.semester,
        func.count(ClassModel.id).label("class_count")
    ).group_by(ClassModel.semester).all()

    semesters = []
    for sem, count in semester_data:
        is_summer = sem.endswith("30")

        # Apply filtering
        if not include_historical and sem < "202510":
            continue
        if not include_summers and is_summer:
            continue

        semesters.append({
            "code": sem,
            "name": semester_names.get(sem, sem),
            "class_count": count,
            "is_summer": is_summer
        })

    # Sort by semester code
    semesters.sort(key=lambda x: x["code"])

    return semesters


@router.get("/schedules/semester/{semester}")
async def get_or_create_schedule_for_semester(
    semester: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    # For anonymous users, always use schedule ID 1
    if not current_user:
        schedule = db.query(Schedule).filter(Schedule.id == 1).first()
        if not schedule:
            # Create a temporary schedule for anonymous users
            schedule = Schedule(
                id=1,
                user_id=None,
                name=f"Schedule {semester}",
                semester=semester,
                is_active=True
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)
    else:
        # For authenticated users, find or create semester-specific schedule
        schedule = db.query(Schedule).filter(
            Schedule.user_id == current_user.id,
            Schedule.semester == semester
        ).first()

        if not schedule:
            # Create new schedule for this semester
            semester_names = {
                "202110": "Fall 2021", "202120": "Spring 2022", "202130": "Summer 2022",
                "202210": "Fall 2022", "202220": "Spring 2023", "202230": "Summer 2023",
                "202310": "Fall 2023", "202320": "Spring 2024", "202330": "Summer 2024",
                "202410": "Fall 2024", "202420": "Spring 2025", "202430": "Summer 2025",
                "202510": "Fall 2025", "202520": "Spring 2026", "202530": "Summer 2026",
                "202610": "Fall 2026", "202620": "Spring 2027", "202630": "Summer 2027"
            }

            schedule_name = semester_names.get(semester, f"Schedule {semester}")
            schedule = Schedule(
                user_id=current_user.id,
                name=schedule_name,
                semester=semester,
                is_active=True
            )
            db.add(schedule)
            db.commit()
            db.refresh(schedule)

    # Get scheduled classes with full details (same logic as get_schedule)
    class_service = ClassService(db)
    professor_service = ProfessorService(db)
    scheduled_classes = []

    # Get all instructor names from the schedule
    instructor_names = [sc.class_.instructor for sc in schedule.scheduled_classes if sc.class_.instructor and sc.class_.instructor.upper() != "TBA"]

    # Get all professor ratings in a single batch
    try:
        all_ratings = professor_service.get_ratings_for_instructors(instructor_names)
    except Exception:
        all_ratings = {}

    for sc in schedule.scheduled_classes:
        cls = sc.class_

        # Get professor ratings from the pre-fetched dictionary
        ratings = all_ratings.get(cls.instructor, {"rating": None, "difficulty": None, "wouldTakeAgain": None})

        time_str = class_service.format_meeting_times(cls.meetingTimes)
        days = [mt.days for mt in cls.meetingTimes if mt.days]
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"

        # Clean up title
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
            "rating": ratings.get("rating"),
            "difficulty": ratings.get("difficulty"),
            "wouldTakeAgain": ratings.get("wouldTakeAgain"),
            "prerequisites": []
        })

    return {
        "schedule_id": schedule.id,
        "schedule_name": schedule.name,
        "semester": schedule.semester,
        "classes": scheduled_classes
    }


@router.get("/schedules/{schedule_id}")
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    if current_user:
        schedule = db.query(Schedule).filter(
            Schedule.id == schedule_id,
            Schedule.user_id == current_user.id
        ).first()
    else:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Get scheduled classes with full details
    class_service = ClassService(db)
    professor_service = ProfessorService(db)
    scheduled_classes = []

    # Get all instructor names from the schedule
    instructor_names = [sc.class_.instructor for sc in schedule.scheduled_classes if sc.class_.instructor and sc.class_.instructor.upper() != "TBA"]
    
    # Get all professor ratings in a single batch
    try:
        all_ratings = professor_service.get_ratings_for_instructors(instructor_names)
    except Exception:
        all_ratings = {}

    for sc in schedule.scheduled_classes:
        cls = sc.class_

        # Get professor ratings from the pre-fetched dictionary
        ratings = all_ratings.get(cls.instructor, {"rating": None, "difficulty": None, "wouldTakeAgain": None})

        time_str = class_service.format_meeting_times(cls.meetingTimes)
        days = [mt.days for mt in cls.meetingTimes if mt.days]
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"

        # Clean up title
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
            "rating": ratings.get("rating"),
            "difficulty": ratings.get("difficulty"),
            "wouldTakeAgain": ratings.get("wouldTakeAgain"),
            "prerequisites": []
        })

    return {
        "schedule_id": schedule.id,
        "schedule_name": schedule.name,
        "semester": schedule.semester,
        "classes": scheduled_classes
    }


@router.put("/schedules/{schedule_id}/classes")
async def update_schedule_classes(
    schedule_id: int,
    update: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    if current_user:
        schedule = db.query(Schedule).filter(
            Schedule.id == schedule_id,
            Schedule.user_id == current_user.id
        ).first()
    else:
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