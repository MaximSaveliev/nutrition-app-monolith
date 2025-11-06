"""
Authentication API Routes
Handles HTTP requests for authentication operations
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import DatabaseManager, get_database
from app.middleware.auth import get_current_user
from app.schemas.auth import (
    AuthResponse,
    EmailVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserResponse,
    UserSignUpRequest,
)
from app.services.auth_service import get_auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with email and password",
)
async def signup(
    user_data: UserSignUpRequest,
    db: DatabaseManager = Depends(get_database),
):
    """
    Register a new user account
    
    - **email**: Valid email address
    - **password**: Strong password (min 8 chars, 1 uppercase, 1 digit)
    - **repeat_password**: Password confirmation
    """
    auth_service = get_auth_service(db)
    result = await auth_service.register_user(user_data)

    return AuthResponse(
        message=result["message"],
        success=True,
        data={"user": result["user"]},
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User login",
    description="Authenticate user and receive access token",
)
async def login(
    credentials: UserLoginRequest,
    db: DatabaseManager = Depends(get_database),
):
    """
    Authenticate user with email and password
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns JWT access token for authenticated requests
    """
    auth_service = get_auth_service(db)
    result = await auth_service.authenticate_user(credentials)

    return TokenResponse(
        access_token=result["access_token"],
        token_type=result["token_type"],
        expires_in=result["expires_in"],
        user=UserResponse(**result["user"]),
    )


@router.post(
    "/logout",
    response_model=AuthResponse,
    summary="User logout",
    description="Logout user and invalidate session",
)
async def logout(
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database),
):
    """
    Logout current user
    
    Requires valid authentication token in Authorization header
    """
    auth_service = get_auth_service(db)
    result = await auth_service.logout_user(current_user.get("id"))

    return AuthResponse(
        message=result["message"],
        success=True,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get authenticated user's profile information",
)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
):
    """
    Get current authenticated user's profile
    
    Requires valid authentication token in Authorization header
    """
    return UserResponse(**current_user)


@router.get(
    "/verify",
    response_model=AuthResponse,
    summary="Verify token",
    description="Verify if the provided token is valid",
)
async def verify_token(
    current_user: dict = Depends(get_current_user),
):
    """
    Verify authentication token validity
    
    Requires valid authentication token in Authorization header
    """
    return AuthResponse(
        message="Token is valid",
        success=True,
        data={"user": current_user},
    )


@router.post(
    "/verify-email",
    response_model=AuthResponse,
    summary="Verify email",
    description="Verify email confirmation token from Supabase email link",
)
async def verify_email(
    verification_data: EmailVerificationRequest,
    db: DatabaseManager = Depends(get_database),
):
    """
    Verify email confirmation token
    
    Called by the email confirmation link redirect
    """
    auth_service = get_auth_service(db)
    result = await auth_service.verify_email_token(
        verification_data.token_hash,
        verification_data.type
    )

    return AuthResponse(
        message=result["message"],
        success=True,
        data={"user": result["user"]},
    )


@router.post(
    "/forgot-password",
    response_model=AuthResponse,
    summary="Request password reset",
    description="Send password reset email to user",
)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: DatabaseManager = Depends(get_database),
):
    """
    Request password reset email
    
    - **email**: User's email address
    
    Sends an email with a password reset link
    """
    auth_service = get_auth_service(db)
    result = await auth_service.request_password_reset(request_data.email)

    return AuthResponse(
        message=result["message"],
        success=True,
    )


@router.post(
    "/reset-password",
    response_model=AuthResponse,
    summary="Reset password",
    description="Reset user password with token from email",
)
async def reset_password(
    reset_data: ResetPasswordRequest,
    db: DatabaseManager = Depends(get_database),
):
    """
    Reset password using token from email
    
    - **token**: Password reset token from email link
    - **password**: New password
    - **repeat_password**: Password confirmation
    """
    auth_service = get_auth_service(db)
    result = await auth_service.reset_password(
        reset_data.token,
        reset_data.password
    )

    return AuthResponse(
        message=result["message"],
        success=True,
        data={"user": result["user"]},
    )

