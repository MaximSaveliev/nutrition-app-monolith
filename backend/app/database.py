from typing import Optional
from supabase import Client, create_client
from app.config import get_settings


class DatabaseManager:
    """Pattern: Singleton - Single database connection instance"""
    
    _instance: Optional["DatabaseManager"] = None
    _client: Optional[Client] = None
    _admin_client: Optional[Client] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            settings = get_settings()
            self._client = create_client(settings.supabase_url, settings.supabase_key)
            self._admin_client = create_client(settings.supabase_url, settings.supabase_service_key)

    @property
    def client(self) -> Client:
        return self._client

    @property
    def admin_client(self) -> Client:
        return self._admin_client


def get_database() -> DatabaseManager:
    return DatabaseManager()
