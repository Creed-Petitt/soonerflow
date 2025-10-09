from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from firebase_admin import auth

from database.models import User
from backend.services import UserService
from backend.api.deps import get_user_service, get_db

bearer_scheme = HTTPBearer()

def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token missing")
    try:
        decoded_token = auth.verify_id_token(token.credentials)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")

        # For anonymous users, email might be None - use a placeholder
        if not email:
            email = f"anonymous_{uid}@firebase.local"

        user = user_service.get_or_create_user(
            db=db,
            uid=uid,
            email=email,
            name=decoded_token.get("name") or "Anonymous User",
            avatar_url=decoded_token.get("picture")
        )
        return user
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")
