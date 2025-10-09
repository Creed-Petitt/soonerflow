from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from backend.config import settings
from backend.logging_config import setup_logging
from backend.api.v1 import (
    classes as classes_v1,
    professors as professors_v1,
    schedules as schedules_v1
)
from backend.core.exceptions import NotFoundException, ConflictException, ValidationException
from database.models import create_engine_and_session, Base
from backend.auth.firebase_config import initialize_firebase

logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Initializing Firebase...")
        initialize_firebase()
        logger.info("Starting database initialization...")
        engine, SessionLocal = create_engine_and_session()
        logger.info("Engine created, creating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Tables created successfully!")
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
    yield

app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global exception handlers
@app.exception_handler(NotFoundException)
async def not_found_handler(request: Request, exc: NotFoundException):
    return JSONResponse(status_code=404, content={"detail": exc.message})

@app.exception_handler(ConflictException)
async def conflict_handler(request: Request, exc: ConflictException):
    return JSONResponse(status_code=409, content={"detail": exc.message})

@app.exception_handler(ValidationException)
async def validation_handler(request: Request, exc: ValidationException):
    return JSONResponse(status_code=400, content={"detail": exc.message})

# API v1 Routers
app.include_router(classes_v1.router, prefix="/api")
app.include_router(professors_v1.router, prefix="/api")
app.include_router(schedules_v1.router, prefix="/api")

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
        "fuzzy_match_threshold": settings.fuzzy_match_threshold
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)