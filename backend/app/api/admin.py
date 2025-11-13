"""Admin endpoints for monitoring and management"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict
from app.middleware.rate_limit import get_rate_limiter
import json

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/rate-limits")
async def list_rate_limits():
    """
    View all current rate limit entries in Redis
    Returns list of IPs with their usage counts
    """
    rate_limiter = get_rate_limiter()
    
    if not rate_limiter.redis_client:
        return {
            "error": "Redis not connected",
            "storage": "in-memory",
            "data": rate_limiter.usage_tracker
        }
    
    try:
        # Get all rate limit keys
        keys = rate_limiter.redis_client.keys("rate_limit:*")
        
        results = []
        for key in keys:
            data = rate_limiter.redis_client.get(key)
            ttl = rate_limiter.redis_client.ttl(key)
            
            if data:
                usage = json.loads(data)
                ip = key.replace("rate_limit:", "")
                results.append({
                    "ip": ip,
                    "count": usage["count"],
                    "remaining": rate_limiter.max_requests_anonymous - usage["count"],
                    "reset_at": usage["reset_at"],
                    "ttl_seconds": ttl,
                    "ttl_hours": round(ttl / 3600, 2)
                })
        
        return {
            "total_ips": len(results),
            "max_requests": rate_limiter.max_requests_anonymous,
            "entries": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redis error: {str(e)}")


@router.delete("/rate-limits/{ip}")
async def reset_rate_limit(ip: str):
    """
    Reset rate limit for a specific IP address
    Useful for testing or customer support
    """
    rate_limiter = get_rate_limiter()
    
    if not rate_limiter.redis_client:
        # In-memory fallback
        if ip in rate_limiter.usage_tracker:
            del rate_limiter.usage_tracker[ip]
            return {"message": f"Rate limit reset for {ip} (in-memory)"}
        return {"message": f"No rate limit found for {ip}"}
    
    try:
        key = f"rate_limit:{ip}"
        deleted = rate_limiter.redis_client.delete(key)
        
        if deleted:
            return {"message": f"Rate limit reset for {ip}", "key_deleted": True}
        else:
            return {"message": f"No rate limit found for {ip}", "key_deleted": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redis error: {str(e)}")


@router.delete("/rate-limits")
async def reset_all_rate_limits():
    """
    Reset ALL rate limits
    ⚠️ Use with caution - clears all anonymous user restrictions
    """
    rate_limiter = get_rate_limiter()
    
    if not rate_limiter.redis_client:
        # In-memory fallback
        count = len(rate_limiter.usage_tracker)
        rate_limiter.usage_tracker.clear()
        return {
            "message": f"Cleared {count} rate limits (in-memory)",
            "count": count
        }
    
    try:
        # Get all rate limit keys
        keys = rate_limiter.redis_client.keys("rate_limit:*")
        
        if not keys:
            return {"message": "No rate limits to clear", "count": 0}
        
        # Delete all keys
        deleted = rate_limiter.redis_client.delete(*keys)
        
        return {
            "message": f"Cleared {deleted} rate limits from Redis",
            "count": deleted
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redis error: {str(e)}")


@router.get("/redis/status")
async def redis_status():
    """Check Redis connection status and basic info"""
    from app.config import get_settings
    settings = get_settings()
    rate_limiter = get_rate_limiter()
    
    # Try to initialize Redis if not done yet
    if rate_limiter.redis_client is None and not hasattr(rate_limiter, '_redis_init_attempted'):
        rate_limiter._init_redis(settings.redis_url)
        rate_limiter._redis_init_attempted = True
    
    if not rate_limiter.redis_client:
        return {
            "connected": False,
            "storage": "in-memory",
            "message": "Redis not configured or connection failed",
            "redis_url_configured": bool(settings.redis_url),
            "redis_url_preview": settings.redis_url[:30] + "..." if settings.redis_url else None
        }
    
    try:
        # Ping Redis
        rate_limiter.redis_client.ping()
        
        # Get some stats
        info = rate_limiter.redis_client.info("stats")
        keys = rate_limiter.redis_client.keys("rate_limit:*")
        
        return {
            "connected": True,
            "storage": "redis",
            "total_rate_limit_keys": len(keys),
            "total_commands_processed": info.get("total_commands_processed", 0),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0)
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)
        }
