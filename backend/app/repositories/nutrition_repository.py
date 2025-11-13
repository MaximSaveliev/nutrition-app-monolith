"""
Pattern: Repository (Structural)
Abstracts data access logic for nutrition tracking from business layer
"""
from typing import List, Optional, Dict
from datetime import datetime, date
from app.database import DatabaseManager
from app.schemas.nutrition import (
    LogScannedDishRequest,
    ScannedDishEntry,
    DailyNutritionSummary,
    NutritionInfo
)


class NutritionRepository:
    """
    Pattern: Repository (Structural)
    Encapsulates nutrition/scanned dishes data access logic
    Provides clean interface for business layer
    """
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    async def log_scanned_dish(self, dish_data: LogScannedDishRequest, user_id: str) -> ScannedDishEntry:
        """Create new scanned dish entry"""
        result = self.db.admin_client.table("scanned_dishes").insert({
            "user_id": user_id,
            "dish_name": dish_data.dish_name,
            "nutrition": dish_data.nutrition.model_dump(),
            "meal_type": dish_data.meal_type,
            "image_url": dish_data.image_url,
            "confidence_score": dish_data.confidence_score
        }).execute()
        
        return self._map_to_scanned_dish_entry(result.data[0])
    
    async def get_user_dishes(
        self, 
        user_id: str, 
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        meal_type: Optional[str] = None
    ) -> List[ScannedDishEntry]:
        """Retrieve user's scanned dishes with optional filters"""
        query = self.db.admin_client.table("scanned_dishes").select("*").eq("user_id", user_id)
        
        if start_date:
            query = query.gte("scanned_at", start_date.isoformat())
        
        if end_date:
            next_day = datetime.combine(end_date, datetime.min.time()).replace(hour=23, minute=59, second=59)
            query = query.lte("scanned_at", next_day.isoformat())
        
        if meal_type:
            query = query.eq("meal_type", meal_type)
        
        result = query.order("scanned_at", desc=True).execute()
        
        return [self._map_to_scanned_dish_entry(dish) for dish in result.data]
    
    async def get_daily_summary(self, user_id: str, target_date: date) -> DailyNutritionSummary:
        """Aggregate nutrition data for specific day"""
        start_datetime = datetime.combine(target_date, datetime.min.time())
        end_datetime = datetime.combine(target_date, datetime.max.time())
        
        result = self.db.admin_client.table("scanned_dishes").select("*").eq("user_id", user_id).gte(
            "scanned_at", start_datetime.isoformat()
        ).lte("scanned_at", end_datetime.isoformat()).order("scanned_at", desc=False).execute()
        
        meals = [self._map_to_scanned_dish_entry(dish) for dish in result.data]
        
        total_calories = sum(meal.nutrition.calories for meal in meals)
        total_protein_g = sum(meal.nutrition.protein_g for meal in meals)
        total_carbs_g = sum(meal.nutrition.carbs_g for meal in meals)
        total_fat_g = sum(meal.nutrition.fat_g for meal in meals)
        total_fiber_g = sum(meal.nutrition.fiber_g or 0 for meal in meals)
        total_sugar_g = sum(meal.nutrition.sugar_g or 0 for meal in meals)
        
        return DailyNutritionSummary(
            date=target_date.isoformat(),
            total_calories=total_calories,
            total_protein_g=total_protein_g,
            total_carbs_g=total_carbs_g,
            total_fat_g=total_fat_g,
            total_fiber_g=total_fiber_g,
            total_sugar_g=total_sugar_g,
            meals=meals
        )
    
    async def delete_scanned_dish(self, dish_id: str, user_id: str) -> bool:
        """Delete scanned dish"""
        result = self.db.admin_client.table("scanned_dishes").delete().eq(
            "id", dish_id
        ).eq("user_id", user_id).execute()
        
        return len(result.data) > 0
    
    def _map_to_scanned_dish_entry(self, data: Dict) -> ScannedDishEntry:
        """Map database row to Pydantic model"""
        return ScannedDishEntry(
            id=data["id"],
            user_id=data["user_id"],
            dish_name=data["dish_name"],
            nutrition=NutritionInfo(**data["nutrition"]),
            meal_type=data.get("meal_type"),
            image_url=data.get("image_url"),
            confidence_score=data.get("confidence_score"),
            scanned_at=datetime.fromisoformat(data["scanned_at"].replace("Z", "+00:00"))
        )


def get_nutrition_repository(db: DatabaseManager) -> NutritionRepository:
    """
    Pattern: Factory (Creational)
    Creates repository instance with database dependency
    """
    return NutritionRepository(db)
