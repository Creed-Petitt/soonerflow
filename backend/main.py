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
    schedules_router
)
from database.models import create_engine_and_session, Base
from backend.auth.firebase_config import initialize_firebase

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        print("Initializing Firebase...")
        initialize_firebase()
        print("Starting database initialization...")
        engine, SessionLocal = create_engine_and_session()
        print("Engine created, creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"Initialization failed: {e}")
    yield

app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)

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