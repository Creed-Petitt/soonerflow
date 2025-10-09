from typing import List, Optional
from pydantic import BaseModel, ConfigDict, model_validator
import json

from .common_schemas import PaginationResponse


class BaseClassDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    subject: str
    courseNumber: str
    number: str
    title: str
    instructor: Optional[str] = None
    credits: int = 3
    time: str
    location: str
    days: List[str]
    availableSeats: int = 0
    totalSeats: int = 0
    genEd: Optional[str] = None
    type: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def parse_days(cls, data):
        if hasattr(data, 'courseNumber'):
            data.number = data.courseNumber
            if hasattr(data, 'days') and isinstance(data.days, str):
                data.days = json.loads(data.days) if data.days else []
        return data


class ClassScheduleItem(BaseClassDTO):
    color: str = "#3b82f6"
    rating: Optional[float] = None
    difficulty: Optional[float] = None
    wouldTakeAgain: Optional[float] = None


class ClassDetail(BaseClassDTO):
    description: Optional[str] = None
    delivery: Optional[str] = None
    term: Optional[str] = None
    prerequisites: List[dict] = []
    sections: List[dict] = []


class ClassListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    classes: List[BaseClassDTO]
    pagination: PaginationResponse


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    count: int


class DepartmentListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    departments: List[DepartmentResponse]
