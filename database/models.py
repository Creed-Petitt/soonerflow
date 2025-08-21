from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Create base class for models
Base = declarative_base()

class Class(Base):
    __tablename__ = 'classes'
    
    id = Column(String, primary_key=True)  # class_id from API (e.g., "13384-202510")
    subject = Column(String, nullable=False, index=True)  # Subject code (e.g., "ECE")
    courseNumber = Column(String, nullable=False, index=True)  # Course number (e.g., "2214") 
    section = Column(String, nullable=False)  # Section (e.g., "010")
    title = Column(String, nullable=False, index=True)  # Course title
    description = Column(Text)  # Course description
    instructor = Column(String, index=True)  # Primary instructor name
    allInstructors = Column(String)  # All instructors (comma-separated)
    type = Column(String, index=True)  # "Lecture", "Lab", "Seminar", etc.
    delivery = Column(String)  # "Traditional In-Person", "Online", etc.
    genEd = Column(String, index=True)  # Gen Ed requirement - indexed for filtering
    term = Column(String)  # "Full Term", etc.
    semesterDates = Column(String)  # "Aug 25 - Dec 12"
    examInfo = Column(String)  # Final exam information
    repeatability = Column(String)  # Repeatability rules
    credits = Column(Integer, index=True)  # Credit hours - indexed for filtering
    availableSeats = Column(Integer, default=0, index=True)  # Available seats - indexed for filtering
    totalSeats = Column(Integer, default=0)  # Total seats
    semester = Column(String, nullable=False, index=True, default="202510")  # Semester code (e.g., "202510" for Fall 2025)
    
    # Relationships
    meetingTimes = relationship("MeetingTime", back_populates="class_", cascade="all, delete-orphan")

class MeetingTime(Base):
    __tablename__ = 'meeting_times'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    classId = Column(String, ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)  # Foreign key to Class
    days = Column(String)  # "MWF", "TR", etc.
    startTime = Column(String)  # "10:00 am"
    endTime = Column(String)  # "10:50 am" 
    location = Column(String)  # "Felgar Hall 300"
    building = Column(String)  # "Felgar Hall"
    room = Column(String)  # "300"
    
    # Relationships
    class_ = relationship("Class", back_populates="meetingTimes")

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    github_id = Column(String, unique=True, nullable=True, index=True)  # GitHub user ID
    google_id = Column(String, unique=True, nullable=True, index=True)  # Google user ID
    email = Column(String, nullable=False, index=True)  # Removed unique constraint - same email can exist for different providers
    name = Column(String)
    avatar_url = Column(String)
    major = Column(String)  # Selected major (e.g., "Computer Science")
    major_id = Column(String, ForeignKey('majors.id'))  # Link to majors table
    enrollment_year = Column(Integer)  # Year started (e.g., 2022)
    graduation_year = Column(Integer)  # Expected graduation (e.g., 2027)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    schedules = relationship("Schedule", back_populates="user", cascade="all, delete-orphan")
    major_info = relationship("Major", foreign_keys=[major_id])
    completed_courses = relationship("CompletedCourse", back_populates="user", cascade="all, delete-orphan")
    flowchart = relationship("UserFlowchart", back_populates="user", uselist=False, cascade="all, delete-orphan")

class CompletedCourse(Base):
    __tablename__ = 'completed_courses'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    course_code = Column(String, nullable=False)  # e.g., "ECE 2214"
    course_name = Column(String)  # Course title
    credits = Column(Integer, nullable=False)  # Credits earned
    grade = Column(String)  # Letter grade (A, B+, etc.)
    semester_completed = Column(String)  # e.g., "Fall 2023"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="completed_courses")

class Schedule(Base):
    __tablename__ = 'schedules'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, default="My Schedule")  # Schedule name
    is_active = Column(Boolean, default=True)  # Currently active schedule
    semester = Column(String, default="202510")  # Semester code
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="schedules")
    scheduled_classes = relationship("ScheduledClass", back_populates="schedule", cascade="all, delete-orphan")

class ScheduledClass(Base):
    __tablename__ = 'scheduled_classes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    schedule_id = Column(Integer, ForeignKey('schedules.id', ondelete='CASCADE'), nullable=False)
    class_id = Column(String, ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    color = Column(String, default="#3b82f6")  # Hex color for calendar display
    added_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    schedule = relationship("Schedule", back_populates="scheduled_classes")
    class_ = relationship("Class")

class Prerequisite(Base):
    __tablename__ = 'prerequisites'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    class_id = Column(String, ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    prerequisite_subject = Column(String, nullable=False, index=True)  # e.g., "MATH"
    prerequisite_number = Column(String, nullable=False, index=True)   # e.g., "1914"
    prerequisite_type = Column(String, default="required")  # "required", "or", "concurrent", "corequisite"
    prerequisite_group = Column(Integer, default=1)  # For grouping OR conditions
    raw_text = Column(Text)  # Original prerequisite text for reference
    
    # Relationships
    class_ = relationship("Class")

class Department(Base):
    __tablename__ = 'departments'
    
    code = Column(String, primary_key=True)  # "ECE", "A HI", etc.
    name = Column(String)  # Full department name

class Professor(Base):
    __tablename__ = 'professors'
    
    id = Column(String, primary_key=True)  # GraphQL ID from RMP
    firstName = Column(String, nullable=False, index=True)
    lastName = Column(String, nullable=False, index=True)
    department = Column(String)

    # Rating info
    avgRating = Column(Float, index=True)
    numRatings = Column(Integer, default=0)
    avgDifficulty = Column(Float)
    wouldTakeAgainPercent = Column(Float)
    
    # Rating distribution
    ratingTotal = Column(Integer, default=0)
    ratingR1 = Column(Integer, default=0)  # 1-star ratings
    ratingR2 = Column(Integer, default=0)  # 2-star ratings
    ratingR3 = Column(Integer, default=0)  # 3-star ratings
    ratingR4 = Column(Integer, default=0)  # 4-star ratings
    ratingR5 = Column(Integer, default=0)  # 5-star ratings
    
    # Teacher tags (stored as JSON)
    teacherTags = Column(String)  # JSON array of tag objects
    
    # Course codes (stored as JSON)
    courseCodes = Column(String)  # JSON array of course objects
    
    # Relationships
    ratings = relationship("Rating", back_populates="professor", cascade="all, delete-orphan")

class Rating(Base):
    __tablename__ = 'ratings'
    
    id = Column(String, primary_key=True)  # GraphQL ID from RMP
    legacyId = Column(String)  # Legacy ID from RMP
    professorId = Column(String, ForeignKey('professors.id', ondelete='CASCADE'), nullable=False)  # Foreign key to Professor
    
    # Rating data
    comment = Column(Text)
    class_ = Column("class", String)  # Class name (e.g., "ECON4353") - Maps to 'class' column in DB
    
    # Individual ratings
    difficultyRating = Column(Float)
    clarityRating = Column(Float)
    helpfulRating = Column(Float)
    
    # Course meta
    wouldTakeAgain = Column(Boolean)
    grade = Column(String)
    attendanceMandatory = Column(Boolean)
    textbookUse = Column(Boolean)
    isForOnlineClass = Column(Boolean)
    isForCredit = Column(Boolean)
    
    # Tags and flags
    ratingTags = Column(String)  # JSON array of tags
    flagStatus = Column(String)
    createdByUser = Column(Boolean)
    
    # Thumbs up/down
    thumbsUpTotal = Column(Integer, default=0)
    thumbsDownTotal = Column(Integer, default=0)
    
    # Relationships
    professor = relationship("Professor", back_populates="ratings")

# Major Requirements Models
class Major(Base):
    __tablename__ = 'majors'
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)  # "Computer Engineering"
    college = Column(String, nullable=False)  # "Gallogly College of Engineering"
    department = Column(String)  # "Electrical and Computer Engineering"
    totalCredits = Column(Integer, default=120)
    description = Column(Text)
    url = Column(String)  # Original CourseLeaf URL
    
    # Relationships
    requirements = relationship("Requirement", back_populates="major", cascade="all, delete-orphan")

class Requirement(Base):
    __tablename__ = 'requirements'
    
    id = Column(String, primary_key=True)
    majorId = Column(String, ForeignKey('majors.id', ondelete='CASCADE'), nullable=False)  # Foreign key to Major
    categoryName = Column(String, nullable=False)  # "Major Requirements", "Gen Ed", etc.
    creditsNeeded = Column(Integer, default=0)
    description = Column(Text)
    
    # Relationships
    major = relationship("Major", back_populates="requirements")
    courses = relationship("MajorCourse", back_populates="requirement", cascade="all, delete-orphan")

class MajorCourse(Base):
    __tablename__ = 'major_courses'
    
    id = Column(String, primary_key=True)
    requirementId = Column(String, ForeignKey('requirements.id', ondelete='CASCADE'), nullable=False, index=True)  # Foreign key to Requirement
    subject = Column(String, nullable=False, index=True)  # "ECE", "MATH", etc. - indexed for joins
    courseNumber = Column(String, nullable=False, index=True)  # "2214", "2924", etc. - indexed for joins
    title = Column(String)  # "Digital Design", etc.
    credits = Column(Integer, default=3)
    
    # Relationships
    requirement = relationship("Requirement", back_populates="courses")

# Flowchart Persistence Model
class UserFlowchart(Base):
    __tablename__ = 'user_flowcharts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    nodes = Column(Text)  # JSON array of nodes
    edges = Column(Text)  # JSON array of edges
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="flowchart")

def get_database_url():
    """Get the database URL - matches the original Prisma schema"""
    # Get the absolute path to the database file
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, 'dev.db')
    return f"sqlite:///{db_path}"

def create_engine_and_session():
    """Create SQLAlchemy engine and session"""
    database_url = get_database_url()
    engine = create_engine(database_url, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal 