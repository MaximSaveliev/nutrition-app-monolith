"""
Init file for patterns module
"""
from .factory import AIProviderFactory, AIProvider, GroqAIProvider
from .builder import RecipeBuilder
from .adapter import GroqAPIAdapter
from .decorator import cache_result, log_execution
from .facade import NutritionAnalysisFacade
from .strategy import DietaryStrategyContext, DietaryStrategy
from .observer import event_publisher, EventType
from .chain_of_responsibility import image_pipeline, ImageProcessingPipeline

__all__ = [
    # Factory Pattern
    'AIProviderFactory',
    'AIProvider',
    'GroqAIProvider',
    
    # Builder Pattern
    'RecipeBuilder',
    
    # Adapter Pattern
    'GroqAPIAdapter',
    
    # Decorator Pattern
    'cache_result',
    'log_execution',
    
    # Facade Pattern
    'NutritionAnalysisFacade',
    
    # Strategy Pattern
    'DietaryStrategyContext',
    'DietaryStrategy',
    
    # Observer Pattern
    'event_publisher',
    'EventType',
    
    # Chain of Responsibility Pattern
    'image_pipeline',
    'ImageProcessingPipeline',
]
