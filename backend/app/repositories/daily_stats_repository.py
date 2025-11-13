"""
Daily Nutrition Statistics Repository
Handles database operations for pre-aggregated daily stats
"""
from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID

from app.database import DatabaseManager


class DailyStatsRepository:
    """Repository for daily nutrition statistics operations"""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    async def get_daily_stats(self, user_id: UUID, target_date: date) -> Optional[dict]:
        """
        Get daily nutrition statistics for a specific date
        
        Args:
            user_id: User UUID
            target_date: Date to retrieve stats for
            
        Returns:
            Daily stats dictionary or None if not found
        """
        response = (
            self.db.admin_client.table("daily_nutrition_stats")
            .select("*")
            .eq("user_id", str(user_id))
            .eq("date", str(target_date))
            .execute()
        )
        
        return response.data[0] if response.data else None
    
    async def get_weekly_stats(self, user_id: UUID, days: int = 7) -> List[dict]:
        """
        Get daily nutrition statistics for the last N days
        
        Args:
            user_id: User UUID
            days: Number of days to retrieve (default: 7)
            
        Returns:
            List of daily stats dictionaries
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=days - 1)
        
        response = (
            self.db.admin_client.table("daily_nutrition_stats")
            .select("*")
            .eq("user_id", str(user_id))
            .gte("date", str(start_date))
            .lte("date", str(end_date))
            .order("date", desc=False)
            .execute()
        )
        
        # Fill in missing dates with zero values
        stats_dict = {row['date']: row for row in response.data}
        complete_stats = []
        
        current_date = start_date
        while current_date <= end_date:
            date_str = str(current_date)
            if date_str in stats_dict:
                complete_stats.append(stats_dict[date_str])
            else:
                # Create zero-value entry for missing dates
                complete_stats.append({
                    'date': date_str,
                    'total_calories': 0,
                    'total_protein_g': 0,
                    'total_carbs_g': 0,
                    'total_fat_g': 0,
                    'total_fiber_g': 0,
                    'total_sugar_g': 0,
                    'total_sodium_mg': 0,
                    'meal_count': 0
                })
            current_date += timedelta(days=1)
        
        return complete_stats
    
    async def get_date_range_stats(
        self, 
        user_id: UUID, 
        start_date: date, 
        end_date: date
    ) -> List[dict]:
        """
        Get daily nutrition statistics for a specific date range
        
        Args:
            user_id: User UUID
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
            
        Returns:
            List of daily stats dictionaries
        """
        response = (
            self.db.admin_client.table("daily_nutrition_stats")
            .select("*")
            .eq("user_id", str(user_id))
            .gte("date", str(start_date))
            .lte("date", str(end_date))
            .order("date", desc=False)
            .execute()
        )
        
        return response.data
    
    async def recalculate_daily_stats(self, user_id: UUID, target_date: date) -> dict:
        """
        Manually recalculate daily stats for a specific date
        Useful for fixing inconsistencies or backfilling data
        
        Args:
            user_id: User UUID
            target_date: Date to recalculate
            
        Returns:
            Updated daily stats dictionary
        """
        # First, get all scanned dishes for this date
        response = (
            self.db.admin_client.table("scanned_dishes")
            .select("nutrition")
            .eq("user_id", str(user_id))
            .gte("scanned_at", f"{target_date}T00:00:00")
            .lt("scanned_at", f"{target_date}T23:59:59")
            .execute()
        )
        
        # Calculate totals
        total_calories = 0
        total_protein_g = 0
        total_carbs_g = 0
        total_fat_g = 0
        total_fiber_g = 0
        total_sugar_g = 0
        total_sodium_mg = 0
        meal_count = len(response.data)
        
        for dish in response.data:
            nutrition = dish.get('nutrition', {})
            total_calories += float(nutrition.get('calories', 0))
            total_protein_g += float(nutrition.get('protein_g', 0))
            total_carbs_g += float(nutrition.get('carbs_g', 0))
            total_fat_g += float(nutrition.get('fat_g', 0))
            total_fiber_g += float(nutrition.get('fiber_g', 0))
            total_sugar_g += float(nutrition.get('sugar_g', 0))
            total_sodium_mg += float(nutrition.get('sodium_mg', 0))
        
        # Upsert into daily_nutrition_stats
        stats_data = {
            'user_id': str(user_id),
            'date': str(target_date),
            'total_calories': total_calories,
            'total_protein_g': total_protein_g,
            'total_carbs_g': total_carbs_g,
            'total_fat_g': total_fat_g,
            'total_fiber_g': total_fiber_g,
            'total_sugar_g': total_sugar_g,
            'total_sodium_mg': total_sodium_mg,
            'meal_count': meal_count,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = (
            self.db.admin_client.table("daily_nutrition_stats")
            .upsert(stats_data, on_conflict="user_id,date")
            .execute()
        )
        
        return result.data[0] if result.data else None
