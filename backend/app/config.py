"""
Configuration Settings
Pattern: Singleton Pattern - Single configuration instance across the app
"""
import os
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    In development: Loads from .env.local file
    In production (Vercel): Loads from environment variables set in Vercel Dashboard
    """

    # Supabase Configuration
    supabase_url: str
    supabase_key: str = Field(validation_alias="supabase_anon_key")
    supabase_service_key: str = Field(validation_alias="supabase_service_role_key")

    # JWT Configuration
    jwt_secret_key: str = Field(validation_alias="supabase_jwt_secret")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Application Configuration
    app_env: str = "development"
    api_prefix: str = "/api"
    frontend_url: Optional[str] = None
    vercel_url: Optional[str] = None  # Automatically set by Vercel

    # Optional Services (not required for basic auth)
    redis_url: str = "redis://localhost:6379"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    groq_api_key: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    def get_base_url(self) -> str:
        """
        Get the base URL for the application.
        Automatically detects Vercel deployment URL or uses configured frontend_url.
        
        Priority:
        1. FRONTEND_URL (if explicitly set)
        2. VERCEL_URL (automatically set by Vercel for each deployment)
        3. Fallback to localhost:3000
        """
        if self.frontend_url:
            return self.frontend_url
        
        if self.vercel_url:
            # Vercel provides the URL without protocol, add https://
            return f"https://{self.vercel_url}"
        
        # Fallback for local development
        return "http://localhost:3000"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance (Singleton Pattern)
    The @lru_cache decorator ensures only one instance is created
    """
    return Settings()
