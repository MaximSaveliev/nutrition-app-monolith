# 🚀 Complete Setup Guide

## Prerequisites Checklist

- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm or yarn package manager
- [ ] Git installed
- [ ] Supabase account created
- [ ] Groq API key obtained

## Step-by-Step Setup

### 1. Clone Repository

```bash
cd ~/University/ASS-PSS\ Project
git clone <your-repo-url> nutrition-app-monolith
cd nutrition-app-monolith
```

### 2. Backend Setup

#### 2.1 Create Virtual Environment

```bash
cd backend
python3 -m venv venv

# Activate (choose based on OS):
source venv/bin/activate              # Linux/Mac
# OR
venv\Scripts\activate                 # Windows CMD
# OR
source venv/Scripts/activate          # Windows Git Bash
```

You should see `(venv)` in your terminal prompt.

#### 2.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected packages:**
- fastapi==0.115.0
- uvicorn[standard]==0.32.0
- supabase==2.9.0
- pydantic==2.9.0
- python-jose[cryptography]==3.3.0
- passlib[bcrypt]==1.7.4
- python-multipart==0.0.12
- groq==0.11.0
- pillow==11.0.0
- pytest==8.3.0

#### 2.3 Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or vim, code, etc.
```

**Required values:**
```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GROQ_API_KEY=gsk_...
```

**Where to find:**
1. **Supabase credentials**:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Settings → API
   - Copy: URL, anon/public key, service_role key

2. **Groq API key**:
   - Go to https://console.groq.com
   - Create account (free tier available)
   - API Keys → Create new key
   - Copy the key (starts with `gsk_`)

### 3. Database Setup

#### 3.1 Apply Migration to Supabase

1. Open Supabase dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Click "New Query"
4. Copy the entire content of `backend/migrations/001_initial_schema.sql`
5. Paste into SQL Editor
6. Click **Run** (or press Ctrl+Enter)

**Expected tables created:**
- `recipes` - User-created recipes
- `nutrition_logs` - Daily meal tracking
- `user_preferences` - Dietary restrictions

#### 3.2 Create Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click **Create Bucket**
3. Settings:
   - Name: `food-images`
   - Public bucket: ✅ **YES**
   - File size limit: `10485760` (10MB)
   - Allowed MIME types: `image/jpeg,image/png,image/webp`
4. Click **Create Bucket**

### 4. Frontend Setup

#### 4.1 Install Dependencies

```bash
cd ../frontend  # From backend directory

npm install
```

**Expected packages:**
- next 15.1.4
- react 19.0.0
- tailwindcss 3.4.1
- @supabase/ssr 0.6.1
- @radix-ui/react-* (for UI components)

#### 4.2 Configure Environment

```bash
# Copy example
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**Required values:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Note:** Use the same Supabase URL and **anon key** (not service role key) from backend.

### 5. Start Development Servers

#### 5.1 Terminal 1 - Backend

```bash
cd backend
source venv/bin/activate  # Activate venv if not already
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Verify:** Open http://localhost:8000/docs (should see Swagger UI)

#### 5.2 Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 15.1.4
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Starting...
✓ Ready in 2.5s
```

**Verify:** Open http://localhost:3000 (should see landing page)

### 6. Test the Application

#### 6.1 Create Test User

1. Go to http://localhost:3000/auth/sign-up
2. Fill in:
   - Email: `test@example.com`
   - Password: `Test123!@#` (min 8 chars)
3. Click **Sign Up**
4. Check email for confirmation link
5. Click confirmation link

#### 6.2 Login

1. Go to http://localhost:3000/auth/login
2. Enter credentials
3. Click **Login**
4. Should redirect to `/dashboard`

#### 6.3 Test Features

**Test 1: Analyze Dish**
1. Go to Dashboard → "📸 Analyze Dish" tab
2. Click "Choose File" and select a food image
3. Click "Analyze Dish"
4. Should see:
   - Dish name detected
   - Nutrition info (calories, protein, carbs, fat)
   - Confidence score
5. Click "Log as Lunch"
6. Should see success message

**Test 2: Generate Recipe**
1. Go to Dashboard → "🥗 Generate Recipe" tab
2. Enter ingredients: "chicken, rice, broccoli"
3. Press Enter or click Add after each
4. Select cuisine: "American"
5. Check dietary restrictions if needed
6. Select spice level: "Medium"
7. Click "Generate Recipe"
8. Should see:
   - Recipe title and description
   - Full ingredients list
   - Step-by-step instructions
   - Nutrition per serving
9. Click "Save as Public Recipe"
10. Should see success message

**Test 3: View Stats**
1. Go to Dashboard → "📊 My Stats" tab
2. Should see:
   - Today's date
   - Calorie progress bar
   - Macro progress bars (Protein, Carbs, Fat)
   - Meal history list

### 7. Troubleshooting

#### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'groq'`
```bash
cd backend
source venv/bin/activate
pip install groq pillow
```

**Problem:** `supabase.errors.SupabaseException: Invalid API key`
- Check `.env` file has correct keys
- Verify no extra spaces in .env values
- Ensure using service_role key for backend

**Problem:** Port 8000 already in use
```bash
# Find process using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or use different port
uvicorn app.main:app --reload --port 8001
```

#### Frontend Issues

**Problem:** `Cannot find module '@radix-ui/react-progress'`
```bash
cd frontend
npm install @radix-ui/react-progress @radix-ui/react-tabs @radix-ui/react-checkbox @radix-ui/react-select
```

**Problem:** `NEXT_PUBLIC_SUPABASE_URL is not defined`
- Ensure `.env.local` exists in `frontend/` directory
- Restart Next.js dev server (Ctrl+C, then `npm run dev`)
- Verify environment variables start with `NEXT_PUBLIC_`

**Problem:** 401 Unauthorized on API calls
- Check localStorage has `access_token` (DevTools → Application → Local Storage)
- Try logging out and logging in again
- Verify JWT_SECRET_KEY is same on backend and matches Supabase settings

#### Database Issues

**Problem:** Table `recipes` does not exist
- Re-run migration in Supabase SQL Editor
- Check for SQL errors in output
- Verify you're in correct Supabase project

**Problem:** RLS policy prevents access
- In Supabase, go to Authentication → Policies
- Ensure policies are enabled for `recipes`, `nutrition_logs`, `user_preferences`
- Check policy conditions match your use case

### 8. Verify Installation

Run this checklist to ensure everything works:

```bash
# Backend health check
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Backend API docs accessible
curl http://localhost:8000/docs
# Expected: HTML page

# Frontend running
curl http://localhost:3000
# Expected: HTML page

# Test backend endpoint
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"Test123!@#"}'
# Expected: JSON with user data or error if already exists
```

### 9. Next Steps

- [ ] Read `ARCHITECTURE.md` to understand the system design
- [ ] Review design patterns in backend code
- [ ] Explore API documentation at http://localhost:8000/docs
- [ ] Customize nutrition goals in user preferences
- [ ] Test AI features with real food images
- [ ] Review frontend components in `frontend/components/`

### 10. Development Workflow

**Daily Development:**

1. Start backend:
   ```bash
   cd backend && source venv/bin/activate && uvicorn app.main:app --reload
   ```

2. Start frontend (new terminal):
   ```bash
   cd frontend && npm run dev
   ```

3. Make changes to code
4. Backend auto-reloads on file changes
5. Frontend hot-reloads on file changes
6. Test in browser at http://localhost:3000

**Before committing:**
```bash
# Format backend code
cd backend
black app/
isort app/

# Lint frontend
cd frontend
npm run lint

# Run tests
cd backend
pytest
```

### 11. Production Deployment

See `README.md` section "🌐 Deployment" for:
- Vercel deployment instructions
- Environment variable configuration
- Database migration on production
- Monitoring and logging setup

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review API docs at http://localhost:8000/docs
3. Check browser console for frontend errors
4. Check terminal output for backend errors
5. Review Supabase logs in dashboard

## ✅ Installation Complete!

You should now have:
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:3000
- ✅ Database configured in Supabase
- ✅ Storage bucket created
- ✅ Test user account working
- ✅ All features functional

Happy coding! 🎉
