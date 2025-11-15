"""
Pattern: Chain of Responsibility (Behavioral)
Authentication handlers composed in chain for flexible validation
"""
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
    """
    Pattern: Chain of Responsibility (Behavioral) - Handler 1
    Validates JWT token and returns user data
    Can be extended with additional handlers via Depends()
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
        user_data = await auth_service.verify_token(token)
        
        try:
            profile = db.admin_client.table("users").select("*").eq(
                "id", user_data["id"]
            ).single().execute()
            
            if profile.data:
                user_data["dietary_restrictions"] = profile.data.get("dietary_restrictions", [])
                user_data["preferred_cuisines"] = profile.data.get("preferred_cuisines", [])
                user_data["daily_calorie_goal"] = profile.data.get("daily_calorie_goal", 2000)
                user_data["daily_protein_goal"] = profile.data.get("daily_protein_goal", 150)
                user_data["daily_carbs_goal"] = profile.data.get("daily_carbs_goal", 250)
                user_data["daily_fat_goal"] = profile.data.get("daily_fat_goal", 70)
                user_data["email_confirmed"] = user_data.get("email_confirmed_at") is not None
        except Exception:
            user_data["dietary_restrictions"] = []
            user_data["preferred_cuisines"] = []
            user_data["daily_calorie_goal"] = 2000
            user_data["daily_protein_goal"] = 150
            user_data["daily_carbs_goal"] = 250
            user_data["daily_fat_goal"] = 70
            user_data["email_confirmed"] = user_data.get("email_confirmed_at") is not None
        
        return user_data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """
    Pattern: Chain of Responsibility (Behavioral) - Handler 2
    Additional validation layer for email confirmation
    Chains after get_current_user via Depends()
    """
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
    """
    Optional authentication for endpoints supporting both authenticated and anonymous users
    Returns None if no credentials provided
    """
    if not credentials:
        return None

    token = credentials.credentials
    auth_service = get_auth_service(db)

    try:
        user_data = await auth_service.verify_token(token)
        
        try:
            profile = db.admin_client.table("users").select("*").eq(
                "id", user_data["id"]
            ).single().execute()
            
            if profile.data:
                user_data["dietary_restrictions"] = profile.data.get("dietary_restrictions", [])
                user_data["preferred_cuisines"] = profile.data.get("preferred_cuisines", [])
                user_data["daily_calorie_goal"] = profile.data.get("daily_calorie_goal", 2000)
                user_data["daily_protein_goal"] = profile.data.get("daily_protein_goal", 150)
                user_data["daily_carbs_goal"] = profile.data.get("daily_carbs_goal", 250)
                user_data["daily_fat_goal"] = profile.data.get("daily_fat_goal", 70)
                user_data["email_confirmed"] = user_data.get("email_confirmed_at") is not None
        except Exception:
            user_data["dietary_restrictions"] = []
            user_data["preferred_cuisines"] = []
            user_data["daily_calorie_goal"] = 2000
            user_data["daily_protein_goal"] = 150
            user_data["daily_carbs_goal"] = 250
            user_data["daily_fat_goal"] = 70
            user_data["email_confirmed"] = user_data.get("email_confirmed_at") is not None
        
        return user_data
    except Exception:
        return None
