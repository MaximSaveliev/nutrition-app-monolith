"""
Decorator Pattern: Caching Decorator
Adds caching functionality to service methods
"""
from functools import wraps
from database import db_connection
import json
import hashlib
from typing import Any, Callable
import pickle


class CacheDecorator:
    """
    Decorator Pattern: Adds caching capability to functions
    Uses Redis for caching expensive operations
    """
    
    def __init__(self, ttl: int = 3600, prefix: str = "cache"):
        """
        Initialize cache decorator
        
        Args:
            ttl: Time to live in seconds (default: 1 hour)
            prefix: Cache key prefix
        """
        self.ttl = ttl
        self.prefix = prefix
        self.redis_client = db_connection.get_redis_client()
    
    def _generate_cache_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Generate a unique cache key based on function name and arguments"""
        # Create a string representation of arguments
        key_data = f"{func_name}:{str(args)}:{str(sorted(kwargs.items()))}"
        # Hash it to create a fixed-length key
        key_hash = hashlib.md5(key_data.encode()).hexdigest()
        return f"{self.prefix}:{func_name}:{key_hash}"
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator implementation"""
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Generate cache key
            cache_key = self._generate_cache_key(func.__name__, args, kwargs)
            
            try:
                # Try to get from cache
                cached_value = self.redis_client.get(cache_key)
                if cached_value:
                    print(f"Cache hit for {func.__name__}")
                    return pickle.loads(cached_value.encode('latin1'))
            except Exception as e:
                print(f"Cache read error: {str(e)}")
            
            # Execute function
            result = func(*args, **kwargs)
            
            try:
                # Store in cache
                serialized = pickle.dumps(result).decode('latin1')
                self.redis_client.setex(cache_key, self.ttl, serialized)
                print(f"Cached result for {func.__name__}")
            except Exception as e:
                print(f"Cache write error: {str(e)}")
            
            return result
        
        return wrapper


def cache_result(ttl: int = 3600, prefix: str = "cache"):
    """
    Convenience function to use cache decorator
    
    Usage:
        @cache_result(ttl=1800, prefix="nutrition")
        def expensive_function():
            pass
    """
    return CacheDecorator(ttl=ttl, prefix=prefix)


class LoggingDecorator:
    """
    Decorator Pattern: Adds logging to functions
    Logs function calls, parameters, and results
    """
    
    def __init__(self, log_args: bool = True, log_result: bool = False):
        self.log_args = log_args
        self.log_result = log_result
    
    def __call__(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            func_name = func.__name__
            
            # Log function call
            if self.log_args:
                print(f"Calling {func_name} with args={args}, kwargs={kwargs}")
            else:
                print(f"Calling {func_name}")
            
            try:
                result = func(*args, **kwargs)
                
                if self.log_result:
                    print(f"{func_name} returned: {result}")
                else:
                    print(f"{func_name} completed successfully")
                
                return result
            except Exception as e:
                print(f"Error in {func_name}: {str(e)}")
                raise
        
        return wrapper


def log_execution(log_args: bool = True, log_result: bool = False):
    """
    Convenience function for logging decorator
    
    Usage:
        @log_execution(log_args=True, log_result=True)
        def my_function():
            pass
    """
    return LoggingDecorator(log_args=log_args, log_result=log_result)
