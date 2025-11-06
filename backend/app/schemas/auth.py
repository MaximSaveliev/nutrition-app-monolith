"""
Data Transfer Objects for Authentication
Pattern: Builder Pattern (implicitly through Pydantic)
Why: Pydantic models provide a clean way to build and validate complex data structures
     with type safety and automatic validation
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserSignUpRequest(BaseModel):
    """Request model for user registration"""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="User's password")
    repeat_password: str = Field(..., description="Password confirmation")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter")
        return v

    @field_validator("repeat_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate password confirmation matches"""
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class UserLoginRequest(BaseModel):
    """Request model for user login"""

    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class EmailVerificationRequest(BaseModel):
    """Request model for email verification"""

    token_hash: str = Field(..., description="Email verification token hash")
    type: str = Field(..., description="Verification type (e.g., 'email')")


class ForgotPasswordRequest(BaseModel):
    """Request model for password reset request"""

    email: EmailStr = Field(..., description="User's email address")


class ResetPasswordRequest(BaseModel):
    """Request model for password reset with token"""

    token: str = Field(..., description="Password reset token from email")
    password: str = Field(..., min_length=8, description="New password")
    repeat_password: str = Field(..., description="Password confirmation")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter")
        return v

    @field_validator("repeat_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate password confirmation matches"""
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class TokenResponse(BaseModel):
    """Response model for authentication tokens"""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: "UserResponse"


class UserResponse(BaseModel):
    """Response model for user data"""

    id: str = Field(..., description="User's unique identifier")
    email: str = Field(..., description="User's email address")
    email_confirmed_at: Optional[datetime] = Field(
        None, description="Email confirmation timestamp"
    )
    created_at: datetime = Field(..., description="Account creation timestamp")

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Generic authentication response"""

    message: str = Field(..., description="Response message")
    success: bool = Field(..., description="Operation success status")
    data: Optional[dict] = Field(None, description="Additional response data")


class ErrorResponse(BaseModel):
    """Error response model"""

    detail: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
