"""
Builder Pattern: Recipe Builder
Constructs complex Recipe objects step by step
"""
from models import Recipe, RecipeStep, NutritionInfo, DietaryRestriction
from typing import List, Optional
from datetime import datetime


class RecipeBuilder:
    """
    Builder Pattern: Constructs Recipe objects with a fluent interface
    Allows step-by-step construction of complex Recipe objects
    """
    
    def __init__(self):
        self._title: Optional[str] = None
        self._description: Optional[str] = None
        self._ingredients: List[str] = []
        self._steps: List[RecipeStep] = []
        self._nutrition_info: Optional[NutritionInfo] = None
        self._dietary_restrictions: List[DietaryRestriction] = []
        self._prep_time_minutes: int = 0
        self._cook_time_minutes: int = 0
        self._servings: int = 1
        self._difficulty: str = "medium"
        self._image_url: Optional[str] = None
    
    def set_title(self, title: str) -> 'RecipeBuilder':
        """Set recipe title"""
        self._title = title
        return self
    
    def set_description(self, description: str) -> 'RecipeBuilder':
        """Set recipe description"""
        self._description = description
        return self
    
    def add_ingredient(self, ingredient: str) -> 'RecipeBuilder':
        """Add a single ingredient"""
        self._ingredients.append(ingredient)
        return self
    
    def set_ingredients(self, ingredients: List[str]) -> 'RecipeBuilder':
        """Set all ingredients at once"""
        self._ingredients = ingredients
        return self
    
    def add_step(self, step_number: int, instruction: str, 
                 duration_minutes: Optional[int] = None) -> 'RecipeBuilder':
        """Add a cooking step"""
        step = RecipeStep(
            step_number=step_number,
            instruction=instruction,
            duration_minutes=duration_minutes
        )
        self._steps.append(step)
        return self
    
    def set_steps(self, steps: List[RecipeStep]) -> 'RecipeBuilder':
        """Set all steps at once"""
        self._steps = steps
        return self
    
    def set_nutrition_info(self, calories: float, protein: float, 
                          carbohydrates: float, fat: float,
                          fiber: Optional[float] = None,
                          sugar: Optional[float] = None,
                          sodium: Optional[float] = None) -> 'RecipeBuilder':
        """Set nutrition information"""
        self._nutrition_info = NutritionInfo(
            calories=calories,
            protein=protein,
            carbohydrates=carbohydrates,
            fat=fat,
            fiber=fiber,
            sugar=sugar,
            sodium=sodium
        )
        return self
    
    def add_dietary_restriction(self, restriction: DietaryRestriction) -> 'RecipeBuilder':
        """Add a dietary restriction"""
        if restriction not in self._dietary_restrictions:
            self._dietary_restrictions.append(restriction)
        return self
    
    def set_dietary_restrictions(self, restrictions: List[DietaryRestriction]) -> 'RecipeBuilder':
        """Set all dietary restrictions"""
        self._dietary_restrictions = restrictions
        return self
    
    def set_prep_time(self, minutes: int) -> 'RecipeBuilder':
        """Set preparation time"""
        self._prep_time_minutes = minutes
        return self
    
    def set_cook_time(self, minutes: int) -> 'RecipeBuilder':
        """Set cooking time"""
        self._cook_time_minutes = minutes
        return self
    
    def set_servings(self, servings: int) -> 'RecipeBuilder':
        """Set number of servings"""
        self._servings = servings
        return self
    
    def set_difficulty(self, difficulty: str) -> 'RecipeBuilder':
        """Set difficulty level"""
        self._difficulty = difficulty
        return self
    
    def set_image_url(self, url: str) -> 'RecipeBuilder':
        """Set image URL"""
        self._image_url = url
        return self
    
    def build(self) -> Recipe:
        """
        Build and return the Recipe object
        Validates that all required fields are set
        """
        if not self._title:
            raise ValueError("Recipe title is required")
        if not self._description:
            raise ValueError("Recipe description is required")
        if not self._ingredients:
            raise ValueError("Recipe must have at least one ingredient")
        if not self._steps:
            raise ValueError("Recipe must have at least one step")
        if not self._nutrition_info:
            raise ValueError("Nutrition information is required")
        
        return Recipe(
            title=self._title,
            description=self._description,
            ingredients=self._ingredients,
            steps=self._steps,
            nutrition_info=self._nutrition_info,
            dietary_restrictions=self._dietary_restrictions,
            prep_time_minutes=self._prep_time_minutes,
            cook_time_minutes=self._cook_time_minutes,
            servings=self._servings,
            difficulty=self._difficulty,
            image_url=self._image_url,
            created_at=datetime.utcnow()
        )
    
    def reset(self) -> 'RecipeBuilder':
        """Reset the builder to create a new recipe"""
        self.__init__()
        return self
