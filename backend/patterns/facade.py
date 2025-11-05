"""
Facade Pattern: Nutrition Analysis Facade
Provides a simplified interface for complex nutrition analysis operations
"""
from patterns.factory import AIProviderFactory
from patterns.adapter import GroqAPIAdapter
from patterns.decorator import cache_result, log_execution
from patterns.builder import RecipeBuilder
from models import (
    DishAnalysisResponse, RecipeGenerationResponse, 
    DietaryRestriction, Recipe, NutritionInfo
)
from typing import List, Optional
from database import db_connection


class NutritionAnalysisFacade:
    """
    Facade Pattern: Simplifies complex nutrition analysis operations
    Provides a unified interface for dish analysis and recipe generation
    """
    
    def __init__(self):
        """Initialize the facade with necessary components"""
        self.ai_provider = AIProviderFactory.create_provider("groq")
        self.groq_adapter = GroqAPIAdapter(self.ai_provider)
        self.supabase = db_connection.get_supabase_client()
    
    @log_execution(log_args=False, log_result=False)
    @cache_result(ttl=1800, prefix="dish_analysis")
    def analyze_dish(
        self, 
        image_data: str, 
        dietary_restrictions: List[DietaryRestriction] = []
    ) -> DishAnalysisResponse:
        """
        Analyze a dish image and return nutrition information
        
        This method orchestrates multiple operations:
        1. Image analysis via AI
        2. Nutrition calculation
        3. Dietary restriction validation
        4. Result formatting
        """
        try:
            # Use adapter to analyze dish
            analysis_result = self.groq_adapter.analyze_dish_nutrition(
                image_data, 
                dietary_restrictions
            )
            
            # Create response object
            response = DishAnalysisResponse(
                dish_name=analysis_result["dish_name"],
                nutrition_info=analysis_result["nutrition_info"],
                ingredients_detected=analysis_result["ingredients_detected"],
                confidence_score=analysis_result["confidence_score"],
                warnings=analysis_result["warnings"]
            )
            
            # Save to database for history (optional)
            self._save_dish_analysis(response)
            
            return response
            
        except Exception as e:
            raise Exception(f"Error in dish analysis facade: {str(e)}")
    
    @log_execution(log_args=False, log_result=False)
    @cache_result(ttl=3600, prefix="recipe_generation")
    def generate_recipe(
        self,
        ingredients: List[str],
        dietary_restrictions: List[DietaryRestriction] = [],
        preferred_cuisine: Optional[str] = None,
        cooking_time_max: Optional[int] = None
    ) -> RecipeGenerationResponse:
        """
        Generate a recipe from ingredients
        
        This method orchestrates:
        1. Recipe generation via AI
        2. Recipe validation
        3. Alternative recipe suggestions
        4. Database storage
        """
        try:
            # Generate main recipe
            main_recipe = self.groq_adapter.generate_recipe_from_ingredients(
                ingredients=ingredients,
                dietary_restrictions=dietary_restrictions,
                preferred_cuisine=preferred_cuisine,
                cooking_time_max=cooking_time_max
            )
            
            # Save recipe to database
            saved_recipe = self._save_recipe(main_recipe)
            
            # Generate alternative recipes (simplified - in production, you'd generate these)
            alternative_recipes = []
            
            return RecipeGenerationResponse(
                recipe=saved_recipe,
                alternative_recipes=alternative_recipes
            )
            
        except Exception as e:
            raise Exception(f"Error in recipe generation facade: {str(e)}")
    
    @log_execution(log_args=False, log_result=False)
    def analyze_ingredients_image(
        self,
        image_data: str,
        dietary_restrictions: List[DietaryRestriction] = [],
        preferred_cuisine: Optional[str] = None,
        cooking_time_max: Optional[int] = None
    ) -> RecipeGenerationResponse:
        """
        Analyze ingredients from image and generate recipe
        
        Combines image analysis with recipe generation
        """
        try:
            # First, detect ingredients from image
            prompt = """Identify all visible ingredients in this image.
Return a JSON list of ingredients: ["ingredient1", "ingredient2", ...]
Be specific with quantities if visible."""
            
            response = self.ai_provider.analyze_image(image_data, prompt)
            
            # Extract ingredients
            if "raw_response" in response:
                import json
                import re
                json_match = re.search(r'\[.*\]', response["raw_response"], re.DOTALL)
                if json_match:
                    ingredients = json.loads(json_match.group())
                else:
                    ingredients = []
            else:
                ingredients = response.get("ingredients", [])
            
            if not ingredients:
                raise ValueError("No ingredients detected in image")
            
            # Generate recipe using detected ingredients
            return self.generate_recipe(
                ingredients=ingredients,
                dietary_restrictions=dietary_restrictions,
                preferred_cuisine=preferred_cuisine,
                cooking_time_max=cooking_time_max
            )
            
        except Exception as e:
            raise Exception(f"Error in ingredients image analysis: {str(e)}")
    
    def _save_dish_analysis(self, analysis: DishAnalysisResponse) -> None:
        """Save dish analysis to database"""
        try:
            data = {
                "dish_name": analysis.dish_name,
                "nutrition_info": analysis.nutrition_info.model_dump(),
                "ingredients_detected": analysis.ingredients_detected,
                "confidence_score": analysis.confidence_score,
                "warnings": analysis.warnings
            }
            self.supabase.table("dish_analyses").insert(data).execute()
        except Exception as e:
            print(f"Error saving dish analysis: {str(e)}")
    
    def _save_recipe(self, recipe: Recipe) -> Recipe:
        """Save recipe to database and return with ID"""
        try:
            recipe_dict = recipe.model_dump()
            recipe_dict['nutrition_info'] = recipe.nutrition_info.model_dump()
            recipe_dict['steps'] = [step.model_dump() for step in recipe.steps]
            recipe_dict['dietary_restrictions'] = [dr.value for dr in recipe.dietary_restrictions]
            
            result = self.supabase.table("recipes").insert(recipe_dict).execute()
            
            if result.data:
                recipe.id = result.data[0].get('id')
            
            return recipe
        except Exception as e:
            print(f"Error saving recipe: {str(e)}")
            return recipe
