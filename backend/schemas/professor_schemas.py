from typing import List, Optional
from pydantic import BaseModel


class ProfessorResponse(BaseModel):
    id: str
    firstName: str
    lastName: str
    name: str
    avgRating: float
    avgDifficulty: float
    wouldTakeAgainPercent: float
    numRatings: int
    department: str
    ratingDistribution: List[int]
    tags: List[str]
    comments: Optional[List[str]] = []
    
    class Config:
        from_attributes = True


class ProfessorSearchRequest(BaseModel):
    name: str
    
    class Config:
        from_attributes = True
