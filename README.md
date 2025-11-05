# Nutrition App - Monolith Architecture

A comprehensive nutrition and recipe application built with FastAPI (Python) backend and Next.js frontend, implementing 10 design patterns in a monolith architecture.

## 🎯 Features

- **AI-Powered Dish Analysis**: Upload a photo of any dish to get detailed nutritional information
- **Smart Recipe Generation**: Take a photo of ingredients or provide a list to generate step-by-step recipes
- **Dietary Restrictions**: Support for vegan, vegetarian, gluten-free, keto, and more
- **Nutrition Tracking**: Track calories, protein, carbohydrates, fat, and other nutrients
- **Recipe Management**: Save, rate, and manage your favorite recipes

## 🏗️ Architecture

This project uses a **Monolith Architecture** where both the backend (FastAPI) and frontend (Next.js) are deployed together on Vercel.

### Design Patterns Implemented (10 Total)

#### Creational Patterns (3)
1. **Factory Pattern** (`patterns/factory.py`)
   - Creates AI provider instances (Groq)
   - Allows easy switching between different AI providers
   - Usage: `AIProviderFactory.create_provider("groq")`

2. **Singleton Pattern** (`config.py`, `database.py`)
   - Ensures single instance of configuration and database connections
   - Maintains connection pools efficiently
   - Usage: `get_settings()`, `db_connection.get_supabase_client()`

3. **Builder Pattern** (`patterns/builder.py`)
   - Constructs complex Recipe objects step by step
   - Provides fluent interface for recipe creation
   - Usage: `RecipeBuilder().set_title("...").add_ingredient("...").build()`

#### Structural Patterns (3)
4. **Adapter Pattern** (`patterns/adapter.py`)
   - Adapts Groq API responses to application models
   - Converts raw AI output to structured data
   - Usage: `GroqAPIAdapter(ai_provider).analyze_dish_nutrition()`

5. **Decorator Pattern** (`patterns/decorator.py`)
   - Adds caching functionality using Redis
   - Adds logging to functions
   - Usage: `@cache_result(ttl=3600)`, `@log_execution()`

6. **Facade Pattern** (`patterns/facade.py`)
   - Simplifies complex nutrition analysis operations
   - Provides unified interface for dish analysis and recipe generation
   - Usage: `NutritionAnalysisFacade().analyze_dish()`

#### Behavioral Patterns (3)
7. **Strategy Pattern** (`patterns/strategy.py`)
   - Implements different dietary restriction validation strategies
   - Allows dynamic switching between validation rules
   - Usage: `DietaryStrategyContext.validate_recipe(recipe, restrictions)`

8. **Observer Pattern** (`patterns/observer.py`)
   - Notifies subscribers about events (recipe creation, dish analysis)
   - Supports multiple observers (database logging, analytics, webhooks)
   - Usage: `event_publisher.subscribe(EventType.RECIPE_CREATED, observer)`

9. **Chain of Responsibility** (`patterns/chain_of_responsibility.py`)
   - Processes images through validation → resize → optimization pipeline
   - Each handler can process and pass to next handler
   - Usage: `image_pipeline.process_image(base64_image)`

10. **Template Method** (Implicit in Strategy Pattern)
    - Defines skeleton of dietary validation algorithm
    - Subclasses override specific steps

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Groq API**: AI-powered image analysis and text generation
- **Supabase**: PostgreSQL database with real-time capabilities
- **Redis**: Caching layer
- **Pillow**: Image processing

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Supabase Client**: Authentication and database

## 📦 Project Structure

```
nutrition-app-monolith/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py              # Configuration with Singleton pattern
│   ├── database.py            # Database connection with Singleton
│   ├── models.py              # Pydantic models
│   ├── schema.sql             # Supabase database schema
│   ├── requirements.txt       # Python dependencies
│   └── patterns/              # Design pattern implementations
│       ├── __init__.py
│       ├── factory.py         # Factory Pattern
│       ├── builder.py         # Builder Pattern
│       ├── adapter.py         # Adapter Pattern
│       ├── decorator.py       # Decorator Pattern
│       ├── facade.py          # Facade Pattern
│       ├── strategy.py        # Strategy Pattern
│       ├── observer.py        # Observer Pattern
│       └── chain_of_responsibility.py  # Chain Pattern
├── frontend/
│   ├── app/                   # Next.js App Router
│   ├── components/            # React components
│   ├── lib/                   # Utility functions
│   └── package.json           # Node dependencies
└── vercel.json                # Vercel deployment configuration
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Supabase account
- Groq API key
- Redis instance (optional for local development)

### Environment Setup

1. **Clone the repository**
```bash
cd nutrition-app-monolith
```

2. **Backend Setup**
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Database Setup**
- Go to your Supabase project
- Navigate to SQL Editor
- Run the contents of `backend/schema.sql`

### Configuration

Edit `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GROQ_API_KEY=your_groq_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Local Development

**Backend:**
```bash
cd backend
python main.py
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

**Frontend:**
```bash
cd frontend
npm run dev
# App available at http://localhost:3000
```

## 🌐 API Endpoints

### Dish Analysis
```
POST /api/analyze-dish
Body: {
  "image_data": "base64_encoded_image",
  "dietary_restrictions": ["vegan", "gluten_free"]
}
```

### Recipe Generation
```
POST /api/generate-recipe
Body: {
  "image_data": "base64_encoded_image",  // or
  "ingredients": ["chicken", "rice", "broccoli"],
  "dietary_restrictions": ["keto"],
  "preferred_cuisine": "Italian",
  "cooking_time_max": 45
}
```

### Recipe Validation
```
POST /api/validate-recipe
Body: {
  "recipe": { ... },
  "restrictions": ["vegan"]
}
```

### Get Recipes
```
GET /api/recipes?limit=10&offset=0&dietary_restrictions=vegan,gluten_free
```

### Get Recipe by ID
```
GET /api/recipes/{recipe_id}
```

### Dietary Restrictions List
```
GET /api/dietary-restrictions
```

## 🚢 Deployment to Vercel

### Prerequisites
- Vercel account
- GitHub repository

### Steps

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Vercel will detect Next.js automatically

2. **Configure Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables, add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The `vercel.json` file configures:
- Python backend as serverless function
- Next.js frontend
- API routing from `/api/*` to backend
- All other routes to frontend

## 📝 Design Pattern Examples

### Using Factory Pattern
```python
# Create AI provider
ai_provider = AIProviderFactory.create_provider("groq")
response = ai_provider.analyze_image(image_data, prompt)
```

### Using Builder Pattern
```python
# Build complex recipe
recipe = (RecipeBuilder()
    .set_title("Vegan Buddha Bowl")
    .add_ingredient("quinoa")
    .add_ingredient("chickpeas")
    .set_nutrition_info(calories=450, protein=15, carbs=60, fat=12)
    .add_dietary_restriction(DietaryRestriction.VEGAN)
    .build())
```

### Using Decorator Pattern
```python
@cache_result(ttl=3600, prefix="nutrition")
@log_execution(log_args=True)
def expensive_analysis(data):
    # This result will be cached for 1 hour
    return analyze(data)
```

### Using Strategy Pattern
```python
# Validate against dietary restrictions
result = DietaryStrategyContext.validate_recipe(
    recipe, 
    [DietaryRestriction.VEGAN, DietaryRestriction.GLUTEN_FREE]
)
```

### Using Observer Pattern
```python
# Subscribe to events
event_publisher.subscribe(
    EventType.RECIPE_CREATED, 
    EmailNotificationObserver()
)

# Publish events
event_publisher.notify(
    EventType.RECIPE_CREATED,
    {"recipe_id": "123", "title": "New Recipe"}
)
```

### Using Chain of Responsibility
```python
# Process image through pipeline
processed = image_pipeline.process_image(base64_image)
# Automatically: validates → resizes → optimizes
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📊 Database Schema

Key tables:
- `recipes`: Store generated and user recipes
- `dish_analyses`: Store dish analysis results
- `event_logs`: Store system events (Observer pattern)
- `user_preferences`: Store user dietary preferences
- `saved_recipes`: Store user's favorite recipes

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Authentication via Supabase Auth
- API keys stored as environment variables
- Input validation on all endpoints

## 🎓 Educational Purpose

This project demonstrates:
- ✅ Clean architecture principles
- ✅ 10 design patterns in real-world scenarios
- ✅ Monolith architecture
- ✅ Modern Python and TypeScript practices
- ✅ Cloud deployment (Vercel)
- ✅ Database design with Supabase
- ✅ AI integration (Groq)
- ✅ Real-time features
- ✅ Image processing pipeline
- ✅ Caching strategies

## 📚 Next Steps for Microservices Version

To convert to microservices:
1. Separate concerns into services:
   - Auth Service
   - Recipe Service
   - Nutrition Analysis Service
   - Image Processing Service
   - Notification Service
2. Add message queue (RabbitMQ)
3. Implement API Gateway
4. Add service discovery
5. Use Docker containers
6. Orchestrate with Kubernetes

## 🤝 Contributing

This is an educational project. Feel free to:
- Report issues
- Suggest improvements
- Add more design patterns
- Enhance features

## 📄 License

MIT License - feel free to use for learning and education

## 👤 Author

Created for ASS-PSS Project demonstrating monolith architecture with design patterns.

---

**Note**: This is the monolith version. The microservices version will be in a separate repository with distributed architecture.
