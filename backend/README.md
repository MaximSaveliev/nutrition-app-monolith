# Backend API - Nutrition App

FastAPI backend for AI-powered recipe and nutrition analysis application.

## Architecture & Design Patterns

This backend implements several design patterns for maintainability and scalability:

### Creational Patterns
- **Singleton Pattern**: Configuration (`config.py`) and Database Manager (`database.py`)
- **Factory Pattern**: Service creation functions (`get_auth_service`)

### Structural Patterns
- **Facade Pattern**: `AuthenticationService` simplifies complex Supabase operations
- **Adapter Pattern**: API client adapts fetch API to typed interface

### Behavioral Patterns
- **Chain of Responsibility**: Authentication middleware layers (`get_current_user` → `get_current_active_user`)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Settings (Singleton)
│   ├── database.py          # Database manager (Singleton)
│   ├── api/
│   │   ├── __init__.py
│   │   └── auth.py          # Authentication routes
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth_service.py  # Auth business logic (Facade)
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth.py          # Auth middleware (Chain of Responsibility)
│   └── schemas/
│       ├── __init__.py
│       └── auth.py          # Pydantic models (Builder)
├── api/
│   └── index.py             # Vercel entry point
├── requirements.txt
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Supabase anon/public key
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- `JWT_SECRET_KEY`: Secret key for JWT token generation (min 32 characters)

### 3. Run Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Access the API at `http://localhost:8000`
- API Documentation: `http://localhost:8000/api/v1/docs`
- Alternative Docs: `http://localhost:8000/api/v1/redoc`

## API Endpoints

### Authentication

#### POST `/api/v1/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "repeat_password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please check your email to confirm your account.",
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": null,
      "created_at": "2025-11-05T12:00:00Z"
    }
  }
}
```

#### POST `/api/v1/auth/login`
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2025-11-05T12:00:00Z",
    "created_at": "2025-11-05T12:00:00Z"
  }
}
```

#### GET `/api/v1/auth/me`
Get current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "email_confirmed_at": "2025-11-05T12:00:00Z",
  "created_at": "2025-11-05T12:00:00Z"
}
```

#### POST `/api/v1/auth/logout`
Logout user and invalidate session.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logout successful",
  "success": true
}
```

#### GET `/api/v1/auth/verify`
Verify token validity.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Token is valid",
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "email_confirmed_at": "2025-11-05T12:00:00Z",
      "created_at": "2025-11-05T12:00:00Z"
    }
  }
}
```

## Design Pattern Examples

### 1. Singleton Pattern (Configuration)
```python
# config.py
@lru_cache()
def get_settings() -> Settings:
    """Single instance of settings across the app"""
    return Settings()
```

### 2. Facade Pattern (Authentication Service)
```python
# services/auth_service.py
class AuthenticationService:
    """Simplifies complex Supabase auth operations"""
    async def register_user(self, signup_data: UserSignUpRequest):
        # Handles all registration complexity internally
        ...
```

### 3. Chain of Responsibility (Middleware)
```python
# middleware/auth.py
async def get_current_user(...):
    # First layer: Validate token
    ...

async def get_current_active_user(current_user=Depends(get_current_user)):
    # Second layer: Check if email is confirmed
    ...
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app tests/

# Specific test file
pytest tests/test_auth.py
```

## Deployment

### Vercel Deployment

The backend is configured to deploy on Vercel alongside the Next.js frontend.

1. Ensure `vercel.json` is properly configured (in root directory)
2. Set environment variables in Vercel dashboard
3. Deploy: `vercel --prod`

The API will be available at your domain under `/api` path.

### Environment Variables in Vercel

Add these in your Vercel project settings:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET_KEY`

## Future Enhancements

- [ ] Recipe CRUD operations
- [ ] Image upload and AI analysis (Groq integration)
- [ ] Nutrition calculation service
- [ ] Vector search for recipes (pgvector)
- [ ] Redis caching layer
- [ ] RabbitMQ async processing
- [ ] Rate limiting middleware
- [ ] Comprehensive test suite

## Contributing

1. Follow the established design patterns
2. Add docstrings to all functions
3. Include pattern comments for educational purposes
4. Write tests for new features
5. Update this README with new endpoints

## License

MIT
