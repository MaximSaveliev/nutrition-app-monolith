"""Pattern: Facade - Simplified interface for Supabase authentication"""

from typing import Dict
from fastapi import HTTPException, status
from app.config import get_settings
from app.database import DatabaseManager
from app.schemas.auth import UserLoginRequest, UserSignUpRequest


class AuthenticationService:
    """Pattern: Facade - Simplifies complex authentication logic"""

    def __init__(self, db: DatabaseManager):
        self.db = db
        self.settings = get_settings()

    async def register_user(self, signup_data: UserSignUpRequest) -> Dict[str, any]:
        try:
            users = self.db.admin_client.auth.admin.list_users()
            if users and any(u.email and u.email.lower() == signup_data.email.lower() for u in users):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
            
            base_url = self.settings.get_base_url()
            response = self.db.client.auth.sign_up({
                "email": signup_data.email,
                "password": signup_data.password,
                "options": {"email_redirect_to": f"{base_url}/auth/login?confirmed=true"}
            })

            if not response.user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create user account")

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
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    async def verify_token(self, token: str) -> Dict[str, any]:
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

    async def logout_user(self, token: str) -> Dict[str, str]:
        try:
            self.db.client.auth.sign_out()
            return {"message": "Logout successful"}
        except Exception:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Logout failed")

    async def request_password_reset(self, email: str) -> Dict[str, str]:
        try:
            base_url = self.settings.get_base_url()
            redirect_url = f"{base_url}/auth/update-password"
            
            self.db.client.auth.reset_password_email(email, options={"redirect_to": redirect_url})
            
            return {
                "message": "Password reset email sent. Please check your inbox.",
                "redirect_url": redirect_url
            }
        except Exception as e:
            print(f"Password reset error: {str(e)}")
            base_url = self.settings.get_base_url()
            return {
                "message": "If an account exists with this email, you will receive a password reset link.",
                "redirect_url": f"{base_url}/auth/update-password"
            }

    async def reset_password(self, access_token: str, new_password: str) -> Dict[str, any]:
        try:
            from supabase import create_client
            
            temp_client = create_client(self.settings.supabase_url, self.settings.supabase_key)
            temp_client.auth.set_session(access_token, access_token)
            update_response = temp_client.auth.update_user({"password": new_password})
            
            if not update_response.user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update password")

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
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Password reset failed: {str(e)}")


def get_auth_service(db: DatabaseManager) -> AuthenticationService:
    """Pattern: Factory - Creates AuthenticationService with dependencies"""
    return AuthenticationService(db)

