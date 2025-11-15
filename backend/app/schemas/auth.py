"""
Pattern: Builder (Creational)
Pydantic models provide type-safe, validated data structures
Complex objects built step-by-step with automatic validation
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserSignUpRequest(BaseModel):
    """
    Pattern: Builder (Creational)
    Builds valid user sign-up request with step-by-step field validation
    """
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="User's password")
    repeat_password: str = Field(..., description="Password confirmation")
    nickname: str = Field(..., min_length=3, max_length=50, description="User's nickname")

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Nickname is required")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Nickname can only contain letters, numbers, underscores, and hyphens")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
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
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class UserLoginRequest(BaseModel):
    """Login request with email and password"""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")


class ForgotPasswordRequest(BaseModel):
    """Password reset request"""
    email: EmailStr = Field(..., description="User's email address")


class ResetPasswordRequest(BaseModel):
    """
    Pattern: Builder (Creational)
    Builds valid password reset with validation
    """
    token: str = Field(..., description="Password reset token from email")
    password: str = Field(..., min_length=8, description="New password")
    repeat_password: str = Field(..., description="Password confirmation")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
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
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v


class TokenResponse(BaseModel):
    """Authentication token response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: "UserResponse"


class UserResponse(BaseModel):
    """User profile response"""
    id: str = Field(..., description="User's unique identifier")
    email: str = Field(..., description="User's email address")
    nickname: str = Field(..., description="User's nickname")
    email_confirmed: bool = Field(default=False, description="Email confirmation status")
    dietary_restrictions: List[str] = Field(default=[], description="User's dietary restrictions")
    preferred_cuisines: List[str] = Field(default=[], description="User's preferred cuisines")
    daily_calorie_goal: Optional[int] = Field(default=2000, description="Daily calorie goal")
    daily_protein_goal: Optional[int] = Field(default=150, description="Daily protein goal in grams")
    daily_carbs_goal: Optional[int] = Field(default=250, description="Daily carbs goal in grams")
    daily_fat_goal: Optional[int] = Field(default=70, description="Daily fat goal in grams")
    created_at: Optional[datetime] = Field(None, description="Account creation timestamp")

    class Config:
        from_attributes = True


class UpdateDietaryPreferencesRequest(BaseModel):
    """Update dietary restrictions"""
    dietary_restrictions: List[str] = Field(..., description="List of dietary restrictions")


class UpdatePreferredCuisinesRequest(BaseModel):
    """Update preferred cuisines"""
    preferred_cuisines: List[str] = Field(..., description="List of preferred cuisines")


class UpdateNutritionGoalsRequest(BaseModel):
    """Update daily nutrition goals"""
    daily_calorie_goal: int = Field(..., ge=0, description="Daily calorie goal")
    daily_protein_goal: int = Field(..., ge=0, description="Daily protein goal in grams")
    daily_carbs_goal: int = Field(..., ge=0, description="Daily carbs goal in grams")
    daily_fat_goal: int = Field(..., ge=0, description="Daily fat goal in grams")


class AuthResponse(BaseModel):
    """Generic authentication response"""
    message: str = Field(..., description="Response message")
    success: bool = Field(..., description="Operation success status")
    data: Optional[dict] = Field(None, description="Additional response data")


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
