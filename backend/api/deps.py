from sqlalchemy.orm import Session
from fastapi import Depends

from backend.core.database import get_db
from backend.services import ClassService, ProfessorService, UserService, ScheduleService
from backend.repositories import ClassRepository, UserRepository, ScheduleRepository

# Repositories
def get_class_repository() -> ClassRepository:
    return ClassRepository()

def get_user_repository() -> UserRepository:
    return UserRepository()

def get_schedule_repository() -> ScheduleRepository:
    return ScheduleRepository()

# Services
def get_professor_service() -> ProfessorService:
    return ProfessorService()

def get_class_service(
    class_repo: ClassRepository = Depends(get_class_repository)
) -> ClassService:
    return ClassService(class_repo=class_repo)

def get_user_service(
    user_repo: UserRepository = Depends(get_user_repository),
    schedule_repo: ScheduleRepository = Depends(get_schedule_repository)
) -> UserService:
    return UserService(user_repo=user_repo, schedule_repo=schedule_repo)

def get_schedule_service(
    schedule_repo: ScheduleRepository = Depends(get_schedule_repository),
    class_repo: ClassRepository = Depends(get_class_repository)
) -> ScheduleService:
    return ScheduleService(schedule_repo=schedule_repo, class_repo=class_repo)
