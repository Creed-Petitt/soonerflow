"""
API Key Authentication module for FastAPI backend.
Simple, secure authentication using API keys.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.models import User, create_engine_and_session

# API Key from environment (required)
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise ValueError("API_KEY environment variable is required")

# Database session
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> bool:
    """
    Verify the API key from the X-API-Key header
    """
    # API key verification
    
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # API key verified successfully
    return True


def get_user_from_github_id(
    github_id: str,
    db: Session = Depends(get_db)
) -> User:
    """
    Get user by GitHub ID from the database
    """
    user = db.query(User).filter(User.github_id == github_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


def verify_user_access(current_user_github_id: str, requested_github_id: str) -> None:
    """
    Verify that the current user has access to the requested resource
    Raises 403 if user is trying to access another user's data
    """
    if current_user_github_id != requested_github_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only access your own data"
        )


# For endpoints that need both API key and user verification
async def get_current_user(
    github_id: str,  # This will come from the path parameter
    api_key_valid: bool = Depends(verify_api_key),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current user after verifying API key
    The github_id comes from the path parameter
    """
    user = db.query(User).filter(User.github_id == github_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


# Simplified auth check for endpoints
def require_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> None:
    """
    Simple dependency to require API key for an endpoint
    """
    verify_api_key(x_api_key)