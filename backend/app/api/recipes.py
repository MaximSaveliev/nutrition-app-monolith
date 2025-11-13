from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from typing import List, Optional
from app.database import DatabaseManager, get_database
from app.middleware.auth import get_current_user, optional_auth
from app.middleware.rate_limit import check_rate_limit
from app.schemas.recipe import (
    RecipeCreateRequest,
    RecipeResponse,
    RecipeFilterRequest,
    GenerateRecipeRequest,
    UnifiedRecipeRequest
)
from app.repositories.recipe_repository import get_recipe_repository
from app.services.ai_service import get_ai_service
from app.services.image_service import get_image_service

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe: RecipeCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    repository = get_recipe_repository(db)
    return await repository.create(recipe, current_user["id"])


@router.post("/generate", response_model=RecipeCreateRequest)
async def generate_recipe(
    request: GenerateRecipeRequest,
    current_user: dict = Depends(get_current_user)
):
    ai_service = get_ai_service()
    
    result = await ai_service.generate_recipe(
        ingredients_text=request.ingredients_text,
        cuisine=request.cuisine_preference,
        dietary_restrictions=[dr.value for dr in request.dietary_restrictions] if request.dietary_restrictions else None,
        spice_level=request.spice_level,
        servings=request.servings
    )
    
    return RecipeCreateRequest(**result)


@router.post("/generate-from-input", response_model=RecipeCreateRequest)
async def generate_recipe_from_input(
    request: UnifiedRecipeRequest,
    http_request: Request,
    current_user: Optional[dict] = Depends(optional_auth)
):
    """
    Unified endpoint - accepts either text OR image for recipe generation.
    Strategy Pattern: Detects input type and routes to appropriate AI model.
    - Image → meta-llama/llama-4-maverick-17b-128e-instruct (vision model)
    - Text → llama-3.3-70b-versatile (text model)
    
    Rate Limiting: Anonymous users limited to 3 requests per 24 hours
    """
    # Check rate limit
    token = http_request.headers.get("Authorization", "").replace("Bearer ", "") if current_user else None
    rate_limit_info = await check_rate_limit(http_request, token)
    
    ai_service = get_ai_service()
    
    if not request.ingredients_text and not request.image_base64:
        raise HTTPException(
            status_code=400,
            detail="Either ingredients_text or image_base64 must be provided"
        )
    
    if request.ingredients_text and request.image_base64:
        raise HTTPException(
            status_code=400,
            detail="Provide either ingredients_text OR image_base64, not both"
        )
    
    # If image provided, recognize ingredients first, then generate recipe
    if request.image_base64:
        # Use vision model to recognize ingredients
        ingredient_result = await ai_service.recognize_ingredients(
            image_base64=request.image_base64
        )
        
        # Convert detected ingredients to text format
        ingredients_text = ", ".join(ingredient_result.get("ingredients", []))
        
        if not ingredients_text:
            raise HTTPException(
                status_code=400,
                detail="No ingredients detected in the image"
            )
    else:
        ingredients_text = request.ingredients_text
    
    # Generate recipe using text model
    result = await ai_service.generate_recipe(
        ingredients_text=ingredients_text,
        cuisine=request.cuisine_preference,
        dietary_restrictions=[dr.value for dr in request.dietary_restrictions] if request.dietary_restrictions else None,
        spice_level=request.spice_level,
        servings=request.servings,
        cook_time_minutes=request.cook_time_minutes
    )
    
    return RecipeCreateRequest(**result)


@router.post("/generate-and-save", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def generate_and_save_recipe(
    request: UnifiedRecipeRequest,
    http_request: Request,
    db: DatabaseManager = Depends(get_database),
    current_user: Optional[dict] = Depends(optional_auth)
):
    """
    Generate a recipe from ingredients AND save it to the database (authenticated users only).
    Anonymous users can generate recipes but must be logged in to save them.
    
    Rate Limiting: Anonymous users limited to 3 requests per 24 hours
    """
    # Require authentication to save recipes
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be logged in to save recipes. Sign up for free!"
        )
    
    # Check rate limit
    token = http_request.headers.get("Authorization", "").replace("Bearer ", "")
    rate_limit_info = await check_rate_limit(http_request, token)
    
    ai_service = get_ai_service()
    
    if not request.ingredients_text and not request.image_base64:
        raise HTTPException(
            status_code=400,
            detail="Either ingredients_text or image_base64 must be provided"
        )
    
    if request.ingredients_text and request.image_base64:
        raise HTTPException(
            status_code=400,
            detail="Provide either ingredients_text OR image_base64, not both"
        )
    
    # If image provided, recognize ingredients first
    if request.image_base64:
        ingredient_result = await ai_service.recognize_ingredients(
            image_base64=request.image_base64
        )
        ingredients_text = ", ".join(ingredient_result.get("ingredients", []))
        
        if not ingredients_text:
            raise HTTPException(
                status_code=400,
                detail="No ingredients detected in the image"
            )
    else:
        ingredients_text = request.ingredients_text
    
    # Generate recipe
    result = await ai_service.generate_recipe(
        ingredients_text=ingredients_text,
        cuisine=request.cuisine_preference,
        dietary_restrictions=[dr.value for dr in request.dietary_restrictions] if request.dietary_restrictions else None,
        spice_level=request.spice_level,
        servings=request.servings,
        cook_time_minutes=request.cook_time_minutes
    )
    
    # Save to database
    recipe_data = RecipeCreateRequest(**result)
    repository = get_recipe_repository(db)
    saved_recipe = await repository.create(recipe_data, current_user["id"])
    
    return saved_recipe


@router.get("", response_model=List[RecipeResponse])
async def list_recipes(
    cuisine_type: str = None,
    difficulty: str = None,
    max_prep_time: int = None,
    spice_level: str = None,
    search_query: str = None,
    my_recipes: bool = False,
    db: DatabaseManager = Depends(get_database),
    current_user: Optional[dict] = Depends(optional_auth)
):
    """
    List recipes with optional filters.
    - Public recipes: No authentication required (excludes user's own recipes if logged in)
    - My recipes: Requires authentication
    """
    # If requesting my_recipes, authentication is required
    if my_recipes and not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view your recipes"
        )
    
    filters = RecipeFilterRequest(
        cuisine_type=cuisine_type,
        difficulty=difficulty,
        max_prep_time=max_prep_time,
        spice_level=spice_level,
        search_query=search_query,
        is_public=not my_recipes
    )
    
    repository = get_recipe_repository(db)
    
    if my_recipes:
        # Show only user's own recipes
        user_id = current_user["id"]
    elif current_user:
        # Show public recipes, excluding user's own recipes
        user_id = current_user["id"]
    else:
        # Show all public recipes (user not logged in)
        user_id = None
    
    return await repository.list_recipes(filters, user_id)


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    recipe_id: str,
    db: DatabaseManager = Depends(get_database),
    current_user: Optional[dict] = Depends(optional_auth)
):
    """
    Get a single recipe by ID.
    - Public recipes: No authentication required
    - Private recipes: Requires authentication and ownership
    """
    repository = get_recipe_repository(db)
    recipe = await repository.get_by_id(recipe_id)
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # If recipe is not public, check if user is the author
    if not recipe.is_public:
        if not current_user or current_user["id"] != recipe.author_id:
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to view this recipe"
            )
    
    return recipe


@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: str,
    recipe: RecipeCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    repository = get_recipe_repository(db)
    updated = await repository.update(recipe_id, recipe, current_user["id"])
    
    if not updated:
        raise HTTPException(status_code=404, detail="Recipe not found or unauthorized")
    
    return updated


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: str,
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    repository = get_recipe_repository(db)
    deleted = await repository.delete(recipe_id, current_user["id"])
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe not found or unauthorized")


@router.post("/upload-image")
async def upload_recipe_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: DatabaseManager = Depends(get_database)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image_service = get_image_service(db)
    filename = f"recipes/{current_user['id']}/{file.filename}"
    
    try:
        url = await image_service.upload_image(file.file, filename)
        return {"url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
