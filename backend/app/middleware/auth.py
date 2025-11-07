"""Pattern: Chain of Responsibility - Flexible authentication check composition"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.database import DatabaseManager, get_database
from app.services.auth_service import get_auth_service

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: DatabaseManager = Depends(get_database),
):
    """Pattern: Chain of Responsibility - Validates token and passes to next handler"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    auth_service = get_auth_service(db)

    try:
        user = await auth_service.verify_token(token)
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Pattern: Chain of Responsibility - Additional email confirmation validation layer"""
    if not current_user.get("email_confirmed_at"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not confirmed. Please check your email and confirm your account.",
        )
    return current_user


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: DatabaseManager = Depends(get_database),
):
    """Optional authentication for endpoints that work for both authenticated and anonymous users"""
    if not credentials:
        return None

    token = credentials.credentials
    auth_service = get_auth_service(db)

    try:
        user = await auth_service.verify_token(token)
        return user
    except Exception:
        return None
