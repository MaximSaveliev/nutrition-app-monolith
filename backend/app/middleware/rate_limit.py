"""
Pattern: Decorator - Rate limiting middleware for API endpoints
Tracks usage by IP address for unauthorized users
"""

from fastapi import Request, HTTPException, status
from typing import Dict, Optional
from datetime import datetime, timedelta
import logging
import redis
import json

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Pattern: Singleton - Single instance tracks all rate limits
    Stores request counts in Redis for persistence across server restarts
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.max_requests_anonymous = 3
            cls._instance.redis_client = None
            cls._instance.usage_tracker = {}
        return cls._instance
    
    def _init_redis(self, redis_url: str):
        """Initialize Redis connection with provided URL"""
        if self.redis_client is not None:
            return  # Already initialized
            
        if redis_url:
            try:
                self.redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                logger.info("✅ Redis connected successfully for rate limiting")
            except Exception as e:
                logger.warning(f"⚠️ Redis connection failed: {e}. Falling back to in-memory storage.")
                self.redis_client = None
        else:
            logger.warning("⚠️ REDIS_URL not configured. Using in-memory storage.")
            self.redis_client = None
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request"""
        # Check X-Forwarded-For header first (for proxy/load balancer)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        # Fallback to direct client IP
        return request.client.host if request.client else "unknown"
    
    def check_limit(self, ip: str, is_authenticated: bool) -> Dict:
        """
        Check if request is within rate limit
        Returns: {"allowed": bool, "remaining": int, "reset_at": datetime}
        """
        # Initialize Redis on first use (lazy loading)
        if self.redis_client is None and not hasattr(self, '_redis_init_attempted'):
            from app.config import get_settings
            settings = get_settings()
            self._init_redis(settings.redis_url)
            self._redis_init_attempted = True
        
        # Authenticated users have unlimited access
        if is_authenticated:
            return {
                "allowed": True,
                "remaining": -1,  # -1 indicates unlimited
                "reset_at": None
            }
        
        # Try Redis first
        if self.redis_client:
            try:
                return self._check_limit_redis(ip)
            except Exception as e:
                logger.warning(f"Redis error, falling back to memory: {e}")
                return self._check_limit_memory(ip)
        else:
            return self._check_limit_memory(ip)
    
    def _check_limit_redis(self, ip: str) -> Dict:
        """Check rate limit using Redis"""
        key = f"rate_limit:{ip}"
        
        # Get current data from Redis
        data = self.redis_client.get(key)
        
        if not data:
            # First request - initialize
            usage = {
                "count": 0,
                "first_request": datetime.now().isoformat(),
                "reset_at": (datetime.now() + timedelta(hours=24)).isoformat()
            }
            self.redis_client.setex(key, 86400, json.dumps(usage))  # 24 hours TTL
        else:
            usage = json.loads(data)
        
        now = datetime.now()
        reset_at = datetime.fromisoformat(usage["reset_at"])
        
        # Check if limit exceeded
        if usage["count"] >= self.max_requests_anonymous:
            return {
                "allowed": False,
                "remaining": 0,
                "reset_at": reset_at
            }
        
        return {
            "allowed": True,
            "remaining": self.max_requests_anonymous - usage["count"],
            "reset_at": reset_at
        }
    
    def _check_limit_memory(self, ip: str) -> Dict:
        """Check rate limit using in-memory storage (fallback)"""
        # Get or create usage record for this IP
        if ip not in self.usage_tracker:
            self.usage_tracker[ip] = {
                "count": 0,
                "first_request": datetime.now(),
                "reset_at": datetime.now() + timedelta(hours=24)
            }
        
        usage = self.usage_tracker[ip]
        now = datetime.now()
        
        # Reset counter if 24 hours passed
        if now >= usage["reset_at"]:
            usage["count"] = 0
            usage["first_request"] = now
            usage["reset_at"] = now + timedelta(hours=24)
        
        # Check if limit exceeded
        if usage["count"] >= self.max_requests_anonymous:
            return {
                "allowed": False,
                "remaining": 0,
                "reset_at": usage["reset_at"]
            }
        
        return {
            "allowed": True,
            "remaining": self.max_requests_anonymous - usage["count"],
            "reset_at": usage["reset_at"]
        }
    
    def increment_usage(self, ip: str):
        """Increment usage counter for IP"""
        if self.redis_client:
            try:
                self._increment_usage_redis(ip)
            except Exception as e:
                logger.warning(f"Redis error, falling back to memory: {e}")
                self._increment_usage_memory(ip)
        else:
            self._increment_usage_memory(ip)
    
    def _increment_usage_redis(self, ip: str):
        """Increment usage in Redis"""
        key = f"rate_limit:{ip}"
        data = self.redis_client.get(key)
        
        if data:
            usage = json.loads(data)
            usage["count"] += 1
            # Calculate remaining TTL to preserve expiration
            ttl = self.redis_client.ttl(key)
            if ttl > 0:
                self.redis_client.setex(key, ttl, json.dumps(usage))
    
    def _increment_usage_memory(self, ip: str):
        """Increment usage in memory (fallback)"""
        if ip in self.usage_tracker:
            self.usage_tracker[ip]["count"] += 1
    
    def get_usage(self, ip: str) -> Dict:
        """Get current usage for IP"""
        if self.redis_client:
            try:
                return self._get_usage_redis(ip)
            except Exception as e:
                logger.warning(f"Redis error, falling back to memory: {e}")
                return self._get_usage_memory(ip)
        else:
            return self._get_usage_memory(ip)
    
    def _get_usage_redis(self, ip: str) -> Dict:
        """Get usage from Redis"""
        key = f"rate_limit:{ip}"
        data = self.redis_client.get(key)
        
        if not data:
            return {
                "count": 0,
                "remaining": self.max_requests_anonymous,
                "reset_at": None
            }
        
        usage = json.loads(data)
        return {
            "count": usage["count"],
            "remaining": max(0, self.max_requests_anonymous - usage["count"]),
            "reset_at": datetime.fromisoformat(usage["reset_at"])
        }
    
    def _get_usage_memory(self, ip: str) -> Dict:
        """Get usage from memory (fallback)"""
        if ip not in self.usage_tracker:
            return {
                "count": 0,
                "remaining": self.max_requests_anonymous,
                "reset_at": None
            }
        
        usage = self.usage_tracker[ip]
        return {
            "count": usage["count"],
            "remaining": max(0, self.max_requests_anonymous - usage["count"]),
            "reset_at": usage["reset_at"]
        }


def get_rate_limiter() -> RateLimiter:
    """Factory function to get rate limiter instance"""
    return RateLimiter()


async def check_rate_limit(
    request: Request,
    token: Optional[str] = None
) -> Dict:
    """
    Middleware function to check rate limits
    Returns usage info or raises HTTPException if limit exceeded
    """
    rate_limiter = get_rate_limiter()
    ip = rate_limiter.get_client_ip(request)
    is_authenticated = token is not None
    
    limit_check = rate_limiter.check_limit(ip, is_authenticated)
    
    if not limit_check["allowed"]:
        reset_time = limit_check["reset_at"].strftime("%Y-%m-%d %H:%M:%S") if limit_check["reset_at"] else "unknown"
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "Rate limit exceeded. Please sign up or log in to continue using AI features.",
                "limit": rate_limiter.max_requests_anonymous,
                "reset_at": reset_time,
                "requires_auth": True
            }
        )
    
    # Increment counter for anonymous users
    if not is_authenticated:
        rate_limiter.increment_usage(ip)
    
    return {
        "remaining": limit_check["remaining"],
        "reset_at": limit_check["reset_at"]
    }
