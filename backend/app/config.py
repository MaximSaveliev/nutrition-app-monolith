"""
Configuration Settings
Pattern: Singleton Pattern - Ensures single instance of configuration across the app
Why: Settings should be loaded once and shared across all modules to prevent
      multiple environment reads and ensure consistency
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    supabase_service_key: str

    # JWT Configuration
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Application Configuration
    app_env: str = "development"
    api_prefix: str = "/api"
    frontend_url: str = "http://localhost:3000"

    # Redis Configuration
    redis_url: str = "redis://localhost:6379"

    # RabbitMQ Configuration
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"

    # Groq API
    groq_api_key: Optional[str] = None

    model_config = SettingsConfigDict(
        # Look for .env files in parent directory (repo root).
        # The repository root contains `.env.local` (created by the user / Vercel).
        # This makes local dev and CI more predictable.
        # On Vercel, environment variables are set directly, so env_file is optional
        env_file="../.env.local",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # Allow environment variables from Vercel
        env_ignore_empty=True,
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance (Singleton Pattern)
    The @lru_cache decorator ensures only one instance is created
    """
    return Settings()
