"""
Authentication Service
Pattern: Facade Pattern - Provides simplified interface to complex Supabase auth operations
Why: Hides the complexity of Supabase authentication, token management, and error handling
     behind a simple, easy-to-use interface for the controllers
"""

from datetime import datetime, timedelta
from typing import Dict, Optional

from fastapi import HTTPException, status

from app.config import get_settings
from app.database import DatabaseManager
from app.schemas.auth import UserLoginRequest, UserSignUpRequest


class AuthenticationService:
    """
    Handles all authentication operations
    Pattern: Facade Pattern - Simplifies complex authentication logic
    """

    def __init__(self, db: DatabaseManager):
        self.db = db
        self.settings = get_settings()

    async def register_user(self, signup_data: UserSignUpRequest) -> Dict[str, any]:
        """Register a new user account"""
        try:
            # Check if user already exists
            users = self.db.admin_client.auth.admin.list_users()
            if users and any(u.email and u.email.lower() == signup_data.email.lower() for u in users):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered",
                )
            
            # Create user with email verification
            # Set redirect URL to /auth/confirm
            base_url = self.settings.get_base_url()
            response = self.db.client.auth.sign_up({
                "email": signup_data.email,
                "password": signup_data.password,
                "options": {
                    "email_redirect_to": f"{base_url}/auth/login?confirmed=true"
                }
            })

            if not response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user account",
                )

            return {
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "created_at": response.user.created_at,
                },
                "message": "User registered successfully. Please check your email to confirm your account.",
            }

        except HTTPException:
            raise
        except Exception as e:
            if any(kw in str(e).lower() for kw in ["already", "exists", "duplicate", "unique"]):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {str(e)}")

    async def authenticate_user(self, login_data: UserLoginRequest) -> Dict[str, any]:
        """Authenticate user and create session"""
        try:
            response = self.db.client.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password,
            })

            if not response.user or not response.session:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

            return {
                "access_token": response.session.access_token,
                "token_type": "bearer",
                "expires_in": response.session.expires_in,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "created_at": response.user.created_at,
                },
            }

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    async def verify_token(self, token: str) -> Dict[str, any]:
        """Verify JWT token and return user data"""
        try:
            response = self.db.client.auth.get_user(token)
            if not response.user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

            return {
                "id": response.user.id,
                "email": response.user.email,
                "email_confirmed_at": response.user.email_confirmed_at,
                "created_at": response.user.created_at,
            }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    async def verify_email_token(self, token_hash: str, type: str) -> Dict[str, any]:
        """Verify email confirmation token"""
        try:
            # Verify the OTP token with Supabase
            response = self.db.client.auth.verify_otp({"token_hash": token_hash, "type": type})
            
            if not response.user or not response.session:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

            # Sign out immediately after verification
            # User should login manually after email confirmation
            self.db.client.auth.sign_out()

            return {
                "message": "Email verified successfully",
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "created_at": response.user.created_at,
                },
            }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email verification failed")

    async def logout_user(self, token: str) -> Dict[str, str]:
        """Logout user and invalidate session"""
        try:
            self.db.client.auth.sign_out()
            return {"message": "Logout successful"}
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Logout failed")

    async def request_password_reset(self, email: str) -> Dict[str, str]:
        """Send password reset email"""
        try:
            # Get base URL (automatically detects Vercel deployment URL)
            base_url = self.settings.get_base_url()
            redirect_url = f"{base_url}/auth/update-password"
            
            response = self.db.client.auth.reset_password_email(
                email,
                options={"redirect_to": redirect_url}
            )
            
            return {
                "message": "Password reset email sent. Please check your inbox.",
                "redirect_url": redirect_url  # Return the URL so frontend knows where to direct users
            }
        except Exception as e:
            # Don't reveal if email exists or not for security
            # But log the error for debugging
            print(f"Password reset error: {str(e)}")
            base_url = self.settings.get_base_url()
            return {
                "message": "If an account exists with this email, you will receive a password reset link.",
                "redirect_url": f"{base_url}/auth/update-password"
            }

    async def reset_password(self, access_token: str, new_password: str) -> Dict[str, any]:
        """Reset password using access token from email"""
        try:
            # Create a new client instance with the access token
            from supabase import create_client
            
            # Use the access token to authenticate
            temp_client = create_client(
                self.settings.supabase_url,
                self.settings.supabase_key
            )
            
            # Set the auth token
            temp_client.auth.set_session(access_token, access_token)
            
            # Update the password
            update_response = temp_client.auth.update_user({
                "password": new_password
            })
            
            if not update_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to update password"
                )

            return {
                "message": "Password updated successfully",
                "user": {
                    "id": update_response.user.id,
                    "email": update_response.user.email,
                    "email_confirmed_at": update_response.user.email_confirmed_at,
                    "created_at": update_response.user.created_at,
                },
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password reset failed: {str(e)}"
            )


def get_auth_service(db: DatabaseManager) -> AuthenticationService:
    """
    Factory function to create AuthenticationService instance
    Pattern: Factory Pattern (simple factory function)
    Why: Provides a clean way to instantiate the service with dependencies
    """
    return AuthenticationService(db)
