"""
Router module for user-related endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import User, CompletedCourse, Schedule, Major, ScheduledClass, Class as ClassModel, create_engine_and_session
from backend.auth import verify_api_key, verify_user_access


router = APIRouter(prefix="/api", tags=["users"])


# Pydantic models
class UserCreate(BaseModel):
    github_id: str
    email: str
    name: str
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    github_id: str
    email: str
    name: str
    avatar_url: Optional[str]
    major: Optional[str]
    created_at: datetime
    

class MajorUpdate(BaseModel):
    major: str

class ProfileUpdate(BaseModel):
    major: Optional[str] = None
    enrollment_year: Optional[int] = None
    graduation_year: Optional[int] = None


class DashboardData(BaseModel):
    creditsCompleted: int
    totalCredits: int
    gpa: Optional[float]
    enrollmentYear: Optional[int]
    graduationYear: Optional[int]
    majorName: Optional[str]
    completedCourses: List[dict]


class CourseToAdd(BaseModel):
    code: str
    name: str
    credits: int
    grade: str


class AddCoursesRequest(BaseModel):
    semester: str
    courses: List[CourseToAdd]


# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/auth/user", response_model=UserResponse)
async def create_or_update_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create or update user from GitHub OAuth."""
    # Check if user exists
    user = db.query(User).filter(User.github_id == user_data.github_id).first()
    
    if user:
        # Update existing user
        user.email = user_data.email
        user.name = user_data.name
        user.avatar_url = user_data.avatar_url
    else:
        # Create new user
        user = User(
            github_id=user_data.github_id,
            email=user_data.email,
            name=user_data.name,
            avatar_url=user_data.avatar_url
        )
        db.add(user)
        db.flush()
        
        # Create default schedule for new user
        default_schedule = Schedule(
            user_id=user.id,
            name="Spring 2025 Schedule",
            is_active=True,
            semester="202420"  # Spring 2025
        )
        db.add(default_schedule)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        github_id=user.github_id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        major=user.major,
        created_at=user.created_at
    )


@router.get("/users/{github_id}", response_model=UserResponse)
async def get_user(
    github_id: str, 
    api_key_valid: bool = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Get user by GitHub ID."""
    # With API key auth, we trust the frontend to send correct github_id
    
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        github_id=user.github_id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        major=user.major,
        created_at=user.created_at
    )


@router.put("/users/{github_id}/major")
async def update_user_major(
    github_id: str, 
    major_data: MajorUpdate, 
    api_key_valid: bool = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Update user's selected major."""
    # With API key auth, we trust the frontend
    
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.major = major_data.major
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Major updated successfully", "major": major_data.major}


@router.put("/users/{github_id}/profile")
async def update_user_profile(
    github_id: str, 
    profile_data: ProfileUpdate, 
    api_key_valid: bool = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Update user's profile including major and graduation years."""
    # With API key auth, we trust the frontend
    
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if profile_data.major is not None:
        user.major = profile_data.major
        # Try to find major ID from name
        major = db.query(Major).filter(Major.name == profile_data.major).first()
        if major:
            user.major_id = major.id
    
    if profile_data.enrollment_year is not None:
        user.enrollment_year = profile_data.enrollment_year
    
    if profile_data.graduation_year is not None:
        user.graduation_year = profile_data.graduation_year
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "major": user.major,
        "enrollment_year": user.enrollment_year,
        "graduation_year": user.graduation_year
    }



@router.get("/users/{github_id}/completed-courses")
async def get_user_completed_courses(
    github_id: str,
    api_key_valid: bool = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Get user's completed courses."""
    # With API key auth, we trust the frontend
    
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    completed_courses = db.query(CompletedCourse).filter(
        CompletedCourse.user_id == user.id
    ).all()
    
    courses_list = []
    for course in completed_courses:
        # Parse course_code - handle multi-word subjects like "C S"
        if course.course_code:
            parts = course.course_code.split()
            if len(parts) >= 2:
                # Last part is course number if it contains digits
                if any(char.isdigit() for char in parts[-1]):
                    subject = ' '.join(parts[:-1])
                    course_number = parts[-1]
                else:
                    subject = course.course_code
                    course_number = ""
            else:
                subject = course.course_code
                course_number = ""
        else:
            subject = ""
            course_number = ""
            
        courses_list.append({
            "subject": subject,
            "courseNumber": course_number,
            "name": course.course_name or "",
            "credits": course.credits,
            "grade": course.grade,
            "semester": course.semester_completed
        })
    
    return {"courses": courses_list}

@router.get("/user/courses/completed")
async def get_completed_courses(
    user_email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get completed courses for a user."""
    if not user_email:
        return {"completedCourses": []}
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        return {"completedCourses": []}
    
    completed_courses = db.query(CompletedCourse).filter(
        CompletedCourse.user_id == user.id
    ).all()
    
    return {
        "completedCourses": [
            {
                "course_code": course.course_code,
                "course_name": course.course_name,
                "credits": course.credits,
                "grade": course.grade,
                "semester": course.semester_completed
            }
            for course in completed_courses
        ]
    }


@router.post("/user/courses/completed")
async def add_completed_courses(
    request: AddCoursesRequest,
    user_email: str = Query(...),
    auto_sync_schedules: bool = Query(True, description="Automatically sync with semester schedules"),
    db: Session = Depends(get_db)
):
    """Add completed courses for a user and optionally sync with semester schedules."""
    if not user_email:
        raise HTTPException(status_code=400, detail="User email is required")
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # First, remove all existing completed courses for this semester
    db.query(CompletedCourse).filter(
        CompletedCourse.user_id == user.id,
        CompletedCourse.semester_completed == request.semester
    ).delete()
    
    # Then add all the new courses
    added_courses = []
    for course_data in request.courses:
        completed_course = CompletedCourse(
            user_id=user.id,
            course_code=course_data.code,
            course_name=course_data.name,
            credits=course_data.credits,
            grade=course_data.grade,
            semester_completed=request.semester
        )
        db.add(completed_course)
        added_courses.append(course_data.code)
    
    db.commit()
    
    # Auto-sync with schedules if requested
    schedule_sync_message = ""
    if auto_sync_schedules:
        try:
            # Call the migration endpoint to sync the newly added courses
            from backend.routers.schedules import migrate_completed_courses_to_schedules
            
            # Get user by github_id (need to get github_id from email)
            if user.github_id:
                sync_result = await migrate_completed_courses_to_schedules(user.github_id, db)
                if sync_result.get("migrated_count", 0) > 0:
                    schedule_sync_message = f" Synced {sync_result['migrated_count']} courses to schedules."
        except Exception as e:
            print(f"Failed to auto-sync schedules: {e}")
            schedule_sync_message = " (Schedule sync failed)"
    
    return {
        "success": True,
        "message": f"Added {len(added_courses)} courses to {request.semester}{schedule_sync_message}",
        "added_courses": added_courses
    }


@router.delete("/user/courses/complete/{course_code}")
async def remove_completed_course(
    course_code: str,
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a course from completed status and all semester schedules."""
    if not user_email or not course_code:
        raise HTTPException(status_code=400, detail="Email and course code are required")
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find and delete the completed course
    completed_course = db.query(CompletedCourse).filter(
        CompletedCourse.user_id == user.id,
        CompletedCourse.course_code == course_code
    ).first()
    
    if not completed_course:
        return {"success": False, "message": f"Course {course_code} not found in completed courses"}
    
    # Parse course code to extract subject and course number
    parts = course_code.split()
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
        
        # Remove course from ALL semester schedules for this user
        schedules_updated = []
        user_schedules = db.query(Schedule).filter(Schedule.user_id == user.id).all()
        
        for schedule in user_schedules:
            # Find scheduled classes for this course in this schedule
            scheduled_classes_to_remove = db.query(ScheduledClass).join(ClassModel).filter(
                ScheduledClass.schedule_id == schedule.id,
                ClassModel.subject == subject,
                ClassModel.courseNumber == course_number
            ).all()
            
            if scheduled_classes_to_remove:
                schedules_updated.append(schedule.name)
                for sc in scheduled_classes_to_remove:
                    print(f"  Removing {course_code} from schedule: {schedule.name}")
                    db.delete(sc)
        
        # Remove the completed course record
        db.delete(completed_course)
        db.commit()
        
        message = f"Removed {course_code} from completed courses"
        if schedules_updated:
            message += f" and from schedules: {', '.join(schedules_updated)}"
        
        return {
            "success": True, 
            "message": message,
            "schedules_updated": schedules_updated
        }
    else:
        # Invalid course code format - just remove from completed courses
        db.delete(completed_course)
        db.commit()
        return {"success": True, "message": f"Removed {course_code} from completed courses"}


@router.get("/user/dashboard", response_model=DashboardData)
async def get_user_dashboard(
    user_email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get user dashboard data including credits, GPA, and progress"""
    
    if not user_email:
        # Return default data if no email provided
        return DashboardData(
            creditsCompleted=0,
            totalCredits=120,
            gpa=None,
            enrollmentYear=None,
            graduationYear=None,
            majorName=None,
            completedCourses=[]
        )
    
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        return DashboardData(
            creditsCompleted=0,
            totalCredits=120,
            gpa=None,
            enrollmentYear=None,
            graduationYear=None,
            majorName=None,
            completedCourses=[]
        )
    
    # Get major information if user has selected one
    total_credits = 120  # Default
    major_name = None
    if user.major_id:
        major = db.query(Major).filter(Major.id == user.major_id).first()
        if major:
            total_credits = major.totalCredits or 120
            major_name = major.name
    elif user.major:
        # Fallback to major name if ID not set
        major_name = user.major
    
    # Get completed courses
    completed_courses = db.query(CompletedCourse).filter(
        CompletedCourse.user_id == user.id
    ).all()
    
    # Calculate total credits completed (ONLY from completed courses)
    credits_completed = sum(course.credits for course in completed_courses)
    
    # Calculate GPA if there are completed courses with grades
    gpa = None
    if completed_courses:
        grade_points = {
            'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0
        }
        
        total_grade_points = 0
        total_graded_credits = 0
        
        for course in completed_courses:
            if course.grade and course.grade in grade_points:
                total_grade_points += grade_points[course.grade] * course.credits
                total_graded_credits += course.credits
        
        if total_graded_credits > 0:
            gpa = round(total_grade_points / total_graded_credits, 2)
    
    # Format completed courses for response
    completed_courses_data = [
        {
            "course_code": course.course_code,
            "course_name": course.course_name,
            "credits": course.credits,
            "grade": course.grade,
            "semester": course.semester_completed
        }
        for course in completed_courses
    ]
    
    return DashboardData(
        creditsCompleted=credits_completed,
        totalCredits=total_credits,
        gpa=gpa,
        enrollmentYear=user.enrollment_year,
        graduationYear=user.graduation_year,
        majorName=major_name,
        completedCourses=completed_courses_data
    )