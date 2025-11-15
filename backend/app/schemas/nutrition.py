from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl
from app.schemas.recipe import NutritionInfo


class AnalyzeDishRequest(BaseModel):
    image_url: HttpUrl
    meal_type: Optional[str] = None


class DishAnalysisResponse(BaseModel):
    dish_name: str
    portion_size: Optional[str] = None  # e.g., "200g", "1 serving", "2 cups"
    nutrition: NutritionInfo
    confidence_score: float = Field(..., ge=0, le=1)
    ingredients_detected: list[str] = Field(default=[])


class ScannedDishEntry(BaseModel):
    id: str
    user_id: str
    dish_name: str
    nutrition: NutritionInfo
    meal_type: Optional[str]
    image_url: Optional[str]
    confidence_score: Optional[float]
    scanned_at: datetime


class DailyNutritionSummary(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    total_fiber_g: float
    total_sugar_g: float
    meals: list[ScannedDishEntry]


class LogScannedDishRequest(BaseModel):
    dish_name: str = Field(..., min_length=1)
    nutrition: NutritionInfo
    meal_type: Optional[str] = None
    image_url: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
