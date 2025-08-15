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
from database.models import User, CompletedCourse, Schedule, Major, create_engine_and_session


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


class DashboardData(BaseModel):
    creditsCompleted: int
    totalCredits: int
    gpa: Optional[float]
    enrollmentYear: Optional[int]
    graduationYear: Optional[int]
    majorName: Optional[str]
    completedCourses: List[dict]


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
            semester="202510"
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
async def get_user(github_id: str, db: Session = Depends(get_db)):
    """Get user by GitHub ID."""
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
async def update_user_major(github_id: str, major_data: MajorUpdate, db: Session = Depends(get_db)):
    """Update user's selected major."""
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.major = major_data.major
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Major updated successfully", "major": major_data.major}


@router.post("/user/onboarding")
async def save_onboarding_data(data: dict, db: Session = Depends(get_db)):
    """Save user onboarding selections."""
    from database.models import Major
    
    email = data.get('email')
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user with onboarding data
    if 'major' in data:
        user.major = data['major']
        # Try to find major ID from name
        major = db.query(Major).filter(Major.name == data['major']).first()
        if major:
            user.major_id = major.id
    
    if 'enrollmentYear' in data:
        user.enrollment_year = data['enrollmentYear']
    
    if 'graduationYear' in data:
        user.graduation_year = data['graduationYear']
    
    db.commit()
    
    return {"success": True, "message": "Onboarding data saved"}


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


@router.delete("/user/courses/complete/{course_code}")
async def remove_completed_course(
    course_code: str,
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a course from completed status."""
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
    
    if completed_course:
        db.delete(completed_course)
        db.commit()
        return {"success": True, "message": f"Removed {course_code} from completed courses"}
    else:
        return {"success": False, "message": f"Course {course_code} not found in completed courses"}


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