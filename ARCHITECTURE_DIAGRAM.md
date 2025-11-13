# Design Patterns Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NUTRITION APP MONOLITH ARCHITECTURE                   │
│                         10 Design Patterns                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  React Components                                                        │
│      ↓ uses                                                             │
│  [ADAPTER] api-client.ts  ← Adapts fetch API to typed interface        │
│      ↓ HTTP calls                                                       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ↓ REST API
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND API LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  FastAPI Routes                                                          │
│      ↓ depends on                                                       │
│  [CHAIN] Auth Middleware  ← get_current_user → get_current_active_user │
│      ↓ validates                                                        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ↓ validated request
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  [FACADE] AuthenticationService   ← Simplifies Supabase auth           │
│  [STRATEGY] AIService              ← Multiple analysis strategies       │
│     ├── NutritionAnalysisStrategy                                       │
│     ├── RecipeGenerationStrategy                                        │
│     └── IngredientRecognitionStrategy                                   │
│  [OBSERVER] NutritionTrackingService ← Notifies observers               │
│     ├── DailyGoalObserver                                               │
│     └── NotificationObserver                                            │
│  [DECORATOR] ImageUploadService    ← Layers of image processing        │
│     ├── BaseImageUploader                                               │
│     ├── ImageCompressionDecorator                                       │
│     └── ImageValidationDecorator                                        │
│      ↓ uses                                                             │
│  [FACTORY] Service Factory Functions ← Create services with deps       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ↓ data access
┌─────────────────────────────────────────────────────────────────────────┐
│                         REPOSITORY LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  [REPOSITORY] RecipeRepository    ← Abstract recipe data access        │
│  [REPOSITORY] NutritionRepository ← Abstract nutrition data access      │
│      ↓ uses                                                             │
│  [SINGLETON] DatabaseManager      ← Single DB connection               │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ↓ SQL queries
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                                   │
│  ├── users table                                                        │
│  ├── recipes table                                                      │
│  ├── scanned_dishes table                                               │
│  └── daily_nutrition_stats table                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPPORTING COMPONENTS                            │
├─────────────────────────────────────────────────────────────────────────┤
│  [SINGLETON] Settings             ← Single config instance              │
│  [BUILDER] Pydantic Models        ← Build validated objects             │
│     ├── UserSignUpRequest                                               │
│     ├── RecipeCreateRequest                                             │
│     └── LogScannedDishRequest                                           │
│  [FACTORY] Application Factory    ← Create FastAPI app                 │
└─────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════

PATTERN LEGEND:
[SINGLETON]   → Ensures single instance (config, DB)
[FACTORY]     → Creates objects with dependencies
[BUILDER]     → Constructs complex objects step-by-step
[FACADE]      → Simplifies complex subsystems
[ADAPTER]     → Converts interfaces
[DECORATOR]   → Adds behavior dynamically
[REPOSITORY]  → Abstracts data access
[STRATEGY]    → Interchangeable algorithms
[OBSERVER]    → Event notification system
[CHAIN]       → Request handler chain

═══════════════════════════════════════════════════════════════════════════

DATA FLOW EXAMPLE - Analyzing a Dish:

1. User uploads image via React component
2. [ADAPTER] api-client.ts makes typed HTTP request
3. [CHAIN] Auth middleware validates user (Handler 1 → Handler 2)
4. [FACTORY] Creates AIService instance
5. [STRATEGY] AIService delegates to NutritionAnalysisStrategy
6. Strategy calls Groq AI API for analysis
7. [BUILDER] Pydantic validates response into NutritionInfo
8. [OBSERVER] NutritionTrackingService logs meal and notifies observers
9. [REPOSITORY] NutritionRepository saves to database
10. [SINGLETON] DatabaseManager executes SQL via Supabase
11. Response flows back through layers to frontend

═══════════════════════════════════════════════════════════════════════════

KEY BENEFITS:

✅ Maintainability  - Clear separation of concerns
✅ Testability      - Easy to mock dependencies  
✅ Scalability      - Add features without modifying existing code
✅ Flexibility      - Swap implementations easily
✅ Type Safety      - Builder + Adapter ensure correctness
✅ Reusability      - Patterns promote DRY principle

═══════════════════════════════════════════════════════════════════════════
```
