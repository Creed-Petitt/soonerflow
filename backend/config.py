from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://soonerflow.vercel.app"
        ],
        env="CORS_ORIGINS"
    )

    fuzzy_match_threshold: int = Field(default=70, ge=0, le=100)
    max_classes_per_request: int = Field(default=50000)
    skip_ratings_threshold: int = Field(default=500)
    api_title: str = Field(default="OU Class Manager API")
    api_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)

    default_semester: str = Field(default="202510", env="DEFAULT_SEMESTER")

    semester_names: dict = Field(default={
        "202110": "Fall 2021", "202120": "Spring 2022", "202130": "Summer 2022",
        "202210": "Fall 2022", "202220": "Spring 2023", "202230": "Summer 2023",
        "202310": "Fall 2023", "202320": "Spring 2024", "202330": "Summer 2024",
        "202410": "Fall 2024", "202420": "Spring 2025", "202430": "Summer 2025",
        "202510": "Fall 2025", "202520": "Spring 2026", "202530": "Summer 2026",
        "202610": "Fall 2026", "202620": "Spring 2027", "202630": "Summer 2027"
    })

    database_url: str = Field(default="", env="DATABASE_URL")
    port: int = Field(default=8080, env="PORT")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

settings = Settings()