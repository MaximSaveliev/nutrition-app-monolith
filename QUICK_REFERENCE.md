# 🚀 Quick Reference Card

## Installation Commands

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR: venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

**Already installed:**
- ✅ @radix-ui/react-progress
- ✅ @radix-ui/react-tabs
- ✅ @radix-ui/react-checkbox
- ✅ @radix-ui/react-select

## Environment Variables

### Backend `.env`
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GROQ_API_KEY=gsk_...
JWT_SECRET_KEY=your-secret-min-32-chars
```

### Frontend `.env.local`
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Start Servers

### Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
**URL:** http://localhost:8000
**Docs:** http://localhost:8000/docs

### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
**URL:** http://localhost:3000

## Database Setup

1. **Go to Supabase SQL Editor**
2. **Run migration:**
   ```sql
   -- Copy content from: backend/migrations/001_initial_schema.sql
   ```
3. **Create storage bucket:**
   - Name: `food-images`
   - Public: ✅ YES
   - Max size: 10MB

## Test URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/docs
- **Sign Up:** http://localhost:3000/auth/sign-up
- **Login:** http://localhost:3000/auth/login
- **Dashboard:** http://localhost:3000/dashboard

## Key Features

### 📸 Analyze Dish
1. Upload food photo
2. AI analyzes nutrition
3. Log meal (breakfast/lunch/dinner/snack)

### 🥗 Generate Recipe
1. Enter ingredients
2. Select cuisine & dietary restrictions
3. AI generates full recipe
4. Save as public/private

### 📊 My Stats
1. View daily calorie/macro totals
2. See progress bars
3. Review meal history

## Design Patterns (10 Total)

| Pattern | File | Use Case |
|---------|------|----------|
| **Strategy** | `ai_service.py` | 3 AI strategies |
| **Observer** | `nutrition_service.py` | Meal notifications |
| **Repository** | `recipe_repository.py` | Data access |
| **Decorator** | `image_service.py` | Image validation |
| **Singleton** | `config.py` | Single config |
| **Factory** | `get_*()` functions | Service creation |
| **Facade** | `auth_service.py` | Auth simplification |
| **Builder** | `schemas/*.py` | Pydantic models |
| **Chain** | `middleware/auth.py` | Auth layers |
| **Adapter** | `api-client.ts` | API wrapper |

## API Endpoints

### Nutrition
- `POST /api/nutrition/upload-dish-image`
- `POST /api/nutrition/analyze-dish`
- `POST /api/nutrition/log-meal`
- `GET /api/nutrition/daily-log`

### Recipes
- `POST /api/recipes/generate`
- `POST /api/recipes`
- `GET /api/recipes`
- `GET /api/recipes/{id}`
- `PUT /api/recipes/{id}`
- `DELETE /api/recipes/{id}`

## Component Files

### Frontend
- `components/dish-analyzer.tsx` - Photo analysis
- `components/recipe-generator.tsx` - Recipe generation
- `components/nutrition-dashboard.tsx` - Daily stats
- `app/dashboard/page.tsx` - Main dashboard
- `lib/api-client.ts` - API integration

### Backend
- `services/ai_service.py` - Groq AI integration
- `services/nutrition_service.py` - Meal tracking
- `services/image_service.py` - Image processing
- `repositories/recipe_repository.py` - Data access
- `api/nutrition.py` - Nutrition endpoints
- `api/recipes.py` - Recipe endpoints

## Troubleshooting

### Backend won't start
```bash
# Check venv is activated
which python  # Should show path to venv

# Reinstall packages
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

### Database errors
- Run migration in Supabase SQL Editor
- Check RLS policies are enabled
- Verify credentials in `.env`

### API 401 Errors
- Clear localStorage
- Login again
- Check JWT token is present

## Documentation Files

📖 **README.md** - Project overview
📐 **ARCHITECTURE.md** - System design
🛠️ **SETUP.md** - Detailed setup guide
📋 **IMPLEMENTATION_SUMMARY.md** - What's built
📌 **QUICK_REFERENCE.md** - This file

## Testing Commands

```bash
# Backend tests (when implemented)
cd backend
pytest
pytest --cov=app tests/

# Frontend lint
cd frontend
npm run lint

# Build production
npm run build
```

## Deployment

**Vercel** (recommended):
```bash
vercel --prod
```

Set environment variables in Vercel dashboard.

---

**Need Help?** Check SETUP.md for detailed instructions.
