from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from app.database import DatabaseManager, get_database
from app.middleware.auth import get_current_user
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserResponse,
    UserSignUpRequest,
    UpdateDietaryPreferencesRequest,
    UpdatePreferredCuisinesRequest,
    UpdateNutritionGoalsRequest,
)
from app.services.auth_service import get_auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignUpRequest, db: DatabaseManager = Depends(get_database)):
    auth_service = get_auth_service(db)
    result = await auth_service.register_user(user_data)
    return AuthResponse(message=result["message"], success=True, data={"user": result["user"]})


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLoginRequest, db: DatabaseManager = Depends(get_database)):
    auth_service = get_auth_service(db)
    result = await auth_service.authenticate_user(credentials)
    return TokenResponse(
        access_token=result["access_token"],
        token_type=result["token_type"],
        expires_in=result["expires_in"],
        user=UserResponse(**result["user"]),
    )


@router.post("/logout", response_model=AuthResponse)
async def logout(current_user: dict = Depends(get_current_user), db: DatabaseManager = Depends(get_database)):
    auth_service = get_auth_service(db)
    result = await auth_service.logout_user(current_user.get("id"))
    return AuthResponse(message=result["message"], success=True)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)


@router.get("/verify", response_model=AuthResponse)
async def verify_token(current_user: dict = Depends(get_current_user)):
    return AuthResponse(message="Token is valid", success=True, data={"user": current_user})


@router.post("/forgot-password", response_model=AuthResponse)
async def forgot_password(request_data: ForgotPasswordRequest, db: DatabaseManager = Depends(get_database)):
    auth_service = get_auth_service(db)
    result = await auth_service.request_password_reset(request_data.email)
    return AuthResponse(message=result["message"], success=True)


@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(reset_data: ResetPasswordRequest, db: DatabaseManager = Depends(get_database)):
    auth_service = get_auth_service(db)
    result = await auth_service.reset_password(reset_data.token, reset_data.password)
    return AuthResponse(message=result["message"], success=True, data={"user": result["user"]})


@router.patch("/dietary-preferences", response_model=UserResponse)
async def update_dietary_preferences(
    preferences: UpdateDietaryPreferencesRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database),
):
    """Update user's dietary restrictions"""
    try:
        response = (
            db.admin_client.table("users")
            .update({"dietary_restrictions": preferences.dietary_restrictions})
            .eq("id", current_user["id"])
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Fetch updated user data
        updated_user = (
            db.admin_client.table("users")
            .select("*")
            .eq("id", current_user["id"])
            .single()
            .execute()
        )

        return UserResponse(
            id=updated_user.data["id"],
            email=current_user["email"],
            nickname=updated_user.data["nickname"],
            email_confirmed=current_user.get("email_confirmed_at") is not None,
            dietary_restrictions=updated_user.data.get("dietary_restrictions", []),
            preferred_cuisines=updated_user.data.get("preferred_cuisines", []),
            daily_calorie_goal=updated_user.data.get("daily_calorie_goal", 2000),
            daily_protein_goal=updated_user.data.get("daily_protein_goal", 150),
            daily_carbs_goal=updated_user.data.get("daily_carbs_goal", 250),
            daily_fat_goal=updated_user.data.get("daily_fat_goal", 70),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update dietary preferences: {str(e)}")


@router.patch("/preferred-cuisines", response_model=UserResponse)
async def update_preferred_cuisines(
    preferences: UpdatePreferredCuisinesRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database),
):
    """Update user's preferred cuisines"""
    try:
        response = (
            db.admin_client.table("users")
            .update({"preferred_cuisines": preferences.preferred_cuisines})
            .eq("id", current_user["id"])
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Fetch updated user data
        updated_user = (
            db.admin_client.table("users")
            .select("*")
            .eq("id", current_user["id"])
            .single()
            .execute()
        )

        return UserResponse(
            id=updated_user.data["id"],
            email=current_user["email"],
            nickname=updated_user.data["nickname"],
            email_confirmed=current_user.get("email_confirmed_at") is not None,
            dietary_restrictions=updated_user.data.get("dietary_restrictions", []),
            preferred_cuisines=updated_user.data.get("preferred_cuisines", []),
            daily_calorie_goal=updated_user.data.get("daily_calorie_goal", 2000),
            daily_protein_goal=updated_user.data.get("daily_protein_goal", 150),
            daily_carbs_goal=updated_user.data.get("daily_carbs_goal", 250),
            daily_fat_goal=updated_user.data.get("daily_fat_goal", 70),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preferred cuisines: {str(e)}")


@router.patch("/nutrition-goals", response_model=UserResponse)
async def update_nutrition_goals(
    goals: UpdateNutritionGoalsRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database),
):
    """Update user's daily nutrition goals"""
    try:
        response = (
            db.admin_client.table("users")
            .update({
                "daily_calorie_goal": goals.daily_calorie_goal,
                "daily_protein_goal": goals.daily_protein_goal,
                "daily_carbs_goal": goals.daily_carbs_goal,
                "daily_fat_goal": goals.daily_fat_goal,
            })
            .eq("id", current_user["id"])
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Fetch updated user data
        updated_user = (
            db.admin_client.table("users")
            .select("*")
            .eq("id", current_user["id"])
            .single()
            .execute()
        )

        return UserResponse(
            id=updated_user.data["id"],
            email=current_user["email"],
            nickname=updated_user.data["nickname"],
            email_confirmed=current_user.get("email_confirmed_at") is not None,
            dietary_restrictions=updated_user.data.get("dietary_restrictions", []),
            preferred_cuisines=updated_user.data.get("preferred_cuisines", []),
            daily_calorie_goal=updated_user.data.get("daily_calorie_goal", 2000),
            daily_protein_goal=updated_user.data.get("daily_protein_goal", 150),
            daily_carbs_goal=updated_user.data.get("daily_carbs_goal", 250),
            daily_fat_goal=updated_user.data.get("daily_fat_goal", 70),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update nutrition goals: {str(e)}")


@router.delete("/account", response_model=AuthResponse)
async def delete_account(
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database),
):
    """Delete user account and all associated data"""
    try:
        auth_service = get_auth_service(db)
        
        # Delete user from Supabase auth (this will cascade delete all related data due to FK constraints)
        db.admin_client.auth.admin.delete_user(current_user["id"])
        
        return AuthResponse(
            message="Account successfully deleted",
            success=True,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")
