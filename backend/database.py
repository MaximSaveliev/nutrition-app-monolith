"""
Database connection using Singleton Pattern
Ensures only one database connection pool is created
"""
from supabase import create_client, Client
from config import get_settings
import redis
from typing import Optional


class DatabaseConnection:
    """
    Singleton Pattern: Database Connection Manager
    Maintains single instances of Supabase and Redis clients
    """
    _instance: Optional['DatabaseConnection'] = None
    _supabase_client: Optional[Client] = None
    _redis_client: Optional[redis.Redis] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseConnection, cls).__new__(cls)
        return cls._instance
    
    def get_supabase_client(self) -> Client:
        """Get Supabase client instance"""
        if self._supabase_client is None:
            settings = get_settings()
            self._supabase_client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        return self._supabase_client
    
    def get_redis_client(self) -> redis.Redis:
        """Get Redis client instance"""
        if self._redis_client is None:
            settings = get_settings()
            self._redis_client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                password=settings.redis_password,
                decode_responses=True
            )
        return self._redis_client


# Singleton instance
db_connection = DatabaseConnection()
