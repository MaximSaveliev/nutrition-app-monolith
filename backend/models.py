"""
Data models for the application
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DietaryRestriction(str, Enum):
    """Dietary restriction types"""
    VEGAN = "vegan"
    VEGETARIAN = "vegetarian"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    KETO = "keto"
    PALEO = "paleo"
    HALAL = "halal"
    KOSHER = "kosher"
    LOW_CARB = "low_carb"
    LOW_FAT = "low_fat"


class NutritionInfo(BaseModel):
    """Nutrition information model"""
    calories: float
    protein: float
    carbohydrates: float
    fat: float
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "calories": 450.0,
                "protein": 25.0,
                "carbohydrates": 50.0,
                "fat": 15.0,
                "fiber": 5.0,
                "sugar": 8.0,
                "sodium": 600.0
            }
        }


class RecipeStep(BaseModel):
    """Individual recipe step"""
    step_number: int
    instruction: str
    duration_minutes: Optional[int] = None
    image_url: Optional[str] = None


class Recipe(BaseModel):
    """Recipe model"""
    id: Optional[str] = None
    title: str
    description: str
    ingredients: List[str]
    steps: List[RecipeStep]
    nutrition_info: NutritionInfo
    dietary_restrictions: List[DietaryRestriction] = []
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int
    difficulty: str = "medium"
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Grilled Chicken Salad",
                "description": "Healthy grilled chicken with fresh vegetables",
                "ingredients": ["chicken breast", "lettuce", "tomatoes"],
                "steps": [
                    {"step_number": 1, "instruction": "Grill the chicken", "duration_minutes": 15}
                ],
                "nutrition_info": {
                    "calories": 350,
                    "protein": 30,
                    "carbohydrates": 20,
                    "fat": 12
                },
                "dietary_restrictions": ["gluten_free"],
                "prep_time_minutes": 15,
                "cook_time_minutes": 20,
                "servings": 2,
                "difficulty": "easy"
            }
        }


class DishAnalysisRequest(BaseModel):
    """Request model for dish image analysis"""
    image_data: str = Field(..., description="Base64 encoded image data")
    dietary_restrictions: List[DietaryRestriction] = []


class DishAnalysisResponse(BaseModel):
    """Response model for dish analysis"""
    dish_name: str
    nutrition_info: NutritionInfo
    ingredients_detected: List[str]
    confidence_score: float
    warnings: List[str] = []


class RecipeGenerationRequest(BaseModel):
    """Request model for recipe generation from ingredients"""
    image_data: Optional[str] = Field(None, description="Base64 encoded image of ingredients")
    ingredients: Optional[List[str]] = None
    dietary_restrictions: List[DietaryRestriction] = []
    preferred_cuisine: Optional[str] = None
    cooking_time_max: Optional[int] = None


class RecipeGenerationResponse(BaseModel):
    """Response model for recipe generation"""
    recipe: Recipe
    alternative_recipes: List[Recipe] = []
    
    
class UserPreferences(BaseModel):
    """User dietary preferences model"""
    user_id: str
    dietary_restrictions: List[DietaryRestriction] = []
    allergies: List[str] = []
    disliked_ingredients: List[str] = []
    preferred_cuisines: List[str] = []
