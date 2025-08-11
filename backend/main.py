from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
import sys
import os

# Add the parent directory to the path to import database models
sys.path.append('/home/highs/ou-class-manager')
from database.models import (
    Class as ClassModel, MeetingTime, Professor as ProfessorModel, Rating,
    User, Schedule, ScheduledClass, Major, MajorCourse, CompletedCourse,
    create_engine_and_session, Base
)

app = FastAPI(title="OU Class Manager API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3002", "http://127.0.0.1:3002"],  # Support all ports
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Pydantic models for API responses
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
    prerequisites: str = ""
    genEd: str = ""
    type: str = ""  # ADDED: Class type (Lecture, Lab with No Credit, etc.)
    sections: List[dict] = []
    ratingDistribution: List[int] = []  # ADDED: For bar charts
    tags: List[str] = []  # ADDED: For professor tags
    
    class Config:
        from_attributes = True

class Assignment(BaseModel):
    id: str
    title: str
    course: str
    due_date: str
    description: Optional[str] = None

class ProfessorResponse(BaseModel):
    id: str
    firstName: str
    lastName: str
    name: str  # Combined first + last name
    avgRating: float
    avgDifficulty: float
    wouldTakeAgainPercent: float
    numRatings: int
    department: str
    ratingDistribution: List[int]  # [1★, 2★, 3★, 4★, 5★]
    tags: List[str]
    comments: List[str] = []  # Student comments from ratings table
    
    class Config:
        from_attributes = True

class DashboardData(BaseModel):
    creditsCompleted: int
    totalCredits: int
    gpa: Optional[float]
    enrollmentYear: Optional[int]
    graduationYear: Optional[int]
    majorName: Optional[str]
    completedCourses: List[dict]

# Database setup
engine, SessionLocal = create_engine_and_session()
# Base.metadata.create_all(bind=engine)  # Commented out - tables already exist

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def format_meeting_times(meeting_times: List[MeetingTime]) -> str:
    """Format meeting times into a readable string like 'MWF 10:00-10:50'"""
    if not meeting_times:
        return "TBA"
    
    # Group by time for classes that meet at the same time on different days
    time_groups = {}
    for mt in meeting_times:
        time_key = f"{mt.startTime}-{mt.endTime}"
        if time_key not in time_groups:
            time_groups[time_key] = []
        time_groups[time_key].append(mt.days)
    
    # Format each time group
    formatted_times = []
    for time_range, days_list in time_groups.items():
        # Remove duplicates by converting to set, then back to sorted list
        unique_days = sorted(set(days_list))
        days_str = "".join(unique_days)
        formatted_times.append(f"{days_str} {time_range}")
    
    return ", ".join(formatted_times)

def get_professor_rating(class_id: str, instructor_name: str, db: Session) -> dict:
    """Get professor rating information using class-professor mapping"""
    if not instructor_name or instructor_name == "TBA":
        return {"rating": 0.0, "difficulty": 0.0, "wouldTakeAgain": 0.0, "ratingDistribution": [0, 0, 0, 0, 0], "tags": []}
    
    professor = None
    
    # First try exact mapping using class_professor_mappings
    try:
        mapping = db.execute(text("""
            SELECT professorId FROM class_professor_mappings 
            WHERE classId = :class_id
        """), {"class_id": class_id}).first()
        
        if mapping:
            professor = db.query(ProfessorModel).filter(
                ProfessorModel.id == mapping[0]
            ).first()
    except Exception:
        pass
    
    # FIXED: Fallback to fuzzy name matching - handle "Last, First" format and "Mc" variations
    if not professor:
        name_clean = instructor_name.strip()
        
        # Special handling for "Mc" names (e.g., "Mc Cann" vs "McCann")  
        mc_variations = [name_clean]
        if 'Mc ' in name_clean:
            # "Mc Cann" -> "McCann"
            mc_variations.append(name_clean.replace('Mc ', 'Mc'))
        if 'Mc' in name_clean and 'Mc ' not in name_clean:
            # "McCann" -> "Mc Cann" (reverse)
            import re
            mc_variations.append(re.sub(r'Mc([A-Z])', r'Mc \1', name_clean))
        
        # Try all Mc variations with different parsing strategies
        for name_variation in mc_variations:
            if professor:
                break
                
            # Strategy 1: "Last, First" format
            if "," in name_variation:
                parts = name_variation.split(",", 1)
                last_name = parts[0].strip()
                first_name = parts[1].strip() if len(parts) > 1 else ""
                
                # Search by parsed names
                if first_name and last_name:
                    professor = db.query(ProfessorModel).filter(
                        (ProfessorModel.lastName.ilike(f"%{last_name}%")) &
                        (ProfessorModel.firstName.ilike(f"%{first_name}%"))
                    ).first()
                
                # If not found, try just last name
                if not professor:
                    professor = db.query(ProfessorModel).filter(
                        ProfessorModel.lastName.ilike(f"%{last_name}%")
                    ).first()
            
            # Strategy 2: "First Last" format
            elif " " in name_variation:
                parts = name_variation.split()
                if len(parts) >= 2:
                    first_name, last_name = parts[0], parts[-1]
                    professor = db.query(ProfessorModel).filter(
                        (ProfessorModel.firstName.ilike(f"%{first_name}%")) &
                        (ProfessorModel.lastName.ilike(f"%{last_name}%"))
                    ).first()
            
            # Strategy 3: Single name search
            if not professor:
                search_term = f"%{name_variation}%"
                professor = db.query(ProfessorModel).filter(
                    (ProfessorModel.lastName.ilike(search_term)) |
                    (ProfessorModel.firstName.ilike(search_term))
                ).first()
    
    if professor:
        # Parse tags from teacherTags column
        tags = []
        if professor.teacherTags:
            tags = [tag.strip() for tag in professor.teacherTags.split(',') if tag.strip()]
        
        return {
            "rating": professor.avgRating or 0.0,
            "difficulty": professor.avgDifficulty or 0.0,
            "wouldTakeAgain": professor.wouldTakeAgainPercent or 0.0,
            "ratingDistribution": [  # ADDED: Return rating distribution
                professor.ratingR1 or 0,
                professor.ratingR2 or 0,
                professor.ratingR3 or 0,
                professor.ratingR4 or 0,
                professor.ratingR5 or 0
            ],
            "tags": tags  # ADDED: Return tags for student comments
        }
    
    return {"rating": 0.0, "difficulty": 0.0, "wouldTakeAgain": 0.0, "ratingDistribution": [0, 0, 0, 0, 0], "tags": []}

mock_assignments = [
    Assignment(
        id="1",
        title="Lab 3 - Logic Gates",
        course="ECE 2214",
        due_date="2025-08-08",
        description="Design and implement basic logic gates"
    ),
    Assignment(
        id="2", 
        title="Project 2 - Data Structures",
        course="CS 2334",
        due_date="2025-08-05",
        description="Implement linked list and binary tree"
    ),
    Assignment(
        id="3",
        title="Problem Set 8",
        course="MATH 2443", 
        due_date="2025-08-07",
        description="Vector calculus problems"
    )
]

# API Routes
@app.get("/")
async def root():
    return {"message": "OU Class Manager API"}

@app.get("/api/classes")
async def get_classes(
    subject: Optional[str] = None, 
    search: Optional[str] = None,
    limit: Optional[int] = 500,
    page: Optional[int] = 1,
    db: Session = Depends(get_db)
):
    """Get all classes with optional filtering"""
    query = db.query(ClassModel)
    
    if subject:
        query = query.filter(ClassModel.subject.ilike(f"%{subject}%"))
    
    if search:
        query = query.filter(
            (ClassModel.title.ilike(f"%{search}%")) |
            (ClassModel.subject.ilike(f"%{search}%")) |
            (ClassModel.courseNumber.ilike(f"%{search}%"))
        )
    
    # Add pagination
    offset = (page - 1) * limit
    total_count = query.count()
    
    # Order by courseNumber first to get diverse subjects, then by subject
    classes = query.order_by(ClassModel.courseNumber, ClassModel.subject).offset(offset).limit(limit).all()
    
    # PERFORMANCE FIX: Skip professor lookups for large requests
    skip_ratings = limit > 1000
    if not skip_ratings:
        print(f"DEBUG: Found {len(classes)} classes (page {page}, total: {total_count})")
        if classes:
            print(f"DEBUG: Subjects: {list(set([c.subject for c in classes[:10]]))}")
            print(f"DEBUG: First class has {len(classes[0].meetingTimes)} meeting times")
    
    # Convert to response format  
    response_classes = []
    for cls in classes:
        # PERFORMANCE FIX: Skip professor ratings for bulk loads
        if skip_ratings:
            ratings = {"rating": 0.0, "difficulty": 0.0, "wouldTakeAgain": 0.0, "ratingDistribution": [0, 0, 0, 0, 0], "tags": []}
        else:
            ratings = get_professor_rating(cls.id, cls.instructor, db)
        
        # Format meeting times
        time_str = format_meeting_times(cls.meetingTimes)
        
        # Extract days from meeting times
        days = []
        for mt in cls.meetingTimes:
            if mt.days:
                days.append(mt.days)
        
        # Get location from first meeting time
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"
        
        # Clean up title by removing location info in parentheses
        clean_title = cls.title
        if " (" in clean_title and "@" in clean_title:
            clean_title = clean_title.split(" (")[0]
        
        response_classes.append(ClassResponse(
            id=cls.id,
            subject=cls.subject,
            number=cls.courseNumber,
            title=clean_title,
            instructor=cls.instructor or "TBA",
            credits=cls.credits or 3,  # FIXED: Use actual database credits
            time=time_str,
            location=location,
            days=days,
            available_seats=cls.availableSeats or 0,  # Use actual database values
            total_seats=cls.totalSeats or 0,          # Use actual database values
            rating=ratings["rating"],
            difficulty=ratings["difficulty"],
            wouldTakeAgain=ratings["wouldTakeAgain"],
            ratingDistribution=ratings["ratingDistribution"],  # ADDED: Include rating distribution
            tags=ratings["tags"],  # ADDED: Include professor tags
            description=cls.description or "",
            prerequisites="",
            genEd=cls.genEd or "",
            type=cls.type or "",  # ADDED: Include class type
            sections=[
                {
                    "id": cls.section,
                    "time": time_str,
                    "instructor": cls.instructor or "TBA",
                    "seats": f"{cls.availableSeats or 0}/{cls.totalSeats or 0}"
                }
            ]
        ))
    
    # Calculate pagination
    totalPages = max(1, (total_count + limit - 1) // limit)
    
    # Get unique subjects from database
    all_subjects = db.query(ClassModel.subject).distinct().all()
    departments = sorted([s[0] for s in all_subjects if s[0]])  # Get ALL departments, sorted
    
    levels = ["Undergraduate", "Graduate"]
    creditOptions = [1, 2, 3, 4, 5, 6]
    semesters = ["Spring", "Fall", "Summer"]
    
    return {
        "classes": response_classes,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total_count,
            "totalPages": totalPages,
            "hasNext": offset + limit < total_count,
            "hasPrev": page > 1
        },
        "filters": {
            "departments": departments,
            "levels": levels,
            "credits": creditOptions,
            "semesters": semesters
        }
    }

@app.get("/api/classes/{class_id}", response_model=ClassResponse)
async def get_class(class_id: str, db: Session = Depends(get_db)):
    """Get specific class details"""
    cls = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get professor ratings
    ratings = get_professor_rating(cls.id, cls.instructor, db)
    
    # Format meeting times
    time_str = format_meeting_times(cls.meetingTimes)
    
    # Extract days from meeting times
    days = []
    for mt in cls.meetingTimes:
        if mt.days:
            days.append(mt.days)
    
    # Get location from first meeting time
    location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"
    
    # Clean up title by removing location info in parentheses
    clean_title = cls.title
    if " (" in clean_title and "@" in clean_title:
        clean_title = clean_title.split(" (")[0]
    
    return ClassResponse(
        id=cls.id,
        subject=cls.subject,
        number=cls.courseNumber,
        title=clean_title,
        instructor=cls.instructor or "TBA",
        time=time_str,
        location=location,
        days=days,
        rating=ratings["rating"],
        difficulty=ratings["difficulty"],
        wouldTakeAgain=ratings["wouldTakeAgain"],
        ratingDistribution=ratings["ratingDistribution"],  # ADDED: Include rating distribution
        tags=ratings["tags"],  # ADDED: Include professor tags
        description=cls.description or "",
        prerequisites=cls.description or "",
        genEd=cls.genEd or "",
        type=cls.type or "",  # ADDED: Include class type
        sections=[
            {
                "id": cls.section,
                "time": time_str,
                "instructor": cls.instructor or "TBA",
                "seats": "TBA"
            }
        ]
    )

@app.get("/api/assignments", response_model=List[Assignment])
async def get_assignments():
    """Get upcoming assignments"""
    return mock_assignments

@app.get("/api/user/schedule", response_model=List[ClassResponse])
async def get_user_schedule(db: Session = Depends(get_db)):
    """Get user's current schedule"""
    # For now, return a limited set of classes as enrolled
    classes = db.query(ClassModel).limit(3).all()
    
    response_classes = []
    for cls in classes:
        ratings = get_professor_rating(cls.id, cls.instructor, db)
        time_str = format_meeting_times(cls.meetingTimes)
        days = [mt.days for mt in cls.meetingTimes if mt.days]
        location = cls.meetingTimes[0].location if cls.meetingTimes else "TBA"
        
        response_classes.append(ClassResponse(
            id=cls.id,
            subject=cls.subject,
            number=cls.courseNumber,
            title=cls.title,
            instructor=cls.instructor or "TBA",
            time=time_str,
            location=location,
            days=days,
            rating=ratings["rating"],
            difficulty=ratings["difficulty"],
            wouldTakeAgain=ratings["wouldTakeAgain"],
            ratingDistribution=ratings["ratingDistribution"],  # ADDED: Include rating distribution
            tags=ratings["tags"],  # ADDED: Include professor tags
            description=cls.description or "",
            prerequisites="",
            genEd=cls.genEd or ""
        ))
    
    return response_classes

@app.get("/api/professors/search")
async def search_professor(name: str, db: Session = Depends(get_db)):
    """Search for professor by instructor name using the class_professor_mappings table"""
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    try:
        # First, find a class with this instructor name
        instructor_name = name.strip()
        class_with_instructor = db.execute(text("""
            SELECT id FROM classes 
            WHERE instructor = :instructor_name 
            LIMIT 1
        """), {"instructor_name": instructor_name}).fetchone()
        
        professor = None
        
        if class_with_instructor:
            class_id = class_with_instructor[0]
            
            # Find the professor mapping for this class
            mapping = db.execute(text("""
                SELECT professorId FROM class_professor_mappings 
                WHERE classId = :class_id
            """), {"class_id": class_id}).fetchone()
            
            if mapping:
                # Use the mapping if it exists
                professor_id = mapping[0]
                professor = db.query(ProfessorModel).filter(
                    ProfessorModel.id == professor_id
                ).first()
        
        # If no exact match or mapping failed, fall back to fuzzy matching
        if not professor:
            name_clean = instructor_name
            
            # Special handling for "Mc" names (e.g., "Mc Cann" vs "McCann")
            mc_variations = []
            if 'Mc ' in name_clean:
                # "Mc Cann" -> "McCann"
                mc_variations.append(name_clean.replace('Mc ', 'Mc'))
            if 'Mc' in name_clean and 'Mc ' not in name_clean:
                # "McCann" -> "Mc Cann" (reverse)
                import re
                mc_variations.append(re.sub(r'Mc([A-Z])', r'Mc \1', name_clean))
            
            # Try Mc variations first
            for mc_name in mc_variations:
                if "," in mc_name:
                    last_name, first_name = [n.strip() for n in mc_name.split(",", 1)]
                    professor = db.query(ProfessorModel).filter(
                        ProfessorModel.lastName.ilike(f"%{last_name}%"),
                        ProfessorModel.firstName.ilike(f"%{first_name}%")
                    ).filter(ProfessorModel.avgRating > 0).first()
                    if professor:
                        break
            
            # Try multiple fuzzy matching strategies
            
            # Strategy 1: "Last, First" format
            if "," in name_clean:
                last_name, first_name = [n.strip() for n in name_clean.split(",", 1)]
                # Try exact match first
                professor = db.query(ProfessorModel).filter(
                    ProfessorModel.lastName.ilike(f"%{last_name}%"),
                    ProfessorModel.firstName.ilike(f"%{first_name}%")
                ).filter(ProfessorModel.avgRating > 0).first()
                
                # If not found, try swapped (Tang, Choon Yik -> find Choon Tang)
                if not professor:
                    professor = db.query(ProfessorModel).filter(
                        ProfessorModel.firstName.ilike(f"%{last_name}%"),
                        ProfessorModel.lastName.ilike(f"%{first_name}%")
                    ).filter(ProfessorModel.avgRating > 0).first()
            
            # Strategy 2: "First Last" format
            if not professor and " " in name_clean:
                parts = name_clean.split()
                if len(parts) >= 2:
                    first_name, last_name = parts[0], parts[-1]
                    professor = db.query(ProfessorModel).filter(
                        ProfessorModel.firstName.ilike(f"%{first_name}%"),
                        ProfessorModel.lastName.ilike(f"%{last_name}%")
                    ).filter(ProfessorModel.avgRating > 0).first()
            
            # Strategy 3: Individual word matching (for complex names)
            if not professor:
                words = name_clean.replace(",", " ").split()
                for word in words:
                    if len(word) > 2:  # Skip short words
                        professor = db.query(ProfessorModel).filter(
                            (ProfessorModel.lastName.ilike(f"%{word}%")) |
                            (ProfessorModel.firstName.ilike(f"%{word}%"))
                        ).filter(ProfessorModel.avgRating > 0).first()
                        if professor:
                            break
            
            # Strategy 4: Partial match on full string
            if not professor:
                search_term = f"%{name_clean}%"
                professor = db.query(ProfessorModel).filter(
                    (ProfessorModel.lastName.ilike(search_term)) |
                    (ProfessorModel.firstName.ilike(search_term))
                ).filter(ProfessorModel.avgRating > 0).first()
        
        if not professor:
            return {"error": "Professor not found", "name": name}
            
    except Exception as e:
        return {"error": f"Search failed: {str(e)}", "name": name}
    
    # Get student comments from ratings table
    comments = []
    if professor.numRatings >= 10:  # Only get comments for professors with detailed data
        ratings = db.query(Rating).filter(
            Rating.professorId == professor.id,
            Rating.comment.isnot(None),
            Rating.comment != ""
        ).limit(5).all()
        comments = [r.comment for r in ratings if r.comment]
    
    # Parse tags from teacherTags column
    tags = []
    if professor.teacherTags:
        tags = [tag.strip() for tag in professor.teacherTags.split(',') if tag.strip()]
    
    # Build rating distribution
    rating_distribution = [
        professor.ratingR1 or 0,
        professor.ratingR2 or 0, 
        professor.ratingR3 or 0,
        professor.ratingR4 or 0,
        professor.ratingR5 or 0
    ]
    
    return ProfessorResponse(
        id=professor.id,
        firstName=professor.firstName or "",
        lastName=professor.lastName or "",
        name=f"{professor.firstName or ''} {professor.lastName or ''}".strip(),
        avgRating=professor.avgRating or 0.0,
        avgDifficulty=professor.avgDifficulty or 0.0,
        wouldTakeAgainPercent=professor.wouldTakeAgainPercent or 0.0,
        numRatings=professor.numRatings or 0,
        department=professor.department or "",
        ratingDistribution=rating_distribution,
        tags=tags,
        comments=comments
    )

@app.get("/api/user/dashboard", response_model=DashboardData)
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
    
    # Note: We NO LONGER add scheduled credits to completed credits
    # Scheduled classes are "In Progress", not "Completed"
    # Only completed courses count towards creditsCompleted
    
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
        creditsCompleted=credits_completed,  # Only completed credits, not scheduled
        totalCredits=total_credits,
        gpa=gpa,
        enrollmentYear=user.enrollment_year,
        graduationYear=user.graduation_year,
        majorName=major_name,
        completedCourses=completed_courses_data
    )

@app.post("/api/user/onboarding")
async def save_onboarding_data(
    data: dict,
    db: Session = Depends(get_db)
):
    """Save user onboarding selections"""
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

@app.post("/api/user/courses/complete")
async def mark_courses_complete(
    data: dict,
    db: Session = Depends(get_db)
):
    """Mark courses as completed for a user"""
    email = data.get('email')
    courses = data.get('courses', [])
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add completed courses
    for course_data in courses:
        # Check if course already exists
        existing = db.query(CompletedCourse).filter(
            CompletedCourse.user_id == user.id,
            CompletedCourse.course_code == course_data.get('course_code')
        ).first()
        
        if not existing:
            completed_course = CompletedCourse(
                user_id=user.id,
                course_code=course_data.get('course_code'),
                course_name=course_data.get('course_name', ''),
                credits=course_data.get('credits', 3),
                grade=course_data.get('grade'),
                semester_completed=course_data.get('semester')
            )
            db.add(completed_course)
    
    db.commit()
    
    return {"success": True, "message": f"Marked {len(courses)} courses as complete"}

@app.get("/api/user/courses/completed")
async def get_completed_courses(
    user_email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get completed courses for a user"""
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

@app.delete("/api/user/courses/complete/{course_code}")
async def remove_completed_course(
    course_code: str,
    user_email: str = Query(...),
    db: Session = Depends(get_db)
):
    """Remove a course from completed status"""
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

# User Authentication & Profile Endpoints
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
    
class ScheduleResponse(BaseModel):
    id: int
    name: str
    is_active: bool
    semester: str
    created_at: datetime
    class_ids: List[str]

@app.post("/api/auth/user", response_model=UserResponse)
async def create_or_update_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create or update user from GitHub OAuth"""
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

@app.get("/api/users/{github_id}", response_model=UserResponse)
async def get_user(github_id: str, db: Session = Depends(get_db)):
    """Get user by GitHub ID"""
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

@app.get("/api/users/{github_id}/schedules", response_model=List[ScheduleResponse])
async def get_user_schedules(github_id: str, db: Session = Depends(get_db)):
    """Get all schedules for a user"""
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    schedules = db.query(Schedule).filter(Schedule.user_id == user.id).all()
    
    response = []
    for schedule in schedules:
        class_ids = [sc.class_id for sc in schedule.scheduled_classes]
        response.append(ScheduleResponse(
            id=schedule.id,
            name=schedule.name,
            is_active=schedule.is_active,
            semester=schedule.semester,
            created_at=schedule.created_at,
            class_ids=class_ids
        ))
    
    return response

@app.get("/api/users/{github_id}/active-schedule")
async def get_active_schedule(github_id: str, db: Session = Depends(get_db)):
    """Get user's active schedule with full class details"""
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
    scheduled_classes = []
    for sc in schedule.scheduled_classes:
        cls = sc.class_
        ratings = get_professor_rating(cls.id, cls.instructor, db)
        time_str = format_meeting_times(cls.meetingTimes)
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

class ScheduleUpdate(BaseModel):
    class_ids: List[str]
    colors: Optional[dict] = {}  # Map of class_id to color

@app.put("/api/schedules/{schedule_id}/classes")
async def update_schedule_classes(
    schedule_id: int, 
    update: ScheduleUpdate,
    db: Session = Depends(get_db)
):
    """Update classes in a schedule (add/remove)"""
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

class MajorUpdate(BaseModel):
    major: str

@app.put("/api/users/{github_id}/major")
async def update_user_major(github_id: str, major_data: MajorUpdate, db: Session = Depends(get_db)):
    """Update user's selected major"""
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.major = major_data.major
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Major updated successfully", "major": major_data.major}

@app.post("/api/schedules")
async def create_schedule(
    github_id: str,
    name: str,
    semester: str = "202510",
    db: Session = Depends(get_db)
):
    """Create a new schedule for a user"""
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Set all other schedules as inactive
    db.query(Schedule).filter(Schedule.user_id == user.id).update({"is_active": False})
    
    # Create new schedule
    schedule = Schedule(
        user_id=user.id,
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

@app.get("/api/majors")
async def get_majors(db: Session = Depends(get_db)):
    """Get all available majors"""
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

@app.get("/api/major-courses")
async def get_major_courses(major_name: str, db: Session = Depends(get_db)):
    """Get all courses for a specific major by name"""
    # Find the major
    major = db.query(Major).filter(Major.name == major_name).first()
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)