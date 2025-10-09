from .common_schemas import PaginationResponse, ErrorResponse
from .class_schemas import (
    BaseClassDTO,
    ClassDetail,
    ClassScheduleItem,
    ClassListResponse,
    DepartmentResponse,
    DepartmentListResponse,
)
from .professor_schemas import ProfessorResponse, ProfessorSearchRequest
from .user_schemas import UserResponse, UserCreate
from .schedule_schemas import (
    ScheduleUpdate,
    ScheduleResponse,
    SemesterResponse,
    SemesterListResponse,
)

__all__ = [
    # Common
    "PaginationResponse",
    "ErrorResponse",
    # Classes
    "BaseClassDTO",
    "ClassDetail",
    "ClassScheduleItem",
    "ClassListResponse",
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
    "ScheduleResponse",
    "SemesterResponse",
    "SemesterListResponse",
]
