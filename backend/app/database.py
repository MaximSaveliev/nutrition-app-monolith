"""
Database Connection Manager
Pattern: Singleton Pattern - Single database client instance
Why: Database connections are expensive resources that should be reused
     across the application rather than creating multiple instances
"""

from typing import Optional

from supabase import Client, create_client

from app.config import get_settings


class DatabaseManager:
    """Manages Supabase database connections"""

    _instance: Optional["DatabaseManager"] = None
    _client: Optional[Client] = None
    _admin_client: Optional[Client] = None

    def __new__(cls):
        """Ensure only one instance exists (Singleton Pattern)"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialize database connections if not already done"""
        if self._client is None:
            settings = get_settings()
            # Client for user operations (with anon key)
            self._client = create_client(settings.supabase_url, settings.supabase_key)
            # Admin client for privileged operations (with service role key)
            self._admin_client = create_client(
                settings.supabase_url, settings.supabase_service_key
            )

    @property
    def client(self) -> Client:
        """Get the standard Supabase client"""
        return self._client

    @property
    def admin_client(self) -> Client:
        """Get the admin Supabase client with elevated privileges"""
        return self._admin_client


def get_database() -> DatabaseManager:
    """Dependency injection helper for FastAPI routes"""
    return DatabaseManager()
