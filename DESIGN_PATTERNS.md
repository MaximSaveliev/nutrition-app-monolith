# Design Patterns Implementation

This document describes the **10 design patterns** implemented in the Nutrition App Monolith project, organized by category as per Gang of Four classification.

---

## 📐 Pattern Distribution

- **3 Creational Patterns**: Singleton, Factory, Builder
- **4 Structural Patterns**: Facade, Adapter, Decorator, Repository
- **3 Behavioral Patterns**: Strategy, Observer, Chain of Responsibility

---

## 🏗️ Creational Patterns (3)

### 1. Singleton Pattern

**Purpose**: Ensures a class has only one instance and provides global point of access.

**Location**: 
- `backend/app/config.py` - Settings configuration
- `backend/app/database.py` - Database connection manager
- `backend/app/services/goal_observer.py` - GoalTracker instance

**Implementation**:
```python
@lru_cache()
def get_settings() -> Settings:
    """Returns single Settings instance using lru_cache"""
    return Settings()

class DatabaseManager:
    _instance: Optional["DatabaseManager"] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

**Why**: Prevents multiple database connections and configuration instances, saving resources and ensuring consistency.

---

### 2. Factory Pattern

**Purpose**: Defines interface for creating objects but lets subclasses decide which class to instantiate.

**Location**:
- `backend/app/main.py` - `create_application()`
- `backend/app/services/auth_service.py` - `get_auth_service()`
- `backend/app/services/ai_service.py` - `get_ai_service()`
- `backend/app/services/nutrition_service.py` - `get_nutrition_service()`
- `backend/app/services/image_service.py` - `get_image_service()`
- `backend/app/repositories/*.py` - Repository factory functions

**Implementation**:
```python
def create_application() -> FastAPI:
    """Factory creates configured FastAPI instance"""
    settings = get_settings()
    app = FastAPI(title="Nutrition App API", ...)
    # Configure middleware, routers, etc.
    return app

def get_auth_service(db: DatabaseManager) -> AuthenticationService:
    """Factory creates service with dependencies"""
    return AuthenticationService(db)
```

**Why**: Centralizes object creation with proper dependency injection, making code more maintainable and testable.

---

### 3. Builder Pattern

**Purpose**: Separates construction of complex object from its representation.

**Location**: 
- `backend/app/schemas/auth.py` - Pydantic models with validators
- `backend/app/schemas/nutrition.py` - Complex nutrition data models
- `backend/app/schemas/recipe.py` - Recipe construction models

**Implementation**:
```python
class UserSignUpRequest(BaseModel):
    """Builds valid user with step-by-step validation"""
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=8)
    nickname: str = Field(..., min_length=3, max_length=50)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        # Step-by-step validation builds valid object
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain digit")
        return v
```

**Why**: Pydantic automatically validates and builds complex data structures step-by-step, ensuring type safety and data integrity.

---

## 🔧 Structural Patterns (4)

### 4. Facade Pattern

**Purpose**: Provides simplified interface to complex subsystem.

**Location**: `backend/app/services/auth_service.py`

**Implementation**:
```python
class AuthenticationService:
    """Simplifies complex Supabase authentication operations"""
    
    async def register_user(self, signup_data: UserSignUpRequest):
        # Hides complexity of:
        # - Email validation
        # - User creation in Supabase
        # - Profile creation in database
        # - Transaction rollback on failure
        # - Email confirmation flow
        ...
    
    async def authenticate_user(self, login_data: UserLoginRequest):
        # Simplifies:
        # - Password verification
        # - Session token generation
        # - User profile fetching
        ...
```

**Why**: Application code doesn't need to know about Supabase internals, just call simple methods like `register_user()`.

---

### 5. Adapter Pattern

**Purpose**: Converts interface of a class into another interface clients expect.

**Location**: `frontend/lib/api-client.ts`

**Implementation**:
```typescript
/**
 * Adapts native fetch API to typed application interface
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Login failed");
  return data;
}
```

**Why**: Frontend components use typed functions (`login()`, `getUser()`) instead of raw fetch calls, providing type safety and consistent error handling.

---

### 6. Decorator Pattern

**Purpose**: Attaches additional responsibilities to object dynamically.

**Location**: `backend/app/services/image_service.py`

**Implementation**:
```python
class BaseImageUploader(ImageUploader):
    """Core upload functionality"""
    async def upload(self, file, filename, bucket):
        # Base upload to storage
        ...

class ImageValidationDecorator(ImageUploaderDecorator):
    """Adds validation"""
    async def upload(self, file, filename, bucket):
        # Validate format and size
        if image.format not in ALLOWED_FORMATS:
            raise ValueError("Invalid format")
        return await self._uploader.upload(file, filename, bucket)

class ImageCompressionDecorator(ImageUploaderDecorator):
    """Adds compression"""
    async def upload(self, file, filename, bucket):
        # Compress image
        image.thumbnail((MAX_WIDTH, MAX_HEIGHT))
        return await self._uploader.upload(file, filename, bucket)

# Compose decorators
base = BaseImageUploader(db)
compressed = ImageCompressionDecorator(base)
validated = ImageValidationDecorator(compressed)
```

**Why**: Can add/remove validation, compression, watermarking, etc. without modifying base uploader class.

---

### 7. Repository Pattern

**Purpose**: Mediates between domain and data mapping layers.

**Location**: 
- `backend/app/repositories/recipe_repository.py`
- `backend/app/repositories/nutrition_repository.py`

**Implementation**:
```python
class RecipeRepository:
    """Abstracts recipe data access from business logic"""
    
    def __init__(self, db: DatabaseManager):
        self.db = db
    
    async def create(self, recipe_data, author_id) -> RecipeResponse:
        # Hide database details from business logic
        result = self.db.admin_client.table("recipes").insert({...}).execute()
        return self._map_to_response(result.data[0])
    
    async def get_by_id(self, recipe_id) -> Optional[RecipeResponse]:
        # Encapsulate query logic
        ...
    
    async def list_recipes(self, filters, user_id) -> List[RecipeResponse]:
        # Complex filtering logic hidden
        ...
```

**Why**: Business logic doesn't know about SQL, Supabase, or database structure. Can swap database without changing business code.

---

## 🎭 Behavioral Patterns (3)

### 8. Strategy Pattern

**Purpose**: Defines family of algorithms, encapsulates each one, makes them interchangeable.

**Location**: `backend/app/services/ai_service.py`

**Implementation**:
```python
class AIStrategy(ABC):
    """Abstract strategy interface"""
    @abstractmethod
    async def execute(self, **kwargs) -> Dict:
        pass

class NutritionAnalysisStrategy(AIStrategy):
    """Concrete strategy for nutrition analysis"""
    async def execute(self, image_base64: str) -> Dict:
        # AI analysis of food images
        ...

class RecipeGenerationStrategy(AIStrategy):
    """Concrete strategy for recipe generation"""
    async def execute(self, ingredients_text: str, ...) -> Dict:
        # AI recipe generation from ingredients
        ...

class IngredientRecognitionStrategy(AIStrategy):
    """Concrete strategy for ingredient recognition"""
    async def execute(self, image_base64: str) -> Dict:
        # AI ingredient detection
        ...

class AIService:
    """Context that uses strategies"""
    def __init__(self, api_key: str):
        self.nutrition_strategy = NutritionAnalysisStrategy(...)
        self.recipe_strategy = RecipeGenerationStrategy(...)
        self.ingredient_strategy = IngredientRecognitionStrategy(...)
```

**Why**: Can easily add new AI analysis types (e.g., allergen detection, dietary compliance) without modifying existing strategies.

---

### 9. Observer Pattern

**Purpose**: Defines one-to-many dependency where observers get notified when subject changes.

**Location**: 
- `backend/app/services/nutrition_service.py` - Meal logging observers
- `backend/app/services/goal_observer.py` - Goal achievement tracking

**Implementation**:
```python
class NutritionObserver(ABC):
    """Abstract observer interface"""
    @abstractmethod
    async def update(self, event_type: str, data: Dict):
        pass

class DailyGoalObserver(NutritionObserver):
    """Concrete observer for goal tracking"""
    async def update(self, event_type: str, data: Dict):
        if event_type == "meal_logged":
            # Check if daily goals reached
            ...

class NotificationObserver(NutritionObserver):
    """Concrete observer for notifications"""
    async def update(self, event_type: str, data: Dict):
        # Send notifications
        ...

class NutritionTrackingService:
    """Subject that notifies observers"""
    def __init__(self, db: DatabaseManager):
        self.observers: List[NutritionObserver] = []
        self.attach(DailyGoalObserver())
        self.attach(NotificationObserver())
    
    async def log_meal(self, ...):
        # Log meal to database
        log_entry = ...
        # Notify all observers
        await self.notify("meal_logged", {...})
```

**Why**: Can add new observers (email notifications, analytics, achievements) without modifying meal logging logic.

---

### 10. Chain of Responsibility Pattern

**Purpose**: Passes request along chain of handlers.

**Location**: `backend/app/middleware/auth.py`

**Implementation**:
```python
async def get_current_user(credentials, db):
    """Handler 1: Validates JWT token"""
    if not credentials:
        raise HTTPException(status_code=401)
    
    token = credentials.credentials
    user_data = await auth_service.verify_token(token)
    # Fetch user profile
    ...
    return user_data

async def get_current_active_user(current_user = Depends(get_current_user)):
    """Handler 2: Chains after get_current_user via Depends()"""
    if not current_user.get("email_confirmed_at"):
        raise HTTPException(status_code=403, detail="Email not confirmed")
    return current_user

# Usage in route
@router.get("/protected")
async def protected_route(user = Depends(get_current_active_user)):
    # Request passes through both handlers
    return {"user": user}
```

**Why**: Can compose authentication checks flexibly. Add more handlers (2FA, subscription check, permissions) by chaining with `Depends()`.

---

## 📊 Pattern Usage Summary

| Pattern | Category | Count | Files |
|---------|----------|-------|-------|
| **Singleton** | Creational | 1 | config.py, database.py, goal_observer.py |
| **Factory** | Creational | 1 | main.py, services/*, repositories/* |
| **Builder** | Creational | 1 | schemas/*.py |
| **Facade** | Structural | 1 | services/auth_service.py |
| **Adapter** | Structural | 1 | frontend/lib/api-client.ts |
| **Decorator** | Structural | 1 | services/image_service.py |
| **Repository** | Structural | 1 | repositories/*.py |
| **Strategy** | Behavioral | 1 | services/ai_service.py |
| **Observer** | Behavioral | 1 | services/nutrition_service.py, services/goal_observer.py |
| **Chain of Responsibility** | Behavioral | 1 | middleware/auth.py |

**Total: 10 Patterns**
- **3 Creational**: Singleton, Factory, Builder
- **4 Structural**: Facade, Adapter, Decorator, Repository  
- **3 Behavioral**: Strategy, Observer, Chain of Responsibility

---

## 🎯 Benefits of This Architecture

1. **Maintainability**: Each pattern has clear responsibility
2. **Testability**: Patterns enable easy mocking and unit testing
3. **Scalability**: Can extend functionality without modifying existing code
4. **Flexibility**: Swap implementations (database, AI provider, authentication) easily
5. **Code Reusability**: Patterns promote DRY (Don't Repeat Yourself)
6. **Separation of Concerns**: Business logic separated from infrastructure
7. **Type Safety**: Builder pattern (Pydantic) ensures runtime validation
8. **Clean Architecture**: Dependencies flow inward (business → data access)

---

## 📖 References

- **Gang of Four**: "Design Patterns: Elements of Reusable Object-Oriented Software"
- **Repository Pattern**: Martin Fowler's Patterns of Enterprise Application Architecture
- **Clean Architecture**: Robert C. Martin (Uncle Bob)
- **Dependency Injection**: Inversion of Control principle (SOLID)
