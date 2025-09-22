from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):

    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002"
        ]
    )

    fuzzy_match_threshold: int = Field(default=100, ge=0, le=100)
    max_classes_per_request: int = Field(default=50000)
    skip_ratings_threshold: int = Field(default=500)
    api_title: str = Field(default="OU Class Manager API")
    api_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

settings = Settings()