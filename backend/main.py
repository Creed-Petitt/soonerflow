from fastapi import FastAPI, HTTPException, Depends
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
from database.models import Class as ClassModel, MeetingTime, Professor as ProfessorModel, Rating, create_engine_and_session, Base

app = FastAPI(title="OU Class Manager API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
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
    sections: List[dict] = []
    
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
        days_str = "".join(days_list)
        formatted_times.append(f"{days_str} {time_range}")
    
    return ", ".join(formatted_times)

def get_professor_rating(class_id: str, instructor_name: str, db: Session) -> dict:
    """Get professor rating information using class-professor mapping"""
    if not instructor_name or instructor_name == "TBA":
        return {"rating": 0.0, "difficulty": 0.0, "wouldTakeAgain": 0.0}
    
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
    
    # Fallback to fuzzy name matching if no exact mapping
    if not professor:
        search_term = f"%{instructor_name.strip()}%"
        professor = db.query(ProfessorModel).filter(
            (ProfessorModel.lastName.ilike(search_term)) |
            (ProfessorModel.firstName.ilike(search_term))
        ).filter(ProfessorModel.avgRating > 0).first()
    
    if professor:
        return {
            "rating": professor.avgRating or 0.0,
            "difficulty": professor.avgDifficulty or 0.0,
            "wouldTakeAgain": professor.wouldTakeAgainPercent or 0.0
        }
    
    return {"rating": 0.0, "difficulty": 0.0, "wouldTakeAgain": 0.0}

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
    
    print(f"DEBUG: Found {len(classes)} classes (page {page}, total: {total_count})")
    if classes:
        print(f"DEBUG: Subjects: {list(set([c.subject for c in classes[:10]]))}")
        print(f"DEBUG: First class has {len(classes[0].meetingTimes)} meeting times")
    
    # Convert to response format  
    response_classes = []
    for cls in classes:
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
        
        response_classes.append(ClassResponse(
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
            description=cls.description or "",
            prerequisites="",
            genEd=cls.genEd or "",
            sections=[
                {
                    "id": cls.section,
                    "time": time_str,
                    "instructor": cls.instructor or "TBA",
                    "seats": "TBA"
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
    ratings = get_professor_rating(cls.instructor, db)
    
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
        description=cls.description or "",
        prerequisites=cls.additionalInfo or "",
        genEd=cls.genEd or "",
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
            description=cls.description or "",
            prerequisites="",
            genEd=cls.genEd or ""
        ))
    
    return response_classes

@app.get("/api/professors/search")
async def search_professor(name: str, db: Session = Depends(get_db)):
    """Search for professor by name and return RateMyProfessor data"""
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    try:
        # Simple search by last name or full name
        search_term = f"%{name.strip()}%"
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

@app.post("/api/user/schedule/{class_id}")
async def add_to_schedule(class_id: str):
    """Add class to user's schedule"""
    return {"message": f"Added class {class_id} to schedule"}

@app.delete("/api/user/schedule/{class_id}")
async def remove_from_schedule(class_id: str):
    """Remove class from user's schedule"""
    return {"message": f"Removed class {class_id} from schedule"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)