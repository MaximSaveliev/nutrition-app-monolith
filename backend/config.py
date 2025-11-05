"""
Configuration management using Singleton Pattern
This ensures only one configuration instance exists throughout the application
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
    # Groq API Configuration
    groq_api_key: str
    
    # Redis Configuration
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    
    # Application Settings
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Singleton Pattern: Using lru_cache to ensure only one instance
@lru_cache()
def get_settings() -> Settings:
    """
    Singleton Pattern Implementation
    Returns the same Settings instance for every call
    """
    return Settings()
