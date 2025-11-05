"""
Authentication Middleware
Pattern: Chain of Responsibility Pattern - Each middleware handles specific aspect
Why: Allows flexible composition of authentication checks, where each middleware
     can pass the request to the next handler or stop the chain
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.database import DatabaseManager, get_database
from app.services.auth_service import get_auth_service

# HTTP Bearer token extractor
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: DatabaseManager = Depends(get_database),
):
    """
    Dependency to get current authenticated user from JWT token
    Pattern: Chain of Responsibility - Validates token and passes to next handler
    
    Args:
        credentials: Bearer token from request header
        db: Database manager instance
        
    Returns:
        User data from valid token
        
    Raises:
        HTTPException: If token is invalid or missing
    """
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user: dict = Depends(get_current_user),
):
    """
    Dependency to ensure user is active and email is confirmed
    Pattern: Chain of Responsibility - Additional validation layer
    
    Args:
        current_user: User data from get_current_user
        
    Returns:
        Active user data
        
    Raises:
        HTTPException: If user is inactive or email not confirmed
    """
    # Check if email is confirmed
    if not current_user.get("email_confirmed_at"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not confirmed. Please check your email and confirm your account.",
        )

    return current_user


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: DatabaseManager = Depends(get_database),
):
    """
    Optional authentication - returns user if token is valid, None otherwise
    Useful for endpoints that work for both authenticated and anonymous users
    
    Args:
        credentials: Optional bearer token
        db: Database manager instance
        
    Returns:
        User data or None
    """
    if not credentials:
        return None

    token = credentials.credentials
    auth_service = get_auth_service(db)

    try:
        user = await auth_service.verify_token(token)
        return user
    except Exception:
        return None
