# Design Patterns Implementation Guide

This document explains the 10 design patterns implemented in the Nutrition App monolith architecture.

## Creational Patterns (3)

### 1. Factory Pattern
**Location**: `backend/patterns/factory.py`

**Purpose**: Creates different AI provider instances without exposing creation logic.

**Implementation**:
```python
# Usage
ai_provider = AIProviderFactory.create_provider("groq")
response = ai_provider.analyze_image(image_data, prompt)

# Easy to extend
AIProviderFactory.register_provider("openai", OpenAIProvider)
```

**Benefits**:
- Easy to switch between AI providers
- New providers can be added without changing existing code
- Centralized provider creation logic

**Example in Project**:
- Used in `NutritionAnalysisFacade` to create Groq AI provider
- Can easily add OpenAI, Anthropic, or other AI providers

---

### 2. Singleton Pattern
**Location**: `backend/config.py`, `backend/database.py`

**Purpose**: Ensures only one instance of configuration and database connections exist.

**Implementation**:
```python
# Configuration Singleton
@lru_cache()
def get_settings() -> Settings:
    return Settings()

# Database Connection Singleton
class DatabaseConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

**Benefits**:
- Single database connection pool (resource efficiency)
- Consistent configuration across application
- Thread-safe implementation

**Example in Project**:
- `db_connection.get_supabase_client()` always returns same client
- `get_settings()` returns cached configuration

---

### 3. Builder Pattern
**Location**: `backend/patterns/builder.py`

**Purpose**: Constructs complex Recipe objects step by step with a fluent interface.

**Implementation**:
```python
recipe = (RecipeBuilder()
    .set_title("Vegan Buddha Bowl")
    .set_description("Healthy bowl with quinoa")
    .add_ingredient("quinoa", "1 cup")
    .add_ingredient("chickpeas", "1 can")
    .add_step(1, "Cook quinoa", 15)
    .add_step(2, "Roast chickpeas", 20)
    .set_nutrition_info(calories=450, protein=15, carbs=60, fat=12)
    .add_dietary_restriction(DietaryRestriction.VEGAN)
    .set_prep_time(15)
    .set_cook_time(35)
    .set_servings(2)
    .build())
```

**Benefits**:
- Clean, readable recipe construction
- Validation at build time
- Flexible - set only needed fields
- Immutable once built

**Example in Project**:
- Used internally in `GroqAPIAdapter` to build recipes from AI responses
- Can be used in API endpoints for manual recipe creation

---

## Structural Patterns (3)

### 4. Adapter Pattern
**Location**: `backend/patterns/adapter.py`

**Purpose**: Adapts Groq AI API responses to application's data models.

**Implementation**:
```python
class GroqAPIAdapter:
    def analyze_dish_nutrition(self, image_data, restrictions):
        # Call Groq AI
        response = self.ai_provider.analyze_image(image_data, prompt)
        
        # Adapt response to application model
        return DishAnalysisResponse(
            dish_name=response["dish_name"],
            nutrition_info=NutritionInfo(**response["nutrition_info"]),
            ingredients_detected=response["ingredients_detected"],
            confidence_score=response["confidence_score"]
        )
```

**Benefits**:
- Isolates AI API changes from application
- Converts unstructured AI responses to typed models
- Handles error cases gracefully

**Example in Project**:
- Converts Groq's free-form JSON to `DishAnalysisResponse`
- Converts text responses to structured `Recipe` objects

---

### 5. Decorator Pattern
**Location**: `backend/patterns/decorator.py`

**Purpose**: Adds caching and logging functionality to functions without modifying them.

**Implementation**:
```python
# Caching Decorator
@cache_result(ttl=3600, prefix="nutrition")
def expensive_nutrition_calculation(data):
    # Expensive operation
    return result  # Cached for 1 hour

# Logging Decorator
@log_execution(log_args=True, log_result=True)
def process_image(image):
    # Function execution is logged
    return processed_image
```

**Benefits**:
- Reusable caching logic
- Easy to add/remove caching
- Reduces database/API calls
- Improves performance

**Example in Project**:
- `analyze_dish()` in facade is cached for 30 minutes
- `generate_recipe()` is cached for 1 hour
- All major functions have execution logging

---

### 6. Facade Pattern
**Location**: `backend/patterns/facade.py`

**Purpose**: Provides simplified interface for complex nutrition analysis operations.

**Implementation**:
```python
class NutritionAnalysisFacade:
    def analyze_dish(self, image_data, restrictions):
        # Orchestrates multiple operations:
        # 1. Image processing (Chain of Responsibility)
        # 2. AI analysis (Factory + Adapter)
        # 3. Database storage
        # 4. Event notification (Observer)
        # 5. Caching (Decorator)
        
        # Client just calls one simple method
        return result
```

**Benefits**:
- Hides complex subsystem interactions
- Simplifies API for clients
- Centralizes orchestration logic
- Easy to test and maintain

**Example in Project**:
- `analyze_dish()` - handles image processing, AI analysis, DB storage, events
- `generate_recipe()` - orchestrates recipe generation pipeline
- `analyze_ingredients_image()` - combines detection + recipe generation

---

## Behavioral Patterns (3)

### 7. Strategy Pattern
**Location**: `backend/patterns/strategy.py`

**Purpose**: Implements different dietary restriction validation strategies.

**Implementation**:
```python
# Different strategies for different diets
class VeganStrategy(DietaryStrategy):
    def validate(self, recipe):
        # Check for animal products
        return validation_result

class KetoStrategy(DietaryStrategy):
    def validate(self, recipe):
        # Check carbohydrate content
        return validation_result

# Context selects strategy
result = DietaryStrategyContext.validate_recipe(
    recipe, 
    [DietaryRestriction.VEGAN, DietaryRestriction.KETO]
)
```

**Benefits**:
- Easy to add new dietary restrictions
- Each strategy is independent
- Runtime strategy selection
- Clean separation of concerns

**Example in Project**:
- Validates recipes against vegan, vegetarian, gluten-free, keto rules
- Provides specific recommendations for each diet
- Used in `/api/validate-recipe` endpoint

---

### 8. Observer Pattern
**Location**: `backend/patterns/observer.py`

**Purpose**: Notifies multiple subscribers when events occur.

**Implementation**:
```python
# Subscribe observers
event_publisher.subscribe(
    EventType.RECIPE_CREATED,
    DatabaseLogObserver(supabase_client)
)
event_publisher.subscribe(
    EventType.RECIPE_CREATED,
    EmailNotificationObserver()
)
event_publisher.subscribe(
    EventType.RECIPE_CREATED,
    AnalyticsObserver()
)

# Publish event - all observers notified
event_publisher.notify(
    EventType.RECIPE_CREATED,
    {"recipe_id": "123", "title": "New Recipe"}
)
```

**Benefits**:
- Decoupled event handling
- Easy to add new observers
- No changes to event publisher
- Supports multiple notification channels

**Example in Project**:
- `RECIPE_CREATED` event triggers: DB logging, analytics, (future: email)
- `DISH_ANALYZED` event triggers: DB logging, analytics
- Easy to add webhook, SMS, push notification observers

---

### 9. Chain of Responsibility
**Location**: `backend/patterns/chain_of_responsibility.py`

**Purpose**: Processes images through a pipeline of handlers.

**Implementation**:
```python
# Image processing pipeline
validation = ImageValidationHandler()
resize = ImageResizeHandler()
optimization = ImageOptimizationHandler()

validation.set_next(resize).set_next(optimization)

# Process through chain
result = image_pipeline.process_image(base64_image)
# Flow: Validate → Resize → Optimize
```

**Benefits**:
- Sequential processing pipeline
- Each handler has single responsibility
- Easy to add/remove/reorder handlers
- Handler can stop chain if needed

**Example in Project**:
- Validates image format and size
- Resizes large images (max 1024x1024)
- Optimizes quality for faster processing
- Used in all image upload endpoints

---

## Additional Pattern (Bonus)

### 10. Template Method (Implicit)
**Location**: Implicit in Strategy Pattern

**Purpose**: Defines skeleton of dietary validation algorithm.

**Implementation**:
```python
# Abstract base defines template
class DietaryStrategy(ABC):
    def validate(self, recipe):
        # Template method - subclasses implement
        pass
    
    def get_recommendations(self, recipe):
        # Template method - subclasses implement
        pass
```

**Benefits**:
- Consistent interface across strategies
- Common structure for all dietary validations
- Subclasses customize specific steps

---

## Pattern Interactions

### How Patterns Work Together

1. **Dish Analysis Flow**:
   ```
   API Request
   → Chain of Responsibility (image processing)
   → Facade (orchestration)
   → Factory (create AI provider)
   → Adapter (convert AI response)
   → Decorator (cache result)
   → Observer (publish event)
   → Response
   ```

2. **Recipe Generation Flow**:
   ```
   API Request
   → Chain of Responsibility (process ingredients image)
   → Facade (orchestration)
   → Factory (create AI provider)
   → Adapter (convert to Recipe)
   → Builder (construct Recipe object)
   → Strategy (validate dietary restrictions)
   → Decorator (cache result)
   → Singleton (save to DB)
   → Observer (publish event)
   → Response
   ```

## Testing Patterns

Each pattern can be tested independently:

```python
# Test Factory
def test_factory():
    provider = AIProviderFactory.create_provider("groq")
    assert isinstance(provider, GroqAIProvider)

# Test Builder
def test_builder():
    recipe = RecipeBuilder().set_title("Test").build()
    assert recipe.title == "Test"

# Test Strategy
def test_strategy():
    result = VeganStrategy().validate(vegan_recipe)
    assert result['valid'] == True
```

## Benefits of This Architecture

1. **Maintainability**: Each pattern is in its own file
2. **Testability**: Patterns can be tested independently
3. **Extensibility**: Easy to add new features
4. **Readability**: Clear separation of concerns
5. **Reusability**: Patterns can be used in microservices version

## Migration to Microservices

These patterns will translate to microservices:
- Factory → Service Registry
- Singleton → Service Instance Management
- Facade → API Gateway
- Observer → Message Queue (RabbitMQ)
- Strategy → Policy Service
- Chain → Saga Pattern

---

## Summary

This implementation demonstrates real-world usage of 10 design patterns:
- ✅ 3 Creational: Factory, Singleton, Builder
- ✅ 3 Structural: Adapter, Decorator, Facade
- ✅ 4 Behavioral: Strategy, Observer, Chain, Template Method

Each pattern solves specific problems and works together to create a maintainable, scalable application.
