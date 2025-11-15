"""
Daily Nutrition Statistics Schemas
Pre-aggregated daily nutrition data for fast querying
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DailyNutritionStatsBase(BaseModel):
    """Base schema for daily nutrition statistics"""
    date: date
    total_calories: Decimal = Field(default=0, ge=0)
    total_protein_g: Decimal = Field(default=0, ge=0)
    total_carbs_g: Decimal = Field(default=0, ge=0)
    total_fat_g: Decimal = Field(default=0, ge=0)
    total_fiber_g: Optional[Decimal] = Field(default=0, ge=0)
    total_sugar_g: Optional[Decimal] = Field(default=0, ge=0)
    total_sodium_mg: Optional[Decimal] = Field(default=0, ge=0)
    meal_count: int = Field(default=0, ge=0)


class DailyNutritionStatsResponse(DailyNutritionStatsBase):
    """Response schema for daily nutrition statistics"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WeeklyStatsResponse(BaseModel):
    """Response schema for weekly statistics"""
    stats: list[DailyNutritionStatsResponse]
    start_date: date
    end_date: date
    total_days: int
