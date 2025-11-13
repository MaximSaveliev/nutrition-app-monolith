"""
Pattern: Facade (Structural)
Simplifies complex Supabase authentication operations into clean interface
"""
from typing import Dict
from fastapi import HTTPException, status
from app.config import get_settings
from app.database import DatabaseManager
from app.schemas.auth import UserLoginRequest, UserSignUpRequest


class AuthenticationService:
    """
    Pattern: Facade (Structural)
    Provides simple interface for complex authentication workflows
    Hides Supabase API complexity from application layer
    """

    def __init__(self, db: DatabaseManager):
        self.db = db
        self.settings = get_settings()

    async def register_user(self, signup_data: UserSignUpRequest) -> Dict[str, any]:
        """Register new user with email confirmation"""
        try:
            users = self.db.admin_client.auth.admin.list_users()
            if users and any(u.email and u.email.lower() == signup_data.email.lower() for u in users):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
            
            existing_user = self.db.admin_client.table("users").select("id").eq(
                "nickname", signup_data.nickname
            ).execute()
            if existing_user.data:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, 
                    detail="Nickname already taken. Please choose a different one."
                )
            
            base_url = self.settings.get_base_url()
            response = self.db.client.auth.sign_up({
                "email": signup_data.email,
                "password": signup_data.password,
                "options": {"email_redirect_to": f"{base_url}/auth/login?confirmed=true"}
            })

            if not response.user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create user account")

            try:
                self.db.admin_client.table("users").insert({
                    "id": response.user.id,
                    "nickname": signup_data.nickname
                }).execute()
            except Exception:
                try:
                    self.db.admin_client.auth.admin.delete_user(response.user.id)
                except Exception:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user profile. Please try again."
                )

            return {
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "nickname": signup_data.nickname,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "created_at": response.user.created_at,
                },
                "message": "User registered successfully. Please check your email to confirm your account.",
            }
        except HTTPException:
            raise
        except Exception as e:
            if any(kw in str(e).lower() for kw in ["already", "exists", "duplicate", "unique"]):
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or nickname already registered")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {str(e)}")

    async def authenticate_user(self, login_data: UserLoginRequest) -> Dict[str, any]:
        """Authenticate user and return session token"""
        try:
            response = self.db.client.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password,
            })

            if not response.user or not response.session:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

            nickname = self._fetch_user_nickname(response.user.id)

            return {
                "access_token": response.session.access_token,
                "token_type": "bearer",
                "expires_in": response.session.expires_in,
                "user": {
                    "id": response.user.id,
                    "email": response.user.email,
                    "nickname": nickname,
                    "email_confirmed_at": response.user.email_confirmed_at,
                    "created_at": response.user.created_at,
                },
            }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    async def verify_token(self, token: str) -> Dict[str, any]:
        """Verify JWT token and return user data"""
        try:
            response = self.db.client.auth.get_user(token)
            if not response.user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

            nickname = self._fetch_user_nickname(response.user.id)

            return {
                "id": response.user.id,
                "email": response.user.email,
                "nickname": nickname,
                "email_confirmed_at": response.user.email_confirmed_at,
                "created_at": response.user.created_at,
            }
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

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
            base_url = self.settings.get_base_url()
            redirect_url = f"{base_url}/auth/update-password"
            
            self.db.client.auth.reset_password_email(email, options={"redirect_to": redirect_url})
            
            return {
                "message": "Password reset email sent. Please check your inbox.",
                "redirect_url": redirect_url
            }
        except Exception:
            base_url = self.settings.get_base_url()
            return {
                "message": "If an account exists with this email, you will receive a password reset link.",
                "redirect_url": f"{base_url}/auth/update-password"
            }

    async def reset_password(self, access_token: str, new_password: str) -> Dict[str, any]:
        """Reset password using token from email"""
        try:
            from supabase import create_client
            
            temp_client = create_client(self.settings.supabase_url, self.settings.supabase_key)
            temp_client.auth.set_session(access_token, access_token)
            update_response = temp_client.auth.update_user({"password": new_password})
            
            if not update_response.user:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update password")

            nickname = self._fetch_user_nickname(update_response.user.id)

            return {
                "message": "Password updated successfully",
                "user": {
                    "id": update_response.user.id,
                    "email": update_response.user.email,
                    "nickname": nickname,
                    "email_confirmed_at": update_response.user.email_confirmed_at,
                    "created_at": update_response.user.created_at,
                },
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Password reset failed: {str(e)}")

    def _fetch_user_nickname(self, user_id: str) -> str:
        """Helper to fetch user nickname from database"""
        try:
            profile = self.db.admin_client.table("users").select("nickname").eq(
                "id", user_id
            ).single().execute()
            return profile.data.get("nickname") if profile.data else None
        except Exception:
            return None


def get_auth_service(db: DatabaseManager) -> AuthenticationService:
    """
    Pattern: Factory (Creational)
    Creates AuthenticationService with database dependency
    """
    return AuthenticationService(db)

