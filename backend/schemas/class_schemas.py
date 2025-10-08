from typing import List
from pydantic import BaseModel

from .common_schemas import PaginationResponse


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
    prerequisites: List[dict] = []
    genEd: str = ""
    type: str = ""
    sections: List[dict] = []
    ratingDistribution: List[int] = []
    tags: List[str] = []
    
    class Config:
        from_attributes = True


class ClassListResponse(BaseModel):

    classes: List[ClassResponse]
    pagination: PaginationResponse
    
    class Config:
        from_attributes = True


class CourseResponse(BaseModel):

    id: str
    subject: str
    courseNumber: str
    code: str
    name: str
    title: str
    credits: int
    category: str
    
    class Config:
        from_attributes = True


class DepartmentResponse(BaseModel):

    code: str
    count: int
    
    class Config:
        from_attributes = True


class DepartmentListResponse(BaseModel):
    
    departments: List[DepartmentResponse]
    
    class Config:
        from_attributes = True
