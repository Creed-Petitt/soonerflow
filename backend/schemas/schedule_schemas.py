from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict

from .class_schemas import ClassScheduleItem


class ScheduleUpdate(BaseModel):
    class_ids: List[str]
    colors: Optional[Dict[str, str]] = {}


class ScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: int
    schedule_name: str
    semester: str
    classes: List[ClassScheduleItem]


class SemesterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    class_count: int
    is_summer: bool


class SemesterListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    semesters: List[SemesterResponse]
