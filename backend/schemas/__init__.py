from .common_schemas import PaginationResponse, ErrorResponse
from .class_schemas import (
    ClassResponse,
    ClassListResponse,
    CourseResponse,
    DepartmentResponse,
    DepartmentListResponse,
)
from .professor_schemas import ProfessorResponse, ProfessorSearchRequest
from .user_schemas import UserResponse, UserCreate
from .schedule_schemas import (
    ScheduleUpdate,
    ScheduledClassResponse,
    ScheduleResponse,
    SemesterResponse,
    SemesterListResponse,
)

__all__ = [
    # Common
    "PaginationResponse",
    "ErrorResponse",
    # Classes
    "ClassResponse",
    "ClassListResponse",
    "CourseResponse",
    "DepartmentResponse",
    "DepartmentListResponse",
    # Professors
    "ProfessorResponse",
    "ProfessorSearchRequest",
    # Users
    "UserResponse",
    "UserCreate",
    # Schedules
    "ScheduleUpdate",
    "ScheduledClassResponse",
    "ScheduleResponse",
    "SemesterResponse",
    "SemesterListResponse",
]
