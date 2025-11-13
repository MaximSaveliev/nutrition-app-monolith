"""
Pattern: Observer (Behavioral)
Subject-Observer pattern for nutrition tracking with goal achievement notifications
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from datetime import datetime, date
from app.database import DatabaseManager
from app.schemas.nutrition import ScannedDishEntry, DailyNutritionSummary, NutritionInfo


class NutritionObserver(ABC):
    """
    Pattern: Observer (Behavioral)
    Abstract observer interface for nutrition events
    """
    
    @abstractmethod
    async def update(self, event_type: str, data: Dict):
        """Called when nutrition event occurs"""
        pass


class DailyGoalObserver(NutritionObserver):
    """
    Pattern: Observer (Behavioral) - Concrete Observer
    Monitors and reports daily nutrition goal achievements
    """
    
    async def update(self, event_type: str, data: Dict):
        if event_type == "meal_logged":
            daily_summary = data.get("daily_summary")
            goals = data.get("goals", {})
            
            if goals.get("daily_calorie_goal"):
                if daily_summary["total_calories"] >= goals["daily_calorie_goal"]:
                    print(f"🎯 Daily calorie goal reached: {daily_summary['total_calories']}/{goals['daily_calorie_goal']}")
            
            if goals.get("daily_protein_goal"):
                if daily_summary["total_protein_g"] >= goals["daily_protein_goal"]:
                    print(f"💪 Daily protein goal reached: {daily_summary['total_protein_g']}g/{goals['daily_protein_goal']}g")


class NotificationObserver(NutritionObserver):
    """
    Pattern: Observer (Behavioral) - Concrete Observer
    Logs nutrition events for notification system
    """
    
    async def update(self, event_type: str, data: Dict):
        if event_type == "meal_logged":
            meal = data.get("meal")
            print(f"📊 Meal logged: {meal['dish_name']} - {meal['nutrition']['calories']} calories")


class NutritionTrackingService:
    """
    Pattern: Observer (Behavioral) - Subject
    Maintains list of observers and notifies them of nutrition events
    """
    
    def __init__(self, db: DatabaseManager):
        self.db = db
        self.observers: List[NutritionObserver] = []
        self.attach(DailyGoalObserver())
        self.attach(NotificationObserver())
    
    def attach(self, observer: NutritionObserver):
        """Attach observer to subject"""
        self.observers.append(observer)
    
    def detach(self, observer: NutritionObserver):
        """Detach observer from subject"""
        self.observers.remove(observer)
    
    async def notify(self, event_type: str, data: Dict):
        """Notify all observers of event"""
        for observer in self.observers:
            await observer.update(event_type, data)
    
    async def log_meal(
        self,
        user_id: str,
        dish_name: str,
        nutrition: NutritionInfo,
        meal_type: Optional[str] = None,
        image_url: Optional[str] = None,
        confidence_score: Optional[float] = None
    ) -> ScannedDishEntry:
        """Log meal and notify observers"""
        result = self.db.client.table("scanned_dishes").insert({
            "user_id": user_id,
            "dish_name": dish_name,
            "nutrition": nutrition.model_dump(),
            "meal_type": meal_type,
            "image_url": image_url,
            "confidence_score": confidence_score
        }).execute()
        
        log_entry = self._map_to_dish_entry(result.data[0])
        daily_summary = await self.get_daily_summary(user_id, date.today())
        user_goals = await self._get_user_goals(user_id)
        
        await self.notify("meal_logged", {
            "meal": log_entry.model_dump(),
            "daily_summary": daily_summary.model_dump(),
            "goals": user_goals
        })
        
        return log_entry
    
    async def get_daily_summary(self, user_id: str, target_date: date) -> DailyNutritionSummary:
        """Get nutrition summary for specific day"""
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
        
        result = self.db.admin_client.table("scanned_dishes").select("*").eq("user_id", user_id).gte(
            "scanned_at", start_of_day.isoformat()
        ).lte("scanned_at", end_of_day.isoformat()).execute()
        
        meals = [self._map_to_dish_entry(log) for log in result.data]
        
        total_calories = sum(meal.nutrition.calories for meal in meals)
        total_protein = sum(meal.nutrition.protein_g for meal in meals)
        total_carbs = sum(meal.nutrition.carbs_g for meal in meals)
        total_fat = sum(meal.nutrition.fat_g for meal in meals)
        total_fiber = sum(meal.nutrition.fiber_g or 0 for meal in meals)
        total_sugar = sum(meal.nutrition.sugar_g or 0 for meal in meals)
        
        return DailyNutritionSummary(
            date=target_date.isoformat(),
            total_calories=total_calories,
            total_protein_g=total_protein,
            total_carbs_g=total_carbs,
            total_fat_g=total_fat,
            total_fiber_g=total_fiber,
            total_sugar_g=total_sugar,
            meals=meals
        )
    
    async def _get_user_goals(self, user_id: str) -> Dict:
        """Fetch user nutrition goals"""
        try:
            result = self.db.client.table("users").select("*").eq("id", user_id).single().execute()
            return result.data if result.data else {}
        except Exception:
            return {}
    
    def _map_to_dish_entry(self, data: Dict) -> ScannedDishEntry:
        """Map database row to ScannedDishEntry"""
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


def get_nutrition_service(db: DatabaseManager) -> NutritionTrackingService:
    """
    Pattern: Factory (Creational)
    Creates nutrition tracking service with dependencies
    """
    return NutritionTrackingService(db)
