from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session

from backend.api.deps import get_class_service, get_db
from backend.schemas import ClassDetail, DepartmentListResponse, ClassListResponse
from backend.services import ClassService
from backend.config import settings

router = APIRouter(prefix="/classes", tags=["classes"])

@router.get("/departments", response_model=DepartmentListResponse)
async def get_departments(
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    class_service: ClassService = Depends(get_class_service)
):
    semester = semester or settings.default_semester
    departments = class_service.get_all_departments_with_counts(db, semester)
    return {"departments": departments}

@router.get("", response_model=ClassListResponse)
async def get_classes(
    subject: Optional[str] = None,
    search: Optional[str] = None,
    semester: Optional[str] = None,
    limit: Optional[int] = 500,
    page: Optional[int] = 1,
    db: Session = Depends(get_db),
    class_service: ClassService = Depends(get_class_service)
):
    limit = settings.max_classes_per_request

    result = class_service.get_classes(
        db=db,
        subject=subject,
        search=search,
        semester=semester,
        limit=limit,
        page=page
    )
    return result

@router.get("/{class_id}", response_model=ClassDetail)
async def get_class(
    class_id: str,
    db: Session = Depends(get_db),
    class_service: ClassService = Depends(get_class_service)
):
    cls = class_service.get_class_by_id(db, class_id)
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    return cls

