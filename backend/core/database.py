import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv


def get_database_url() -> str:
    load_dotenv()
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    return database_url


def create_engine_and_session():
    database_url = get_database_url()
    
    engine = create_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30
    )
    
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        expire_on_commit=False
    )
    
    return engine, SessionLocal


# Create a global session factory
engine, SessionLocal = create_engine_and_session()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        try:
            db.rollback()
        except:
            pass
        raise e
    finally:
        try:
            db.close()
        except:
            pass
