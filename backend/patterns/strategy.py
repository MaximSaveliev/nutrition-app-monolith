"""
Strategy Pattern: Dietary Restriction Strategies
Implements different dietary restriction validation strategies
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from models import DietaryRestriction, Recipe, NutritionInfo


class DietaryStrategy(ABC):
    """Abstract base class for dietary restriction strategies"""
    
    @abstractmethod
    def validate(self, recipe: Recipe) -> Dict[str, Any]:
        """
        Validate recipe against dietary restrictions
        
        Returns:
            Dict with 'valid': bool and 'violations': List[str]
        """
        pass
    
    @abstractmethod
    def get_recommendations(self, recipe: Recipe) -> List[str]:
        """Get recommendations to make recipe compliant"""
        pass


class VeganStrategy(DietaryStrategy):
    """Strategy for vegan dietary restrictions"""
    
    NON_VEGAN_INGREDIENTS = [
        'meat', 'chicken', 'beef', 'pork', 'fish', 'seafood',
        'eggs', 'milk', 'cheese', 'butter', 'cream', 'yogurt',
        'honey', 'gelatin', 'whey', 'casein'
    ]
    
    def validate(self, recipe: Recipe) -> Dict[str, Any]:
        violations = []
        
        # Check ingredients
        for ingredient in recipe.ingredients:
            ingredient_lower = ingredient.lower()
            for non_vegan in self.NON_VEGAN_INGREDIENTS:
                if non_vegan in ingredient_lower:
                    violations.append(f"Contains non-vegan ingredient: {ingredient}")
        
        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'restriction': 'vegan'
        }
    
    def get_recommendations(self, recipe: Recipe) -> List[str]:
        recommendations = []
        
        for ingredient in recipe.ingredients:
            ingredient_lower = ingredient.lower()
            if 'milk' in ingredient_lower:
                recommendations.append("Replace milk with almond, soy, or oat milk")
            elif 'butter' in ingredient_lower:
                recommendations.append("Replace butter with vegan butter or coconut oil")
            elif 'eggs' in ingredient_lower:
                recommendations.append("Replace eggs with flax eggs or aquafaba")
            elif 'cheese' in ingredient_lower:
                recommendations.append("Use vegan cheese alternatives")
            elif any(meat in ingredient_lower for meat in ['chicken', 'beef', 'pork']):
                recommendations.append("Replace meat with tofu, tempeh, or seitan")
        
        return recommendations


class VegetarianStrategy(DietaryStrategy):
    """Strategy for vegetarian dietary restrictions"""
    
    NON_VEGETARIAN_INGREDIENTS = [
        'meat', 'chicken', 'beef', 'pork', 'fish', 'seafood',
        'gelatin', 'lard', 'anchovies'
    ]
    
    def validate(self, recipe: Recipe) -> Dict[str, Any]:
        violations = []
        
        for ingredient in recipe.ingredients:
            ingredient_lower = ingredient.lower()
            for non_veg in self.NON_VEGETARIAN_INGREDIENTS:
                if non_veg in ingredient_lower:
                    violations.append(f"Contains non-vegetarian ingredient: {ingredient}")
        
        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'restriction': 'vegetarian'
        }
    
    def get_recommendations(self, recipe: Recipe) -> List[str]:
        recommendations = []
        
        for ingredient in recipe.ingredients:
            ingredient_lower = ingredient.lower()
            if any(meat in ingredient_lower for meat in ['chicken', 'beef', 'pork', 'fish']):
                recommendations.append(f"Replace {ingredient} with plant-based protein or eggs")
        
        return recommendations


class GlutenFreeStrategy(DietaryStrategy):
    """Strategy for gluten-free dietary restrictions"""
    
    GLUTEN_INGREDIENTS = [
        'wheat', 'flour', 'bread', 'pasta', 'barley', 'rye',
        'couscous', 'seitan', 'soy sauce', 'beer'
    ]
    
    def validate(self, recipe: Recipe) -> Dict[str, Any]:
        violations = []
        
        for ingredient in recipe.ingredients:
            ingredient_lower = ingredient.lower()
            for gluten in self.GLUTEN_INGREDIENTS:
                if gluten in ingredient_lower and 'gluten-free' not in ingredient_lower:
                    violations.append(f"Contains gluten: {ingredient}")
        
        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'restriction': 'gluten_free'
        }
    
    def get_recommendations(self, recipe: Recipe) -> List[str]:
        recommendations = []
        
        for ingredient in recipe.ingredients:
            ingredient_lower = ingredient.lower()
            if 'flour' in ingredient_lower:
                recommendations.append("Use gluten-free flour blend")
            elif 'pasta' in ingredient_lower:
                recommendations.append("Use rice or corn-based pasta")
            elif 'bread' in ingredient_lower:
                recommendations.append("Use gluten-free bread")
            elif 'soy sauce' in ingredient_lower:
                recommendations.append("Use tamari or coconut aminos")
        
        return recommendations


class KetoStrategy(DietaryStrategy):
    """Strategy for ketogenic diet restrictions"""
    
    def validate(self, recipe: Recipe) -> Dict[str, Any]:
        violations = []
        nutrition = recipe.nutrition_info
        
        # Keto typically requires <50g carbs per day, so per serving should be low
        carbs_per_serving = nutrition.carbohydrates / recipe.servings
        
        if carbs_per_serving > 10:
            violations.append(f"Too many carbohydrates: {carbs_per_serving}g per serving")
        
        # Check for high-carb ingredients
        high_carb_ingredients = ['sugar', 'rice', 'pasta', 'bread', 'potato', 'corn']
        for ingredient in recipe.ingredients:
            ingredient_lower = ingredient.lower()
            for high_carb in high_carb_ingredients:
                if high_carb in ingredient_lower:
                    violations.append(f"Contains high-carb ingredient: {ingredient}")
        
        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'restriction': 'keto'
        }
    
    def get_recommendations(self, recipe: Recipe) -> List[str]:
        recommendations = [
            "Focus on high-fat, low-carb ingredients",
            "Replace grains with cauliflower rice or zucchini noodles",
            "Use natural sweeteners like stevia or erythritol",
            "Increase healthy fats from avocado, nuts, and oils"
        ]
        return recommendations


class DietaryStrategyContext:
    """
    Strategy Pattern Context: Manages dietary restriction strategies
    Allows dynamic switching between different dietary validation strategies
    """
    
    _strategies: Dict[DietaryRestriction, DietaryStrategy] = {
        DietaryRestriction.VEGAN: VeganStrategy(),
        DietaryRestriction.VEGETARIAN: VegetarianStrategy(),
        DietaryRestriction.GLUTEN_FREE: GlutenFreeStrategy(),
        DietaryRestriction.KETO: KetoStrategy(),
    }
    
    @classmethod
    def validate_recipe(cls, recipe: Recipe, 
                       restrictions: List[DietaryRestriction]) -> Dict[str, Any]:
        """
        Validate recipe against multiple dietary restrictions
        
        Returns:
            Dict with validation results for each restriction
        """
        results = {
            'overall_valid': True,
            'restrictions_checked': [],
            'violations': [],
            'recommendations': []
        }
        
        for restriction in restrictions:
            if restriction in cls._strategies:
                strategy = cls._strategies[restriction]
                validation = strategy.validate(recipe)
                
                results['restrictions_checked'].append(restriction.value)
                
                if not validation['valid']:
                    results['overall_valid'] = False
                    results['violations'].extend(validation['violations'])
                    results['recommendations'].extend(strategy.get_recommendations(recipe))
        
        return results
    
    @classmethod
    def register_strategy(cls, restriction: DietaryRestriction, strategy: DietaryStrategy):
        """Register a new dietary strategy"""
        cls._strategies[restriction] = strategy
