from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from firebase_admin import auth
from typing import Optional

from database.models import User, get_db
from backend.services.user_service import UserService

# This is our security scheme: "Bearer" token in the Authorization header
bearer_scheme = HTTPBearer()

def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(token.credentials)

        # Extract user information from the token
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        avatar_url = decoded_token.get("picture")

        # Validate required fields
        if not uid or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing required user information",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get or create user in our database
        user_service = UserService(db)
        user = user_service.get_or_create_user(
            uid=uid,
            email=email,
            name=name,
            avatar_url=avatar_url
        )

        return user

    except auth.InvalidIdTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired Firebase ID token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication",
        )

def get_current_user_optional(
    token: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None

    try:
        # Use the same logic as get_current_user but return None on failure
        decoded_token = auth.verify_id_token(token.credentials)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")

        if not uid or not email:
            return None

        user_service = UserService(db)
        return user_service.get_or_create_user(
            uid=uid,
            email=email,
            name=decoded_token.get("name"),
            avatar_url=decoded_token.get("picture")
        )
    except Exception:
        # Silently fail for optional authentication
        return None