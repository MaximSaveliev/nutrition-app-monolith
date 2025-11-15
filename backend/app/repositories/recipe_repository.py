"""
Pattern: Repository (Structural)
Abstracts data access logic for recipes from business layer
"""
from typing import List, Optional, Dict
from datetime import datetime
from app.database import DatabaseManager
from app.schemas.recipe import (
    RecipeCreateRequest,
    RecipeResponse,
    RecipeFilterRequest,
    IngredientItem,
    RecipeStep,
    NutritionInfo
)


class RecipeRepository:
    """
    Pattern: Repository (Structural)
    Encapsulates recipe data access logic and provides clean interface
    Separates business logic from data persistence concerns
    """
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    async def create(self, recipe_data: RecipeCreateRequest, author_id: str) -> RecipeResponse:
        """Create new recipe"""
        def get_value(field):
            return field.value if hasattr(field, 'value') else field
        
        result = self.db.admin_client.table("recipes").insert({
            "author_id": author_id,
            "title": recipe_data.title,
            "description": recipe_data.description,
            "ingredients": [ing.model_dump() for ing in recipe_data.ingredients],
            "steps": [step.model_dump() for step in recipe_data.steps],
            "cuisine_type": get_value(recipe_data.cuisine_type) if recipe_data.cuisine_type else None,
            "dietary_restrictions": [get_value(dr) for dr in recipe_data.dietary_restrictions] if recipe_data.dietary_restrictions else [],
            "spice_level": get_value(recipe_data.spice_level) if recipe_data.spice_level else None,
            "difficulty": get_value(recipe_data.difficulty),
            "prep_time_minutes": recipe_data.prep_time_minutes,
            "cook_time_minutes": recipe_data.cook_time_minutes,
            "servings": recipe_data.servings,
            "nutrition": recipe_data.nutrition.model_dump(),
            "is_public": recipe_data.is_public,
            "image_url": recipe_data.image_url
        }).execute()
        
        return self._map_to_response(result.data[0])
    
    async def get_by_id(self, recipe_id: str) -> Optional[RecipeResponse]:
        """Get recipe by ID"""
        result = self.db.admin_client.table("recipes").select("*").eq("id", recipe_id).single().execute()
        
        if not result.data:
            return None
        
        author_id = result.data["author_id"]
        user_result = self.db.admin_client.table("users").select("nickname").eq("id", author_id).single().execute()
        
        if user_result.data:
            result.data["users"] = {"nickname": user_result.data["nickname"]}
        
        return self._map_to_response(result.data)
    
    async def list_recipes(self, filters: RecipeFilterRequest, user_id: Optional[str] = None) -> List[RecipeResponse]:
        """List recipes with optional filters"""
        def get_value(field):
            return field.value if hasattr(field, 'value') else field
        
        query = self.db.admin_client.table("recipes").select("*")
        
        if filters.is_public:
            query = query.eq("is_public", True)
            if user_id:
                query = query.neq("author_id", user_id)
        elif user_id:
            query = query.eq("author_id", user_id)
        
        if filters.cuisine_type:
            query = query.eq("cuisine_type", get_value(filters.cuisine_type))
        
        if filters.difficulty:
            query = query.eq("difficulty", get_value(filters.difficulty))
        
        if filters.spice_level:
            query = query.eq("spice_level", get_value(filters.spice_level))
        
        if filters.max_prep_time:
            query = query.lte("prep_time_minutes", filters.max_prep_time)
        
        if filters.dietary_restrictions:
            for restriction in filters.dietary_restrictions:
                query = query.contains("dietary_restrictions", [get_value(restriction)])
        
        if filters.search_query:
            query = query.ilike("title", f"%{filters.search_query}%")
        
        result = query.order("created_at", desc=True).execute()
        
        author_ids = list(set(recipe["author_id"] for recipe in result.data))
        nickname_map = {}
        if author_ids:
            users_result = self.db.admin_client.table("users").select("id, nickname").in_("id", author_ids).execute()
            nickname_map = {user["id"]: user["nickname"] for user in users_result.data}
        
        for recipe in result.data:
            recipe["users"] = {"nickname": nickname_map.get(recipe["author_id"])}
        
        return [self._map_to_response(recipe) for recipe in result.data]
    
    async def update(self, recipe_id: str, recipe_data: RecipeCreateRequest, author_id: str) -> Optional[RecipeResponse]:
        """Update existing recipe"""
        def get_value(field):
            return field.value if hasattr(field, 'value') else field
        
        result = self.db.admin_client.table("recipes").update({
            "title": recipe_data.title,
            "description": recipe_data.description,
            "ingredients": [ing.model_dump() for ing in recipe_data.ingredients],
            "steps": [step.model_dump() for step in recipe_data.steps],
            "cuisine_type": get_value(recipe_data.cuisine_type) if recipe_data.cuisine_type else None,
            "dietary_restrictions": [get_value(dr) for dr in recipe_data.dietary_restrictions] if recipe_data.dietary_restrictions else [],
            "spice_level": get_value(recipe_data.spice_level) if recipe_data.spice_level else None,
            "difficulty": get_value(recipe_data.difficulty),
            "prep_time_minutes": recipe_data.prep_time_minutes,
            "cook_time_minutes": recipe_data.cook_time_minutes,
            "servings": recipe_data.servings,
            "nutrition": recipe_data.nutrition.model_dump(),
            "is_public": recipe_data.is_public,
            "image_url": recipe_data.image_url,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", recipe_id).eq("author_id", author_id).execute()
        
        if not result.data:
            return None
        
        return self._map_to_response(result.data[0])
    
    async def delete(self, recipe_id: str, author_id: str) -> bool:
        """Delete recipe"""
        result = self.db.admin_client.table("recipes").delete().eq("id", recipe_id).eq("author_id", author_id).execute()
        return len(result.data) > 0
    
    def _map_to_response(self, data: Dict) -> RecipeResponse:
        """Map database row to RecipeResponse"""
        author_nickname = None
        if isinstance(data.get("users"), dict):
            author_nickname = data["users"].get("nickname")
        
        return RecipeResponse(
            id=data["id"],
            title=data["title"],
            description=data.get("description"),
            author_id=data["author_id"],
            author_email=None,
            author_nickname=author_nickname,
            ingredients=[IngredientItem(**ing) for ing in data["ingredients"]],
            steps=[RecipeStep(**step) for step in data["steps"]],
            cuisine_type=data["cuisine_type"],
            dietary_restrictions=data.get("dietary_restrictions", []),
            spice_level=data["spice_level"],
            difficulty=data["difficulty"],
            prep_time_minutes=data["prep_time_minutes"],
            cook_time_minutes=data["cook_time_minutes"],
            cooking_time_minutes=data["prep_time_minutes"] + data["cook_time_minutes"],
            total_time_minutes=data["prep_time_minutes"] + data["cook_time_minutes"],
            servings=data["servings"],
            nutrition=NutritionInfo(**data["nutrition"]),
            calories_per_serving=data["nutrition"].get("calories"),
            protein_per_serving=data["nutrition"].get("protein_g"),
            carbs_per_serving=data["nutrition"].get("carbs_g"),
            fat_per_serving=data["nutrition"].get("fat_g"),
            is_public=data["is_public"],
            image_url=data.get("image_url"),
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if data.get("updated_at") else None
        )


def get_recipe_repository(db: DatabaseManager) -> RecipeRepository:
    """
    Pattern: Factory (Creational)
    Creates repository instance with database dependency
    """
    return RecipeRepository(db)
