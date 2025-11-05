"""
Adapter Pattern: Groq API Adapter
Adapts the Groq API interface to our application's needs
"""
from patterns.factory import AIProvider
from models import NutritionInfo, Recipe, RecipeStep, DietaryRestriction
from typing import List, Dict, Any, Optional
import json
import re


class GroqAPIAdapter:
    """
    Adapter Pattern: Adapts Groq AI responses to application models
    Converts raw AI responses into structured application data
    """
    
    def __init__(self, ai_provider: AIProvider):
        self.ai_provider = ai_provider
    
    def analyze_dish_nutrition(self, image_data: str, 
                               dietary_restrictions: List[DietaryRestriction] = []) -> Dict[str, Any]:
        """
        Adapt dish image analysis to return structured nutrition data
        """
        restrictions_text = ", ".join([r.value for r in dietary_restrictions]) if dietary_restrictions else "none"
        
        prompt = f"""Analyze this dish image and provide detailed nutritional information.
Consider dietary restrictions: {restrictions_text}

Return your response in JSON format with the following structure:
{{
    "dish_name": "name of the dish",
    "nutrition_info": {{
        "calories": number,
        "protein": number (grams),
        "carbohydrates": number (grams),
        "fat": number (grams),
        "fiber": number (grams),
        "sugar": number (grams),
        "sodium": number (mg)
    }},
    "ingredients_detected": ["ingredient1", "ingredient2"],
    "confidence_score": number (0-1),
    "warnings": ["warning if dietary restrictions violated"]
}}

Be accurate with nutritional estimates based on visible portions."""
        
        try:
            response = self.ai_provider.analyze_image(image_data, prompt)
            
            # If response is already a dict, use it; otherwise parse from raw_response
            if "raw_response" in response:
                # Extract JSON from raw response
                json_match = re.search(r'\{.*\}', response["raw_response"], re.DOTALL)
                if json_match:
                    response = json.loads(json_match.group())
            
            # Validate and structure the response
            return {
                "dish_name": response.get("dish_name", "Unknown Dish"),
                "nutrition_info": NutritionInfo(**response.get("nutrition_info", {
                    "calories": 0, "protein": 0, "carbohydrates": 0, "fat": 0
                })),
                "ingredients_detected": response.get("ingredients_detected", []),
                "confidence_score": response.get("confidence_score", 0.5),
                "warnings": response.get("warnings", [])
            }
        except Exception as e:
            raise Exception(f"Error adapting dish nutrition analysis: {str(e)}")
    
    def generate_recipe_from_ingredients(
        self, 
        ingredients: List[str],
        dietary_restrictions: List[DietaryRestriction] = [],
        preferred_cuisine: Optional[str] = None,
        cooking_time_max: Optional[int] = None
    ) -> Recipe:
        """
        Adapt recipe generation to return structured Recipe object
        """
        restrictions_text = ", ".join([r.value for r in dietary_restrictions]) if dietary_restrictions else "none"
        cuisine_text = preferred_cuisine or "any cuisine"
        time_text = f"maximum {cooking_time_max} minutes" if cooking_time_max else "any cooking time"
        
        prompt = f"""Create a detailed recipe using these ingredients: {', '.join(ingredients)}

Requirements:
- Dietary restrictions: {restrictions_text}
- Preferred cuisine: {cuisine_text}
- Cooking time: {time_text}

Return your response in JSON format:
{{
    "title": "Recipe Name",
    "description": "Brief description",
    "ingredients": ["ingredient with amount", "ingredient with amount"],
    "steps": [
        {{"step_number": 1, "instruction": "detailed instruction", "duration_minutes": 10}},
        {{"step_number": 2, "instruction": "detailed instruction", "duration_minutes": 15}}
    ],
    "nutrition_info": {{
        "calories": number,
        "protein": number,
        "carbohydrates": number,
        "fat": number,
        "fiber": number,
        "sugar": number,
        "sodium": number
    }},
    "dietary_restrictions": ["{restrictions_text}"],
    "prep_time_minutes": number,
    "cook_time_minutes": number,
    "servings": number,
    "difficulty": "easy/medium/hard"
}}

Provide clear, step-by-step cooking instructions."""
        
        try:
            response_text = self.ai_provider.generate_text(
                prompt,
                context="You are an expert chef and nutritionist. Provide accurate, safe cooking instructions."
            )
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not json_match:
                raise ValueError("No JSON found in response")
            
            recipe_data = json.loads(json_match.group())
            
            # Convert to Recipe model
            steps = [RecipeStep(**step) for step in recipe_data.get("steps", [])]
            nutrition_info = NutritionInfo(**recipe_data.get("nutrition_info", {}))
            
            # Parse dietary restrictions
            diet_restrictions = []
            for restriction in recipe_data.get("dietary_restrictions", []):
                try:
                    diet_restrictions.append(DietaryRestriction(restriction))
                except ValueError:
                    pass
            
            return Recipe(
                title=recipe_data.get("title", "Generated Recipe"),
                description=recipe_data.get("description", ""),
                ingredients=recipe_data.get("ingredients", ingredients),
                steps=steps,
                nutrition_info=nutrition_info,
                dietary_restrictions=diet_restrictions,
                prep_time_minutes=recipe_data.get("prep_time_minutes", 15),
                cook_time_minutes=recipe_data.get("cook_time_minutes", 30),
                servings=recipe_data.get("servings", 2),
                difficulty=recipe_data.get("difficulty", "medium")
            )
        except Exception as e:
            raise Exception(f"Error adapting recipe generation: {str(e)}")
