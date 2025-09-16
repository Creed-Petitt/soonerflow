"""
Refactored main FastAPI application using routers and services.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys

# Add the parent directory to the path
sys.path.append('/home/highs/ou-class-manager')

from backend.config import settings
from backend.routers import (
    classes_router,
    professors_router,
    users_router,
    schedules_router,
    majors_router
)
from database.models import create_engine_and_session

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        engine, SessionLocal = create_engine_and_session()
        db = SessionLocal()
        try:
            from database.models import Class as ClassModel
            db.query(ClassModel).first()
        finally:
            db.close()
    except Exception:
        pass
    yield

# Create FastAPI app with settings
app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)

# Enable CORS using settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(classes_router)
app.include_router(professors_router)
app.include_router(users_router)
app.include_router(schedules_router)
app.include_router(majors_router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "OU Class Manager API", "version": settings.api_version}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "debug_mode": settings.debug,
        "fuzzy_match_enabled": settings.use_new_professor_service,
        "cache_enabled": settings.enable_professor_cache
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)