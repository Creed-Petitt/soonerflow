from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.models import get_db
from backend.services import ProfessorService
from backend.schemas import ProfessorResponse


router = APIRouter(prefix="/api/professors", tags=["professors"])


@router.get("/search")
async def search_professor(name: str, db: Session = Depends(get_db)):
    if not name or len(name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    professor_service = ProfessorService(db)
    result = professor_service.search_professor(name)
    
    if not result:
        return {"error": "Professor not found", "name": name}
    
    return ProfessorResponse(**result)


@router.get("/{professor_id}")
async def get_professor(professor_id: str, db: Session = Depends(get_db)):
    from database.models import Professor, Rating
    
    professor = db.query(Professor).filter(Professor.id == professor_id).first()
    
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    # Get student comments
    comments = []
    if professor.numRatings >= 10:
        ratings = db.query(Rating).filter(
            Rating.professorId == professor.id,
            Rating.comment.isnot(None),
            Rating.comment != ""
        ).limit(5).all()
        comments = [r.comment for r in ratings if r.comment]
    
    # Parse tags
    tags = []
    if professor.teacherTags:
        tags = [tag.strip() for tag in professor.teacherTags.split(',') if tag.strip()]
    
    return ProfessorResponse(
        id=professor.id,
        firstName=professor.firstName or "",
        lastName=professor.lastName or "",
        name=f"{professor.firstName or ''} {professor.lastName or ''}".strip(),
        avgRating=professor.avgRating or 0.0,
        avgDifficulty=professor.avgDifficulty or 0.0,
        wouldTakeAgainPercent=professor.wouldTakeAgainPercent or 0.0,
        numRatings=professor.numRatings or 0,
        department=professor.department or "",
        ratingDistribution=[
            professor.ratingR1 or 0,
            professor.ratingR2 or 0,
            professor.ratingR3 or 0,
            professor.ratingR4 or 0,
            professor.ratingR5 or 0
        ],
        tags=tags,
        comments=comments
    )