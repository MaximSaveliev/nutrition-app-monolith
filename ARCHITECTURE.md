# Frontend-Backend Integration Architecture

## 📱 Complete User Flow

### Flow 1: Dish Nutrition Analysis
```
┌─────────────┐
│   User      │
│ Dashboard   │
└──────┬──────┘
       │ 1. Select "Analyze Dish" tab
       ▼
┌─────────────────────┐
│  DishAnalyzer.tsx   │
│  Component          │
└──────┬──────────────┘
       │ 2. Upload photo
       ▼
┌──────────────────────────┐
│ uploadDishImage()        │
│ → /api/nutrition/        │
│   upload-dish-image      │
└──────┬───────────────────┘
       │ 3. Image saved to Supabase Storage
       │    Returns URL
       ▼
┌──────────────────────────┐
│ analyzeDish()            │
│ → /api/nutrition/        │
│   analyze-dish           │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: nutrition.py          │
│ - AIService (Strategy Pattern) │
│ - NutritionAnalysisStrategy    │
│ - Calls Groq Vision API        │
└──────┬─────────────────────────┘
       │ 4. Returns: dish_name, nutrition, confidence
       ▼
┌─────────────────────┐
│  DishAnalyzer.tsx   │
│  Displays:          │
│  - Dish name        │
│  - Calories         │
│  - Macros (P/C/F)   │
│  - Fiber, Sugar     │
└──────┬──────────────┘
       │ 5. User clicks "Log as Breakfast/Lunch/Dinner"
       ▼
┌──────────────────────────┐
│ logMeal()                │
│ → /api/nutrition/        │
│   log-meal               │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Backend: nutrition_service.py      │
│ - NutritionTrackingService         │
│ - Observer Pattern:                │
│   * DailyGoalObserver (checks goal)│
│   * NotificationObserver (logs)    │
│ - Saves to nutrition_logs table    │
└──────┬─────────────────────────────┘
       │ 6. Observers notify: "Goal reached!"
       ▼
┌─────────────────────┐
│  Success Message    │
│  "✅ Meal logged!"  │
└─────────────────────┘
```

### Flow 2: Recipe Generation
```
┌─────────────┐
│   User      │
│ Dashboard   │
└──────┬──────┘
       │ 1. Select "Generate Recipe" tab
       ▼
┌──────────────────────┐
│ RecipeGenerator.tsx  │
│ Component            │
└──────┬───────────────┘
       │ 2. Enter ingredients: ["chicken", "tomatoes", "garlic"]
       │    Select preferences: Italian, Medium spice, Gluten-free
       ▼
┌──────────────────────────┐
│ generateRecipe()         │
│ → /api/recipes/generate  │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: recipes.py            │
│ - AIService (Strategy Pattern) │
│ - RecipeGenerationStrategy     │
│ - Calls Groq Text API          │
└──────┬─────────────────────────┘
       │ 3. Returns complete recipe:
       │    - Title, description
       │    - Ingredients list
       │    - Step-by-step instructions
       │    - Nutrition per serving
       ▼
┌──────────────────────┐
│ RecipeGenerator.tsx  │
│ Displays:            │
│ - Recipe title       │
│ - Ingredients        │
│ - Instructions       │
│ - Nutrition          │
│ - Save options       │
└──────┬───────────────┘
       │ 4. User clicks "Save as Public" or "Save as Private"
       ▼
┌──────────────────────────┐
│ createRecipe()           │
│ → /api/recipes           │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: recipe_repository.py  │
│ - Repository Pattern            │
│ - Saves to recipes table        │
│ - Sets is_public flag           │
└──────┬─────────────────────────┘
       │ 5. Recipe saved
       ▼
┌─────────────────────┐
│  Success Message    │
│  "✅ Recipe saved!" │
└─────────────────────┘
```

### Flow 3: View Daily Stats
```
┌─────────────┐
│   User      │
│ Dashboard   │
└──────┬──────┘
       │ 1. Select "My Stats" tab
       ▼
┌───────────────────────┐
│ NutritionDashboard    │
│ .tsx Component        │
└──────┬────────────────┘
       │ 2. useEffect() loads data
       ▼
┌──────────────────────────┐
│ getDailyLog()            │
│ → /api/nutrition/        │
│   daily-log?date=today   │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Backend: nutrition_service.py  │
│ - Queries nutrition_logs table │
│ - Filters by user_id and date  │
│ - Calculates totals:           │
│   * Total calories             │
│   * Total protein/carbs/fat    │
│   * Meal list with details     │
└──────┬─────────────────────────┘
       │ 3. Returns DailyNutritionSummary
       ▼
┌───────────────────────┐
│ NutritionDashboard    │
│ Displays:             │
│ - Progress bars       │
│   (Calories, P, C, F) │
│ - Goal tracking       │
│ - Meal history        │
└───────────────────────┘
```

## 🗂️ File Structure

### Frontend
```
frontend/
├── app/
│   └── dashboard/
│       └── page.tsx          ← Main dashboard with tabs
├── components/
│   ├── dish-analyzer.tsx     ← Photo upload & analysis
│   ├── recipe-generator.tsx  ← Generate recipes from ingredients
│   ├── nutrition-dashboard.tsx ← Daily stats & progress
│   └── ui/
│       ├── tabs.tsx          ← Tab navigation
│       └── progress.tsx      ← Progress bars
└── lib/
    └── api-client.ts         ← All API calls to backend
```

### Backend
```
backend/app/
├── api/
│   ├── nutrition.py          ← Nutrition endpoints
│   └── recipes.py            ← Recipe endpoints
├── services/
│   ├── ai_service.py         ← Strategy: Groq AI calls
│   ├── nutrition_service.py  ← Observer: Meal tracking
│   └── image_service.py      ← Decorator: Image processing
├── repositories/
│   └── recipe_repository.py  ← Repository: Data access
└── schemas/
    ├── nutrition.py          ← Nutrition models
    └── recipe.py             ← Recipe models
```

## 🔐 Authentication Flow

Every API call requires JWT token:
```typescript
const token = localStorage.getItem("access_token");

fetch("/api/recipes", {
  headers: {
    "Authorization": `Bearer ${token}`
  }
})
```

Backend validates with middleware:
```python
@router.get("/recipes")
async def list_recipes(
    current_user: dict = Depends(get_current_user)  ← Validates token
):
    # User authenticated, proceed
```

## 📊 Data Flow Summary

1. **Frontend** → Makes API call with auth token
2. **Backend Middleware** → Validates JWT token
3. **Backend Service** → Processes request using design patterns
4. **Database/AI** → Stores data or calls Groq API
5. **Backend** → Returns JSON response
6. **Frontend** → Updates UI with data

## 🎨 Design Patterns in Action

| Pattern | Frontend | Backend | Purpose |
|---------|----------|---------|---------|
| **Strategy** | - | AI Service | Different AI strategies (Nutrition/Recipe/Ingredient) |
| **Observer** | - | Nutrition Service | Notify when goals reached |
| **Repository** | - | Recipe Repository | Abstract data access |
| **Decorator** | - | Image Service | Validation & compression |
| **Factory** | - | All `get_*()` functions | Create service instances |
| **Singleton** | - | Config, Database | Single instances |
| **Facade** | - | Auth Service | Simplify complex operations |
| **Builder** | - | Pydantic Models | Type-safe data structures |

## 🚀 Complete Example: User Analyzes Dish

```
1. User opens /dashboard
2. Clicks "Analyze Dish" tab
3. Uploads chicken_salad.jpg
   
   Frontend (dish-analyzer.tsx):
   ├─ uploadDishImage(file, token)
   └─ → POST /api/nutrition/upload-dish-image
   
   Backend (image_service.py):
   ├─ ImageValidationDecorator ✓ checks format
   ├─ ImageCompressionDecorator ✓ compresses to 1920x1080
   └─ Uploads to Supabase Storage
   
   Returns: { url: "https://..." }

4. Frontend automatically calls analyzeDish(url, token)
   → POST /api/nutrition/analyze-dish
   
   Backend (ai_service.py):
   ├─ NutritionAnalysisStrategy.execute()
   └─ Groq Vision API analyzes image
   
   Returns: {
     dish_name: "Grilled Chicken Salad",
     nutrition: { calories: 350, protein_g: 32, ... },
     confidence_score: 0.92
   }

5. Frontend displays nutrition info
   User clicks "Log as Lunch"
   
   Frontend:
   └─ logMeal({ dish_name, nutrition, meal_type: "lunch" })
   
   Backend (nutrition_service.py):
   ├─ Saves to nutrition_logs table
   ├─ DailyGoalObserver checks: "Protein goal reached! 💪"
   └─ NotificationObserver logs: "Meal logged: Chicken Salad"
   
6. Success message shown ✅
```

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Proper design pattern implementation
- ✅ Type safety (TypeScript + Pydantic)
- ✅ Secure authentication
- ✅ Scalable and maintainable code
