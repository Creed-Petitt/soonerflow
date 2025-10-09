from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.api.deps import get_professor_service, get_db
from backend.schemas import ProfessorResponse
from backend.services import ProfessorService
from backend.core.exceptions import NotFoundException

router = APIRouter(prefix="/professors", tags=["professors"])

@router.get("/search", response_model=ProfessorResponse)
async def search_professor(
    name: str,
    db: Session = Depends(get_db),
    professor_service: ProfessorService = Depends(get_professor_service)
):
    try:
        result = professor_service.search_professor(db, name)
        return result
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

