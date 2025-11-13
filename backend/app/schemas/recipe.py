from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class DietaryRestriction(str, Enum):
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    KETO = "keto"
    PALEO = "paleo"
    LOW_CARB = "low_carb"
    HALAL = "halal"
    KOSHER = "kosher"
    NUT_FREE = "nut_free"


class IngredientItem(BaseModel):
    name: str
    quantity: str
    optional: bool = False


class RecipeStep(BaseModel):
    step_number: int
    instruction: str
    duration_minutes: Optional[int] = None


class NutritionInfo(BaseModel):
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None
    # Additional macros
    cholesterol_mg: Optional[float] = None
    potassium_mg: Optional[float] = None
    # Vitamins
    vitamin_a_mcg: Optional[float] = None
    vitamin_c_mg: Optional[float] = None
    vitamin_d_mcg: Optional[float] = None
    vitamin_e_mg: Optional[float] = None
    vitamin_k_mcg: Optional[float] = None
    vitamin_b6_mg: Optional[float] = None
    vitamin_b12_mcg: Optional[float] = None
    folate_mcg: Optional[float] = None
    # Minerals
    calcium_mg: Optional[float] = None
    iron_mg: Optional[float] = None
    magnesium_mg: Optional[float] = None
    zinc_mg: Optional[float] = None
    selenium_mcg: Optional[float] = None
    # Legacy field for backward compatibility
    vitamins: Optional[dict] = None


class RecipeCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    ingredients: List[IngredientItem] = Field(..., min_items=1)
    steps: List[RecipeStep] = Field(..., min_items=1)
    cuisine_type: Optional[str] = None
    dietary_restrictions: List[DietaryRestriction] = Field(default=[])
    spice_level: Optional[str] = None
    difficulty: DifficultyLevel
    prep_time_minutes: int = Field(..., gt=0)
    cook_time_minutes: Optional[int] = Field(None, ge=0)  # Optional, user can specify if needed
    servings: int = Field(..., gt=0)
    nutrition: NutritionInfo
    is_public: bool = Field(default=False)
    image_url: Optional[str] = None


class RecipeResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    author_id: str
    author_email: Optional[str] = None
    author_nickname: Optional[str] = None
    ingredients: List[IngredientItem]
    steps: List[RecipeStep]
    cuisine_type: Optional[str]
    dietary_restrictions: List[DietaryRestriction]
    spice_level: Optional[str]
    difficulty: DifficultyLevel
    prep_time_minutes: int
    cook_time_minutes: int
    cooking_time_minutes: int  # Alias for total_time for frontend compatibility
    total_time_minutes: int
    servings: int
    nutrition: NutritionInfo
    calories_per_serving: Optional[float] = None  # Computed field for frontend
    protein_per_serving: Optional[float] = None
    carbs_per_serving: Optional[float] = None
    fat_per_serving: Optional[float] = None
    is_public: bool
    image_url: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class RecipeFilterRequest(BaseModel):
    cuisine_type: Optional[str] = None
    dietary_restrictions: Optional[List[DietaryRestriction]] = None
    difficulty: Optional[DifficultyLevel] = None
    max_prep_time: Optional[int] = None
    spice_level: Optional[str] = None
    is_public: bool = Field(default=True)
    search_query: Optional[str] = None


class GenerateRecipeRequest(BaseModel):
    ingredients_text: str = Field(..., min_length=3)
    cuisine_preference: Optional[str] = None
    dietary_restrictions: Optional[List[DietaryRestriction]] = None
    spice_level: Optional[str] = None
    servings: int = Field(default=4, gt=0)


class UnifiedRecipeRequest(BaseModel):
    """
    Unified request that accepts either text OR image for recipe generation.
    Strategy Pattern: Routes to appropriate AI strategy based on input type.
    """
    ingredients_text: Optional[str] = Field(None, min_length=3)
    image_base64: Optional[str] = None
    cuisine_preference: Optional[str] = None
    dietary_restrictions: Optional[List[DietaryRestriction]] = None
    spice_level: Optional[str] = None
    servings: int = Field(default=4, gt=0)
    cook_time_minutes: Optional[int] = Field(None, ge=0)  # User can optionally specify desired cook time
