import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Dict, Callable, Iterable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models import models

def create_access_token(subject: Any, role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

bearer_scheme = HTTPBearer(auto_error=False)

def decode_access_token(token: str) -> tuple:
    """Decode a JWT access token. Returns (user_id, role) or (None, None) when invalid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        subject = payload.get("sub")
        if subject is None:
            return None, None
        return int(subject), payload.get("role")
    except Exception:
        return None, None


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """Resolve the authenticated user from a Bearer token, or None when absent/invalid/deactivated."""
    if credentials is None or not credentials.credentials:
        return None
    user_id, _role = decode_access_token(credentials.credentials)
    if user_id is None:
        return None
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None or not user.is_active:
        return None
    return user


def get_current_user(user: models.User = Depends(get_optional_current_user)) -> models.User:
    """Require a valid authenticated user for an endpoint."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Provide a valid Authorization: Bearer <token>.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(*roles: str) -> Callable:
    """Build a FastAPI dependency that enforces server-side role authorization.

    Raises 403 when the authenticated user's role is not in the allowed set.
    """
    allowed = set(roles)

    def dependency(user: models.User = Depends(get_current_user)) -> models.User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. This action requires one of the following roles: {', '.join(sorted(allowed))}.",
            )
        return user

    return dependency

