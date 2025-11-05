"""
FastAPI Main Application
Monolith architecture for Nutrition App
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import base64

from models import (
    DishAnalysisRequest, DishAnalysisResponse,
    RecipeGenerationRequest, RecipeGenerationResponse,
    DietaryRestriction, Recipe
)
from patterns.facade import NutritionAnalysisFacade
from patterns.strategy import DietaryStrategyContext
from patterns.observer import (
    event_publisher, EventType,
    DatabaseLogObserver, AnalyticsObserver
)
from patterns.chain_of_responsibility import image_pipeline
from database import db_connection
from config import get_settings

# Initialize FastAPI app
app = FastAPI(
    title="Nutrition App API",
    description="AI-powered nutrition analysis and recipe generation",
    version="1.0.0"
)

# Initialize facade
nutrition_facade = NutritionAnalysisFacade()

# Setup observers
supabase_client = db_connection.get_supabase_client()
event_publisher.subscribe(EventType.RECIPE_CREATED, DatabaseLogObserver(supabase_client))
event_publisher.subscribe(EventType.DISH_ANALYZED, DatabaseLogObserver(supabase_client))
event_publisher.subscribe(EventType.RECIPE_CREATED, AnalyticsObserver())
event_publisher.subscribe(EventType.DISH_ANALYZED, AnalyticsObserver())


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Nutrition App API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        supabase = db_connection.get_supabase_client()
        redis = db_connection.get_redis_client()
        redis.ping()
        
        return {
            "status": "healthy",
            "database": "connected",
            "cache": "connected"
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )


@app.post("/api/analyze-dish", response_model=DishAnalysisResponse)
async def analyze_dish(request: DishAnalysisRequest):
    """
    Analyze a dish image and return nutrition information
    
    Uses:
    - Chain of Responsibility: Image processing pipeline
    - Facade: Simplified nutrition analysis interface
    - Adapter: Groq API adaptation
    - Decorator: Caching
    - Observer: Event notifications
    """
    try:
        # Process image through pipeline
        processed_image = image_pipeline.process_image(request.image_data)
        
        if not processed_image.get('validated'):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image: {processed_image.get('error', 'Unknown error')}"
            )
        
        # Use optimized image for analysis
        optimized_image = processed_image.get('optimized_base64', request.image_data)
        
        # Analyze dish using facade
        result = nutrition_facade.analyze_dish(
            image_data=optimized_image,
            dietary_restrictions=request.dietary_restrictions
        )
        
        # Publish event
        event_publisher.notify(
            EventType.DISH_ANALYZED,
            {
                'dish_name': result.dish_name,
                'calories': result.nutrition_info.calories,
                'confidence_score': result.confidence_score,
                'dietary_restrictions': [dr.value for dr in request.dietary_restrictions]
            }
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-recipe", response_model=RecipeGenerationResponse)
async def generate_recipe(request: RecipeGenerationRequest):
    """
    Generate a recipe from ingredients (text or image)
    
    Uses:
    - Facade: Recipe generation orchestration
    - Builder: Recipe construction
    - Factory: AI provider creation
    - Adapter: Groq API adaptation
    - Observer: Event notifications
    """
    try:
        # If image provided, process it first
        if request.image_data:
            processed_image = image_pipeline.process_image(request.image_data)
            
            if not processed_image.get('validated'):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid image: {processed_image.get('error', 'Unknown error')}"
                )
            
            optimized_image = processed_image.get('optimized_base64', request.image_data)
            
            # Generate recipe from ingredients image
            result = nutrition_facade.analyze_ingredients_image(
                image_data=optimized_image,
                dietary_restrictions=request.dietary_restrictions,
                preferred_cuisine=request.preferred_cuisine,
                cooking_time_max=request.cooking_time_max
            )
        else:
            # Generate recipe from ingredient list
            if not request.ingredients:
                raise HTTPException(
                    status_code=400,
                    detail="Either image_data or ingredients list must be provided"
                )
            
            result = nutrition_facade.generate_recipe(
                ingredients=request.ingredients,
                dietary_restrictions=request.dietary_restrictions,
                preferred_cuisine=request.preferred_cuisine,
                cooking_time_max=request.cooking_time_max
            )
        
        # Publish event
        event_publisher.notify(
            EventType.RECIPE_CREATED,
            {
                'recipe_id': result.recipe.id,
                'recipe_title': result.recipe.title,
                'ingredients_count': len(result.recipe.ingredients),
                'steps_count': len(result.recipe.steps),
                'dietary_restrictions': [dr.value for dr in request.dietary_restrictions]
            }
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/validate-recipe", response_model=dict)
async def validate_recipe(recipe: Recipe, restrictions: List[DietaryRestriction]):
    """
    Validate a recipe against dietary restrictions
    
    Uses:
    - Strategy: Different validation strategies for dietary restrictions
    """
    try:
        validation_result = DietaryStrategyContext.validate_recipe(
            recipe=recipe,
            restrictions=restrictions
        )
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recipes")
async def get_recipes(
    limit: int = 10,
    offset: int = 0,
    dietary_restrictions: Optional[str] = None
):
    """
    Get recipes from database with optional filtering
    """
    try:
        supabase = db_connection.get_supabase_client()
        
        query = supabase.table("recipes").select("*")
        
        # Apply filters
        if dietary_restrictions:
            restrictions_list = dietary_restrictions.split(",")
            query = query.contains("dietary_restrictions", restrictions_list)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        return {
            "recipes": result.data,
            "count": len(result.data),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    """Get a specific recipe by ID"""
    try:
        supabase = db_connection.get_supabase_client()
        
        result = supabase.table("recipes").select("*").eq("id", recipe_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        recipe_data = result.data[0]
        
        # Parse the data into Recipe model
        return Recipe(**recipe_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dietary-restrictions")
async def get_dietary_restrictions():
    """Get list of supported dietary restrictions"""
    return {
        "restrictions": [
            {
                "value": restriction.value,
                "name": restriction.name.replace("_", " ").title()
            }
            for restriction in DietaryRestriction
        ]
    }

