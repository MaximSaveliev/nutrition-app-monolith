"""
Pattern: Strategy (Behavioral)
Defines family of AI algorithms, encapsulates each one, makes them interchangeable
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import json
from groq import Groq
from app.config import get_settings


class AIStrategy(ABC):
    """
    Pattern: Strategy (Behavioral)
    Abstract interface for different AI analysis strategies
    """
    
    @abstractmethod
    async def execute(self, **kwargs) -> Dict:
        """Execute the AI strategy with given parameters"""
        pass


class NutritionAnalysisStrategy(AIStrategy):
    """
    Pattern: Strategy (Behavioral) - Concrete Strategy
    Analyzes food images and returns detailed nutrition information
    """
    
    def __init__(self, groq_client: Groq):
        self.client = groq_client
        self.vision_model = "meta-llama/llama-4-maverick-17b-128e-instruct"
    
    async def execute(self, image_base64: str) -> Dict:
        """
        Analyzes food image and returns nutrition data
        Args:
            image_base64: Base64-encoded image with data URI prefix (data:image/jpeg;base64,...)
        """
        prompt = """Analyze this food image and provide detailed nutrition information.

You MUST return a JSON object with these 5 required fields:
1. dish_name (string) - name of the dish
2. portion_size (string) - estimated weight/portion (e.g., "200g", "150g", "1 serving", "300g")
3. nutrition (object with ALL these numeric fields)
4. confidence_score (number 0-1)
5. ingredients_detected (array of strings)

EXACT JSON structure required:
{
  "dish_name": "Name of the dish",
  "portion_size": "200g",
  "nutrition": {
    "calories": 450,
    "protein_g": 35,
    "carbs_g": 45,
    "fat_g": 12,
    "fiber_g": 5,
    "sugar_g": 3,
    "sodium_mg": 600,
    "cholesterol_mg": 75,
    "potassium_mg": 400,
    "vitamin_a_mcg": 800,
    "vitamin_c_mg": 15,
    "vitamin_d_mcg": 2,
    "vitamin_e_mg": 8,
    "vitamin_k_mcg": 90,
    "vitamin_b6_mg": 1.5,
    "vitamin_b12_mcg": 2.4,
    "folate_mcg": 400,
    "calcium_mg": 1000,
    "iron_mg": 18,
    "magnesium_mg": 400,
    "zinc_mg": 11,
    "selenium_mcg": 55
  },
  "confidence_score": 0.85,
  "ingredients_detected": ["ingredient1", "ingredient2", "ingredient3"]
}

CRITICAL RULES:
- Estimate portion_size based on visual cues in the image (plate size, food volume, etc.)
- Use metric measurements (grams) when possible: "150g", "250g", "400g"
- The "nutrition" field MUST be a flat object (not nested)
- ALL 5 top-level fields are REQUIRED
- All nutrition values must be numbers, not strings
- Do NOT use nested objects like "Basic", "Vitamins", "Minerals"
- Return ONLY the JSON object, no markdown, no explanatory text"""

        response = self.client.chat.completions.create(
            model=self.vision_model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_base64}}
                ]
            }],
            temperature=0.3,
            max_tokens=1000
        )
        
        result = response.choices[0].message.content.strip()
        
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
            result = result.strip()
        
        return json.loads(result)


class RecipeGenerationStrategy(AIStrategy):
    """
    Pattern: Strategy (Behavioral) - Concrete Strategy
    Generates recipes from plain text ingredient descriptions
    """
    
    def __init__(self, groq_client: Groq):
        self.client = groq_client
        self.text_model = "llama-3.3-70b-versatile"
    
    async def execute(
        self,
        ingredients_text: str,
        cuisine: Optional[str] = None,
        dietary_restrictions: Optional[List[str]] = None,
        spice_level: Optional[str] = None,
        servings: int = 4,
        cook_time_minutes: Optional[int] = None
    ) -> Dict:
        dietary_text = f"Dietary restrictions: {', '.join(dietary_restrictions)}" if dietary_restrictions else ""
        cuisine_text = f"Cuisine: {cuisine}" if cuisine else ""
        preferences_text = f"Preferences: {spice_level}" if spice_level else ""
        cook_time_text = f"- Maximum cook time: {cook_time_minutes} minutes" if cook_time_minutes is not None else ""
        
        prompt = f"""Create a detailed recipe using these ingredients: {ingredients_text}

Requirements:
- Servings: {servings}
{preferences_text}
{cuisine_text}
{dietary_text}
{cook_time_text}

IMPORTANT INSTRUCTIONS:
- You can use SOME or ALL of the provided ingredients - it's not required to use everything
- Feel free to add other common ingredients (salt, pepper, oil, etc.) as needed
- The preferences can be ANYTHING: "romantic dinner", "baby food", "school lunch", "spicy", "mild", "comfort food", etc.
- If cuisine is not specified, create a recipe that fits the ingredients naturally
{"- IMPORTANT: The cook_time_minutes must not exceed " + str(cook_time_minutes) + " minutes" if cook_time_minutes is not None else ""}

Parse the ingredients from the text and determine appropriate quantities.

For dietary_restrictions, use ONLY these exact values with underscores:
- vegetarian, vegan, gluten_free, dairy_free, keto, paleo, low_carb, halal, kosher, nut_free

Provide a JSON response with this EXACT structure:
{{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": [
    {{"name": "ingredient", "quantity": "2 cups", "optional": false}}
  ],
  "steps": [
    {{"step_number": 1, "instruction": "...", "duration_minutes": 5}}
  ],
  "cuisine_type": "cuisine name or empty string if not specified",
  "dietary_restrictions": ["restriction1"],
  "spice_level": "{spice_level or 'medium'}",
  "difficulty": "easy/medium/hard",
  "prep_time_minutes": 15,
  "cook_time_minutes": {cook_time_minutes if cook_time_minutes is not None else 30},
  "servings": {servings},
  "nutrition": {{
    "calories": 450,
    "protein_g": 35,
    "carbs_g": 45,
    "fat_g": 12,
    "fiber_g": 5,
    "sugar_g": 3,
    "sodium_mg": 600,
    "cholesterol_mg": 75,
    "potassium_mg": 400,
    "vitamin_a_mcg": 800,
    "vitamin_c_mg": 15,
    "vitamin_d_mcg": 2,
    "vitamin_e_mg": 8,
    "vitamin_k_mcg": 90,
    "vitamin_b6_mg": 1.5,
    "vitamin_b12_mcg": 2.4,
    "folate_mcg": 400,
    "calcium_mg": 1000,
    "iron_mg": 18,
    "magnesium_mg": 400,
    "zinc_mg": 11,
    "selenium_mcg": 55
  }}
}}

Return ONLY valid JSON, no markdown, no additional text."""

        response = self.client.chat.completions.create(
            model=self.text_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2500
        )
        
        result = response.choices[0].message.content.strip()
        
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
            result = result.strip()
        
        return json.loads(result)


class IngredientRecognitionStrategy(AIStrategy):
    """
    Pattern: Strategy (Behavioral) - Concrete Strategy
    Recognizes ingredients from images using vision AI
    """
    
    def __init__(self, groq_client: Groq):
        self.client = groq_client
        self.vision_model = "meta-llama/llama-4-maverick-17b-128e-instruct"
    
    async def execute(self, image_base64: str) -> Dict:
        """
        Recognizes ingredients from image
        Args:
            image_base64: Base64-encoded image with data URI prefix
        """
        prompt = """Identify all visible ingredients in this image.

Provide a JSON response with:
- ingredients: array of ingredient names (simple list, e.g., ["tomatoes", "onions", "garlic"])
- quantities_estimated: object mapping ingredients to estimated quantities (if visible)
- confidence_score: 0-1 overall confidence

Return ONLY valid JSON, no additional text."""

        response = self.client.chat.completions.create(
            model=self.vision_model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_base64}}
                ]
            }],
            temperature=0.3,
            max_tokens=800
        )
        
        result = response.choices[0].message.content.strip()
        
        if result.startswith("```"):
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
            result = result.strip()
        
        return json.loads(result)


class AIService:
    """
    Pattern: Strategy (Behavioral)
    Context class that uses different AI strategies
    Delegates to appropriate strategy based on task type
    """
    
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
        self.nutrition_strategy = NutritionAnalysisStrategy(self.client)
        self.recipe_strategy = RecipeGenerationStrategy(self.client)
        self.ingredient_strategy = IngredientRecognitionStrategy(self.client)
    
    async def analyze_nutrition(self, image_base64: str) -> Dict:
        """Analyze nutrition from base64-encoded image"""
        return await self.nutrition_strategy.execute(image_base64=image_base64)
    
    async def generate_recipe(
        self,
        ingredients_text: str,
        cuisine: str = None,
        dietary_restrictions: List[str] = None,
        spice_level: str = None,
        servings: int = 4,
        cook_time_minutes: int = None
    ) -> Dict:
        """Generate recipe using text ingredients"""
        return await self.recipe_strategy.execute(
            ingredients_text=ingredients_text,
            cuisine=cuisine,
            dietary_restrictions=dietary_restrictions,
            spice_level=spice_level,
            servings=servings,
            cook_time_minutes=cook_time_minutes
        )
    
    async def recognize_ingredients(self, image_base64: str) -> Dict:
        """Recognize ingredients from base64-encoded image"""
        return await self.ingredient_strategy.execute(image_base64=image_base64)


def get_ai_service() -> AIService:
    """
    Pattern: Factory (Creational)
    Creates AI service instance with configuration
    """
    settings = get_settings()
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY not configured in environment variables")
    return AIService(api_key=settings.groq_api_key)
