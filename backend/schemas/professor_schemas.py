from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ProfessorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


class ProfessorSearchRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
