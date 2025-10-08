from typing import List, Optional, Dict
from pydantic import BaseModel


class ScheduleUpdate(BaseModel):
    
    class_ids: List[str]
    colors: Optional[Dict[str, str]] = {}
    
    class Config:
        from_attributes = True


class ScheduledClassResponse(BaseModel):
    
    id: str
    subject: str
    number: str
    title: str
    instructor: str
    credits: int
    time: str
    location: str
    days: List[str]
    type: str
    color: str
    available_seats: int
    total_seats: int
    rating: Optional[float] = None
    difficulty: Optional[float] = None
    wouldTakeAgain: Optional[float] = None
    prerequisites: List[dict] = []
    
    class Config:
        from_attributes = True


class ScheduleResponse(BaseModel):
    
    schedule_id: int
    schedule_name: str
    semester: str
    classes: List[ScheduledClassResponse]
    
    class Config:
        from_attributes = True


class SemesterResponse(BaseModel):
  
    code: str
    name: str
    class_count: int
    is_summer: bool
    
    class Config:
        from_attributes = True


class SemesterListResponse(BaseModel):

    semesters: List[SemesterResponse]
    
    class Config:
        from_attributes = True
