from fastapi import APIRouter, Depends, status
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
