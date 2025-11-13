"""
Pattern: Singleton (Creational)
Ensures single Settings instance across application lifecycle
"""
from functools import lru_cache
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration with environment variable loading"""
    supabase_url: str
    supabase_key: str = Field(validation_alias="supabase_anon_key")
    supabase_service_key: str = Field(validation_alias="supabase_service_role_key")
    jwt_secret_key: str = Field(validation_alias="supabase_jwt_secret")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    app_env: str = "development"
    api_prefix: str = "/api"
    frontend_url: Optional[str] = None
    vercel_url: Optional[str] = None
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
        """Resolve base URL for current environment"""
        if self.frontend_url:
            return self.frontend_url
        if self.vercel_url:
            return f"https://{self.vercel_url}"
        return "http://localhost:3000"


@lru_cache()
def get_settings() -> Settings:
    """
    Pattern: Singleton (Creational)
    Returns single Settings instance using lru_cache
    """
    return Settings()
