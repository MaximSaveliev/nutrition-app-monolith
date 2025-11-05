# Nutrition App - Monolith Architecture

AI-Powered Recipe & Nutrition Analysis Application built with FastAPI backend and Next.js frontend.

## 🎯 Project Overview

This application allows users to:
- 📸 Take photos of dishes to get AI-calculated calories and nutrition specs
- 🥗 Upload ingredient photos to receive step-by-step cooking recipes
- 🍽️ Set dietary restrictions and preferences (vegan, gluten-free, keto, etc.)
- 🔍 Search recipes using vector-based semantic search

## 🏗️ Architecture

**Monolith deployment** on Vercel with:
- **Backend**: Python FastAPI + Supabase + Redis + RabbitMQ
- **Frontend**: Next.js 15+ App Router + Tailwind CSS + shadcn/ui
- **AI**: Groq API for recipe generation and nutrition analysis
- **Database**: Supabase (Postgres + Auth + Storage + pgvector)

## 📐 Design Patterns (10 Implemented)

### Creational (3)
1. **Singleton** - Configuration and Database Manager
2. **Factory** - Service creation functions
3. **Builder** - Pydantic models with validation

### Structural (3)
4. **Facade** - Authentication service simplifying Supabase operations
5. **Adapter** - API client adapting fetch to typed interface
6. **Decorator** - (Planned) Nutrition calculation decorators

### Behavioral (3)
7. **Chain of Responsibility** - Authentication middleware layers
8. **Strategy** - (Planned) Different image analysis strategies
9. **Observer** - (Planned) Real-time recipe updates

### Bonus (1)
10. **Repository** - (Planned) Data access abstraction

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- Git

### Automated Setup

```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

**1. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload --port 8000
```

**2. Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

**3. Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/v1/docs

## 📁 Project Structure

```
nutrition-app-monolith/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── services/       # Business logic (Facade)
│   │   ├── middleware/     # Auth middleware (Chain of Responsibility)
│   │   ├── schemas/        # Pydantic models (Builder)
│   │   ├── config.py       # Settings (Singleton)
│   │   ├── database.py     # DB manager (Singleton)
│   │   └── main.py         # Application entry
│   ├── tests/              # Unit & integration tests
│   ├── requirements.txt
│   └── README.md
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities & API client (Adapter)
│   └── package.json
├── vercel.json            # Vercel deployment config
└── README.md              # This file
```

## 🔑 Environment Variables

### Backend (.env)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET_KEY=your_jwt_secret_min_32_chars
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
GROQ_API_KEY=your_groq_api_key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 🔒 Authentication Flow

1. User signs up via frontend form
2. Frontend sends request to `/api/v1/auth/signup`
3. Backend creates user in Supabase
4. User receives email confirmation
5. User logs in via `/api/v1/auth/login`
6. Backend returns JWT token
7. Frontend stores token in localStorage
8. Protected requests include `Authorization: Bearer <token>` header
9. Backend middleware validates token

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest
pytest --cov=app tests/  # With coverage

# Frontend tests (when implemented)
cd frontend
npm test
```

## 🚢 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

The backend and frontend are deployed together using `vercel.json` configuration.

## 📚 API Documentation

Once the backend is running, access interactive API documentation:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

### Key Endpoints

- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/verify` - Verify token

## 🎨 Design Pattern Examples

### Singleton Pattern
```python
# config.py - Single instance of settings
@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### Facade Pattern
```python
# services/auth_service.py - Simplifies Supabase auth
class AuthenticationService:
    async def register_user(self, signup_data):
        # Handles complex Supabase operations
```

### Chain of Responsibility
```python
# middleware/auth.py - Layered validation
async def get_current_user(...):  # Token validation
async def get_current_active_user(...):  # Email confirmation
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI 0.115+
- **Database**: Supabase (PostgreSQL + pgvector)
- **Cache**: Redis
- **Queue**: RabbitMQ
- **AI**: Groq API
- **Testing**: pytest

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: JWT tokens
- **State**: React hooks
- **HTTP Client**: Fetch API with TypeScript wrapper

## 📝 Development Guidelines

1. **Backend**: Follow PEP 8, add docstrings, comment design patterns
2. **Frontend**: Use TypeScript, follow Next.js conventions
3. **Patterns**: Document which pattern and why in comments
4. **Testing**: Write tests for new features
5. **Commits**: Use conventional commits (feat:, fix:, docs:, etc.)

## 🗺️ Roadmap

### Phase 1 - Core Features ✅
- [x] User authentication (signup/login)
- [x] JWT token management
- [x] Backend API structure
- [ ] Photo upload functionality
- [ ] AI dish analysis
- [ ] Recipe generation

### Phase 2 - Enhanced Features
- [ ] Recipe bookmarking
- [ ] Meal planning
- [ ] Nutrition tracking
- [ ] Social features
- [ ] Grocery lists

### Phase 3 - Advanced Features
- [ ] Real-time cooking mode
- [ ] Ingredient substitutions
- [ ] Nutrition goals
- [ ] Multi-language support
- [ ] Mobile PWA

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.com/)
- AI powered by [Groq](https://groq.com/)

## 📧 Contact

For questions or issues, please open a GitHub issue.

---

**Note**: This is the monolith implementation. A microservices version with separate services for Auth, Recipes, AI, and Nutrition is planned for Phase 2.
