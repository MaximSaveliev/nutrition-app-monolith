# Copilot Instructions for Nutrition App Monolith

## Project Vision

**AI-Powered Recipe & Nutrition Application** where users can:
- 📸 **Photo Food Analysis**: Take a photo of a dish → AI calculates calories and nutrition specs
- 🥗 **Recipe Generation**: Photo ingredients → AI provides step-by-step cooking recipes
- 🍽️ **Dietary Restrictions**: Support custom dietary preferences and restrictions
- 🔍 **Smart Search**: Vector-based search for recipes and ingredients using Supabase pgvector

### Dual Implementation Strategy

This project will be implemented in **TWO architectures** (same functionality, different structure):
1. **Monolith** (current) - deployed on Vercel with Supabase template
2. **Microservices** (future) - separate services with message queue coordination

### Design Patterns Implementation (10 Total)

**3 Creational Patterns:**
- Factory Pattern (for creating different AI analysis types)
- Builder Pattern (for constructing complex recipe objects)
- Singleton Pattern (for database connections, Redis clients)

**3 Structural Patterns:**
- Adapter Pattern (for different AI providers - Groq, future alternatives)
- Decorator Pattern (for adding nutrition calculations, dietary filters)
- Facade Pattern (for simplified API interfaces to complex subsystems)

**3 Behavioral Patterns:**
- Strategy Pattern (for different image analysis strategies)
- Observer Pattern (for real-time recipe updates, notifications)
- Chain of Responsibility (for dietary restriction validation pipeline)

**+1 Bonus Pattern:**
- Repository Pattern (for data access abstraction)

## Architecture Overview

This is a **monolith project** with separate frontend and backend directories. The backend will use **Python FastAPI**, and the frontend is **Next.js 15+ App Router** with **Supabase** for auth/database, styled with **Tailwind CSS** and **shadcn/ui**.

### Technology Stack

**Backend:**
- Python FastAPI (REST API)
- Supabase (Postgres + Auth + Storage + pgvector)
- Redis (caching, session management)
- RabbitMQ (async task queue for AI processing)
- Groq API (AI/LLM for recipe generation and nutrition analysis)

**Frontend:**
- Next.js 15+ (App Router)
- Tailwind CSS + shadcn/ui
- Supabase Client (@supabase/ssr)

**Deployment:**
- Monolith: Vercel (Next.js + Serverless Functions for FastAPI)
- Database: Supabase (managed Postgres with extensions)
- Cache: Vercel KV (Redis) or Upstash
- Queue: CloudAMQP or self-hosted RabbitMQ

### Key Design Decisions

- **Middleware Pattern**: Uses `proxy.ts` instead of `middleware.ts` at root to handle Supabase auth session management
- **Cookie-Based Auth**: Supabase session managed via cookies using `@supabase/ssr` for seamless auth across Server Components, Client Components, and middleware
- **Three Supabase Clients**: Different clients for different contexts (see Supabase section below)
- **AI Processing**: Async via RabbitMQ to avoid timeout issues with image analysis
- **Vector Search**: Supabase pgvector extension for semantic recipe/ingredient search

## Critical Developer Workflows

### Development Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase credentials
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
# Copy .env.example to .env.local and add Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=[your-url]
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[your-key]
npm run dev  # Uses Turbopack by default
```

### Build & Deploy

**Backend:**
```bash
pytest  # Run tests
pytest --cov=app tests/  # With coverage
```

**Frontend:**
```bash
npm run build  # Production build
npm start      # Start production server
npm run lint   # ESLint check
```

**Full Stack (Vercel):**
- Configure `vercel.json` in root
- Set environment variables in Vercel dashboard
- Deploy: `vercel --prod`

## Supabase Integration Patterns

### Authentication Flow (Backend-Driven)

**NEW: FastAPI Backend Handles Auth**
- Authentication logic moved to `backend/app/services/auth_service.py`
- Frontend calls backend API endpoints instead of Supabase directly
- Backend uses Supabase Admin SDK for user management
- JWT tokens issued by Supabase, validated by backend

### Three Client Types (CRITICAL)

**Backend (Python FastAPI):**
1. **Standard Client**: For regular operations (anon key)
2. **Admin Client**: For privileged operations (service role key)
   - Located in `backend/app/database.py` (Singleton Pattern)

**Frontend (Next.js):**
1. **API Client**: Communicates with FastAPI backend
   - Located in `frontend/lib/api-client.ts` (Adapter Pattern)
  - All auth operations go through `/api/auth/*` endpoints
   
2. **Server Client** (`lib/supabase/server.ts`): For Server Components (if needed for direct DB access)
   - Uses `cookies()` from `next/headers`
   - ALWAYS call `await createClient()` - never store in global variable
   
3. **Middleware Client** (`lib/supabase/middleware.ts`): For session management
   - Called via `proxy.ts` (not standard `middleware.ts`)

### Authentication Flow

- **Sign up**: POST `/api/auth/signup` → Email confirmation required
- **Login**: POST `/api/auth/login` → Returns JWT token
- **Token Storage**: Frontend stores in localStorage/cookies
- **Protected routes**: Send token in `Authorization: Bearer <token>` header
- **Validation**: Backend middleware validates token via Supabase

### Auth Usage Examples

**Backend Service:**
```python
from app.services.auth_service import get_auth_service

auth_service = get_auth_service(db)
result = await auth_service.register_user(user_data)
```

**Frontend API Call:**
```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.login(email, password)
localStorage.setItem('access_token', response.access_token)
```

**Protected Backend Route:**
```python
from app.middleware.auth import get_current_user

@router.get("/protected")
async def protected_route(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}
```

## Component & Styling Conventions

### shadcn/ui Configuration

- **Style**: "new-york" variant
- **Base color**: neutral
- **Icon library**: lucide-react
- **Import path**: `@/components/ui/*`
- Add new components: `npx shadcn@latest add [component-name]`

### Component Patterns

- **Client components**: Mark with `"use client"` for interactivity (forms, buttons with onClick, state)
- **Server components**: Default in App Router - use for data fetching, auth checks
- **Utility function**: `cn()` from `lib/utils.ts` for conditional Tailwind classes

### Path Aliases

```typescript
"@/*" // Maps to frontend root: @/components, @/lib, @/app
```

## Project Structure Specifics

### Frontend Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-related routes (login, sign-up, etc.)
│   ├── protected/         # Protected route example with layout
│   └── layout.tsx         # Root layout with ThemeProvider
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── tutorial/          # Onboarding/tutorial components
│   └── *-form.tsx         # Auth form components (login, sign-up, etc.)
├── lib/
│   ├── supabase/          # Three Supabase client implementations
│   └── utils.ts           # cn() utility + hasEnvVars check
└── proxy.ts               # Middleware proxy (NOT middleware.ts!)
```

### Important Files

- **`proxy.ts`**: Supabase middleware integration - handles all requests except static assets
- **`lib/utils.ts`**: Contains `hasEnvVars` helper to check if Supabase is configured
- **`components.json`**: shadcn/ui configuration - defines aliases and component style

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Legacy ANON_KEY also works
```

Optional (Vercel):
```bash
VERCEL_URL=
VERCEL_ENV=
```

## Testing & Debugging

- **No test setup yet** - consider adding Vitest or Jest for testing
- **Auth issues**: Check `proxy.ts` middleware, verify `getClaims()` in protected routes
- **Session problems**: Ensure middleware returns `supabaseResponse` object unchanged (critical for cookie sync)

## Common Gotchas

1. **Middleware**: File is named `proxy.ts`, not `middleware.ts` - exports `proxy()` function and `config` object
2. **Server client**: Never cache in global - always `await createClient()` per request
3. **Auth redirects**: Now handled by backend API, not frontend middleware
4. **Environment check**: `hasEnvVars` from `lib/utils.ts` used throughout to show warnings when Supabase not configured
5. **Backend imports**: Always use absolute imports like `from app.services.auth_service import ...`
6. **Async operations**: All service methods are async, always use `await`

## Design Patterns Implementation

### Backend Patterns (Python FastAPI)

**1. Singleton Pattern** - `app/config.py`, `app/database.py`
```python
@lru_cache()
def get_settings() -> Settings:
    """Single instance across the app"""
    return Settings()
```
- Why: Expensive resources (DB connections, config) should be reused
- Usage: Config settings, database connections

**2. Facade Pattern** - `app/services/auth_service.py`
```python
class AuthenticationService:
    """Simplifies complex Supabase authentication operations"""
    async def register_user(self, signup_data):
        # Hides complexity of Supabase admin API
```
- Why: Simplifies complex subsystem interactions
- Usage: Auth service wraps Supabase complexity

**3. Chain of Responsibility** - `app/middleware/auth.py`
```python
async def get_current_user(...):  # Layer 1: Token validation
async def get_current_active_user(current_user=Depends(get_current_user)):  # Layer 2: Email confirmation
```
- Why: Allows flexible composition of authentication checks
- Usage: Middleware authentication layers

**4. Factory Pattern** - Service creation functions
```python
def get_auth_service(db: DatabaseManager) -> AuthenticationService:
    """Factory for creating auth service with dependencies"""
```
- Why: Clean dependency injection
- Usage: Creating service instances with dependencies

**5. Builder Pattern** - Pydantic Models in `app/schemas/auth.py`
```python
class UserSignUpRequest(BaseModel):
    email: EmailStr
    password: str
    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        # Build and validate complex objects
```
- Why: Type-safe data structures with validation
- Usage: Request/response models, DTOs

### Frontend Patterns (TypeScript/Next.js)

**6. Adapter Pattern** - `frontend/lib/api-client.ts`
```typescript
class APIClient {
    async login(email: string, password: string): Promise<LoginResponse> {
        // Adapts fetch API to typed interface
    }
}
```
- Why: Provides consistent interface for backend communication
- Usage: HTTP client wrapper

### Pattern Usage Guidelines

1. **Add pattern comments**: Comment class/function with pattern name and reason
2. **Real-world naming**: Use descriptive names (e.g., `AuthenticationService`, not `AuthFacade`)
3. **Pattern documentation**: Explain "why" not just "what" in docstrings
4. **Keep it simple**: Don't force patterns where they don't fit naturally

## Future Considerations

### Planned Features

**Phase 1 - Core Features:**
- Photo upload and AI-powered dish analysis (calories, macros, ingredients)
- Ingredient photo → recipe generation with step-by-step instructions
- User profiles with dietary preferences (vegan, gluten-free, keto, etc.)
- Recipe search with filters (cuisine, cooking time, difficulty)

**Phase 2 - Enhanced Features:**
- Recipe bookmarking and collections
- Meal planning calendar
- Nutrition tracking over time
- Social features (share recipes, rate dishes)
- Grocery list generation from recipes

**Phase 3 - Advanced Features:**
- Real-time cooking mode (voice-guided steps)
- Ingredient substitution suggestions
- Nutrition goal tracking and recommendations
- Recipe recommendations based on available ingredients
- Multi-language support

### Implementation Ideas

**AI/ML Enhancements:**
- Use Groq's vision models for accurate food recognition
- Implement RAG (Retrieval Augmented Generation) with pgvector for recipe suggestions
- Fine-tune prompts for consistent nutrition calculations
- Cache common dishes in Redis to reduce API calls

**Data Management:**
- Store recipe embeddings in Supabase pgvector for semantic search
- Use Redis for caching frequently accessed recipes and nutrition data
- Implement optimistic UI updates with React Query/SWR
- Background job processing with RabbitMQ for slow AI tasks

**User Experience:**
- Progressive Web App (PWA) for mobile camera access
- Image optimization and compression before upload
- Real-time progress updates during AI analysis
- Offline mode for saved recipes

**Performance Optimization:**
- Edge caching for common recipe queries
- Image CDN for uploaded photos (Supabase Storage)
- Database indexing for fast recipe lookups
- Redis caching layer for nutrition calculations

### Microservices Architecture (Future)

When transitioning to microservices, consider splitting into:
1. **Auth Service** - User authentication and authorization
2. **Recipe Service** - Recipe CRUD, search, and recommendations
3. **AI Service** - Image analysis, nutrition calculation, recipe generation
4. **Nutrition Service** - Dietary tracking, goals, and analytics
5. **Notification Service** - Email, push notifications
6. **API Gateway** - Central entry point, rate limiting, routing

### Backend Implementation Notes

- Backend directory is empty - will implement Python FastAPI REST API
- Consider using Pydantic for data validation and serialization
- Implement proper error handling and logging (structlog recommended)
- Use dependency injection for services (FastAPI's Depends)
- Add comprehensive API documentation with OpenAPI/Swagger
- Set up database migrations with Alembic
- Implement rate limiting to protect AI API quotas

### Testing Strategy

- **Backend**: pytest for unit and integration tests
- **Frontend**: Vitest for unit tests, Playwright for E2E
- **AI Testing**: Mock Groq API responses for deterministic tests
- **Load Testing**: k6 or Locust for performance testing
- Set up CI/CD with GitHub Actions
