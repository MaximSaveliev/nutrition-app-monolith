from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from datetime import date, timedelta
from typing import Optional
import base64
from app.database import DatabaseManager, get_database
from app.middleware.auth import get_current_user, optional_auth
from app.middleware.rate_limit import check_rate_limit
from app.schemas.nutrition import (
    AnalyzeDishRequest,
    DishAnalysisResponse,
    LogScannedDishRequest,
    ScannedDishEntry,
    DailyNutritionSummary
)
from app.schemas.daily_stats import DailyNutritionStatsResponse, WeeklyStatsResponse
from app.schemas.recipe import NutritionInfo
from app.services.nutrition_service import get_nutrition_service
from app.services.ai_service import get_ai_service
from app.services.image_service import get_image_service
from app.services.goal_observer import get_goal_tracker, get_toast_observer
from app.repositories.daily_stats_repository import DailyStatsRepository

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


@router.get("/rate-limit-status")
async def get_rate_limit_status(
    http_request: Request,
    current_user: Optional[dict] = Depends(optional_auth)
):
    """
    Check current rate limit status for the user/IP
    Returns remaining requests and reset time
    """
    from app.middleware.rate_limit import get_rate_limiter
    
    rate_limiter = get_rate_limiter()
    ip = rate_limiter.get_client_ip(http_request)
    is_authenticated = current_user is not None
    
    if is_authenticated:
        return {
            "authenticated": True,
            "unlimited": True,
            "remaining": -1,
            "total_limit": -1,
            "reset_at": None
        }
    
    usage = rate_limiter.get_usage(ip)
    return {
        "authenticated": False,
        "unlimited": False,
        "remaining": usage["remaining"],
        "total_limit": rate_limiter.max_requests_anonymous,
        "used": usage["count"],
        "reset_at": usage["reset_at"].isoformat() if usage["reset_at"] else None
    }


@router.post("/analyze-and-log-dish", response_model=DishAnalysisResponse)
async def analyze_and_log_dish(
    http_request: Request,
    file: UploadFile = File(...),
    meal_type: str = Form(...),
    current_user: Optional[dict] = Depends(optional_auth),
    db: DatabaseManager = Depends(get_database)
):
    """
    Analyzes dish image with AI and returns nutrition data.
    If user is authenticated, also saves the scanned dish to database.
    Rate Limiting: Anonymous users limited to 3 requests per 24 hours
    """
    # Check rate limit
    token = http_request.headers.get("Authorization", "").replace("Bearer ", "") if current_user else None
    rate_limit_info = await check_rate_limit(http_request, token)
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image content
    image_content = await file.read()
    
    # Convert to base64 for AI analysis
    image_base64 = base64.b64encode(image_content).decode('utf-8')
    
    # Analyze with AI
    ai_service = get_ai_service()
    try:
        analysis = await ai_service.analyze_nutrition(image_base64=f"data:image/jpeg;base64,{image_base64}")
        response = DishAnalysisResponse(**analysis)
        
        # Save to database if user is authenticated
        if current_user:
            try:
                from app.repositories.nutrition_repository import get_nutrition_repository
                
                print(f"[DEBUG] Saving dish for user: {current_user['id']}")
                
                # Optional: Upload image to Supabase Storage
                image_url = None
                try:
                    image_service = get_image_service(db)
                    filename = f"scanned_dishes/{current_user['id']}/{file.filename}"
                    # Reset file pointer
                    import io
                    image_url = await image_service.upload_image(
                        io.BytesIO(image_content), 
                        filename
                    )
                    print(f"[DEBUG] Image uploaded: {image_url}")
                except Exception as upload_error:
                    print(f"Warning: Image upload failed: {upload_error}")
                
                # Save to database using admin client to bypass RLS
                nutrition_repo = get_nutrition_repository(db)
                log_request = LogScannedDishRequest(
                    dish_name=response.dish_name,
                    nutrition=response.nutrition,
                    meal_type=meal_type,
                    image_url=image_url,
                    confidence_score=response.confidence_score
                )
                
                saved_dish = await nutrition_repo.log_scanned_dish(log_request, current_user["id"])
                print(f"[DEBUG] Dish saved successfully: {saved_dish.id}")
                
                # Check goals and notify observers (Observer Pattern)
                try:
                    goal_tracker = get_goal_tracker()
                    daily_stats_repo = DailyStatsRepository(db)
                    today = date.today()
                    
                    # Get updated daily stats
                    stats = await daily_stats_repo.get_daily_stats(current_user["id"], today)
                    
                    if stats:
                        # Get user goals
                        user_goals = {
                            'daily_calorie_goal': current_user.get('daily_calorie_goal', 2000),
                            'daily_protein_goal': current_user.get('daily_protein_goal', 150),
                            'daily_carbs_goal': current_user.get('daily_carbs_goal', 250),
                            'daily_fat_goal': current_user.get('daily_fat_goal', 70)
                        }
                        
                        # Check if any goals were achieved
                        await goal_tracker.check_goals(
                            user_id=current_user["id"],
                            daily_stats=stats,
                            user_goals=user_goals,
                            target_date=today
                        )
                except Exception as goal_error:
                    print(f"Warning: Goal check failed: {goal_error}")
                    # Don't fail the request if goal checking fails
            except Exception as db_error:
                print(f"Error: Failed to log scanned dish: {db_error}")
                import traceback
                traceback.print_exc()
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.post("/recognize-ingredients")
async def recognize_ingredients(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Recognizes ingredients from an uploaded image
    """
    image_base64 = request.get("image_base64")
    if not image_base64:
        raise HTTPException(status_code=400, detail="image_base64 required")
    
    ai_service = get_ai_service()
    try:
        result = await ai_service.recognize_ingredients(image_base64=image_base64)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")


@router.post("/analyze-dish", response_model=DishAnalysisResponse)
async def analyze_dish(
    request: AnalyzeDishRequest,
    current_user: dict = Depends(get_current_user)
):
    ai_service = get_ai_service()
    
    result = await ai_service.analyze_nutrition(image_base64=str(request.image_url))
    
    return DishAnalysisResponse(**result)


@router.post("/log-meal", response_model=ScannedDishEntry)
async def log_meal(
    request: LogScannedDishRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    nutrition_service = get_nutrition_service(db)
    
    return await nutrition_service.log_meal(
        user_id=current_user["id"],
        dish_name=request.dish_name,
        nutrition=request.nutrition,
        meal_type=request.meal_type,
        image_url=request.image_url,
        confidence_score=request.confidence_score
    )


@router.get("/daily-log", response_model=DailyNutritionSummary)
async def get_daily_log(
    target_date: date = None,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    if not target_date:
        target_date = date.today()
    
    print(f"[DEBUG] Fetching daily log for user {current_user['id']} on {target_date}")
    
    nutrition_service = get_nutrition_service(db)
    summary = await nutrition_service.get_daily_summary(current_user["id"], target_date)
    
    print(f"[DEBUG] Daily summary: {summary.total_calories} cal, {len(summary.meals)} meals")
    
    return summary


@router.get("/daily-stats")
async def get_daily_stats(
    target_date: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    """
    Get pre-aggregated daily nutrition statistics (fast query)
    Uses the daily_nutrition_stats table for instant results
    """
    if not target_date:
        target_date = date.today()
    
    daily_stats_repo = DailyStatsRepository(db)
    stats = await daily_stats_repo.get_daily_stats(current_user["id"], target_date)
    
    if not stats:
        # Return zero values if no data for this date
        return {
            "date": target_date,
            "total_calories": 0,
            "total_protein_g": 0,
            "total_carbs_g": 0,
            "total_fat_g": 0,
            "total_fiber_g": 0,
            "total_sugar_g": 0,
            "total_sodium_mg": 0,
            "meal_count": 0
        }
    
    return stats


@router.get("/weekly-stats")
async def get_weekly_stats(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    """
    Get pre-aggregated weekly nutrition statistics (very fast query)
    Uses the daily_nutrition_stats table for instant results
    Returns data for the last N days (default: 7)
    """
    daily_stats_repo = DailyStatsRepository(db)
    stats = await daily_stats_repo.get_weekly_stats(current_user["id"], days)
    
    return {
        "stats": stats,
        "start_date": date.today() - timedelta(days=days - 1),
        "end_date": date.today(),
        "total_days": days
    }


@router.get("/notifications")
async def get_notifications(
    unread_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Get goal achievement notifications for the user
    Uses Observer Pattern to retrieve notifications from ToastNotificationObserver
    
    Returns notifications that can be displayed as toast/sonner in frontend
    """
    user_id = current_user["id"]
    print(f"\n📬 [API] GET /notifications for user {user_id}, unread_only={unread_only}")
    
    toast_observer = get_toast_observer()
    notifications = toast_observer.get_notifications(user_id, unread_only)
    
    print(f"📬 [API] Found {len(notifications)} notifications")
    if notifications:
        print(f"📬 [API] Notification IDs: {[n.get('id') for n in notifications]}")
    
    return {
        "notifications": notifications,
        "count": len(notifications)
    }


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    toast_observer = get_toast_observer()
    toast_observer.mark_as_read(current_user["id"], notification_id)
    
    return {"status": "success", "message": "Notification marked as read"}


@router.delete("/notifications")
async def clear_notifications(
    current_user: dict = Depends(get_current_user)
):
    """Clear all notifications for the user"""
    toast_observer = get_toast_observer()
    toast_observer.clear_notifications(current_user["id"])
    
    return {"status": "success", "message": "All notifications cleared"}
