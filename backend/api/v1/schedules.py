from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.deps import get_schedule_service, get_db
from backend.auth.dependencies import get_current_user
from backend.schemas import ScheduleUpdate, ScheduleResponse, SemesterListResponse
from backend.services import ScheduleService
from backend.core.exceptions import NotFoundException
from database.models import User

router = APIRouter(prefix="", tags=["schedules"])


@router.get("/semesters", response_model=SemesterListResponse)
async def get_available_semesters(
    include_summers: bool = False,
    include_historical: bool = False,
    db: Session = Depends(get_db),
    schedule_service: ScheduleService = Depends(get_schedule_service)
):

    semesters = schedule_service.get_available_semesters(db, include_summers, include_historical)
    return {"semesters": semesters}


@router.get("/schedules/semester/{semester}", response_model=ScheduleResponse)
async def get_or_create_schedule_for_semester(
    semester: str,
    db: Session = Depends(get_db),
    schedule_service: ScheduleService = Depends(get_schedule_service),
    current_user: User = Depends(get_current_user)
):

    return schedule_service.get_or_create_schedule_for_semester(db, semester, current_user)


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    schedule_service: ScheduleService = Depends(get_schedule_service),
    current_user: User = Depends(get_current_user)
):

    try:
        schedule = schedule_service.get_schedule(db, schedule_id, current_user)
        return schedule
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/schedules/{schedule_id}/classes")
async def update_schedule_classes(
    schedule_id: int,
    update: ScheduleUpdate,
    db: Session = Depends(get_db),
    schedule_service: ScheduleService = Depends(get_schedule_service),
    current_user: User = Depends(get_current_user)
):

    try:
        result = schedule_service.update_schedule_classes(
            db,
            schedule_id,
            update.class_ids,
            update.colors or {},
            current_user
        )
        return {"updated": result, "schedule_id": schedule_id}
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
