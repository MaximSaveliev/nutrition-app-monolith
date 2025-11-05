# Quick Start Guide

Get the Nutrition App running locally in 5 minutes!

## Prerequisites

- Python 3.9+
- Node.js 18+
- Git

## 1. Clone & Setup

```bash
cd /path/to/nutrition-app-monolith
```

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Linux/Mac:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your credentials (see below)
```

### Get Your Credentials

**Supabase** (Free):
1. Go to [supabase.com](https://supabase.com)
2. Create account → New Project
3. Get URL and keys from Settings → API
4. Run `schema.sql` in SQL Editor

**Groq API** (Free):
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → Create API Key
3. Copy the key

**Redis** (Optional):
1. Use [Upstash](https://upstash.com) free tier
2. Or skip - app works without cache

### Edit `.env` file:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
GROQ_API_KEY=your_groq_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## 3. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Add Supabase env vars
# Create .env.local file:
echo "NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.local
```

## 4. Run the App

**Terminal 1 - Backend**:
```bash
cd backend
source venv/bin/activate  # if not already activated
python main.py
```

Backend runs at: `http://localhost:8000`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 5. Test It!

1. Open `http://localhost:3000`
2. Try "Dish Analyzer":
   - Upload a food photo
   - Select dietary restrictions
   - Click "Analyze Dish"
3. Try "Recipe Generator":
   - Enter ingredients: "chicken, rice, broccoli"
   - Click "Generate Recipe"

## 🎉 Success!

You should see:
- ✅ Backend API docs at `http://localhost:8000/docs`
- ✅ Frontend app at `http://localhost:3000`
- ✅ Dish analysis working
- ✅ Recipe generation working

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Should be 3.9+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Can't connect to Supabase
- Check URL and keys are correct
- Verify Supabase project is active
- Run schema.sql if not done yet

### Groq API errors
- Verify API key is valid
- Check you have credits (free tier includes credits)
- Try generating a new key

## Next Steps

1. ✅ Read [README.md](./README.md) for full documentation
2. ✅ Check [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md) to understand the code
3. ✅ Review [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to Vercel
4. ✅ Explore the code in `backend/patterns/` folder

## Common Commands

```bash
# Backend
python main.py                 # Run server
pip install -r requirements.txt  # Install deps

# Frontend  
npm run dev                    # Development
npm run build                  # Build for production
npm run start                  # Run production build

# Database
# Run in Supabase SQL Editor
psql < backend/schema.sql      # Setup schema
```

## Need Help?

- Check health endpoint: `http://localhost:8000/health`
- View API docs: `http://localhost:8000/docs`
- Check logs in terminal
- Review error messages

---

**Ready to Deploy?** See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Want to Learn More?** See [DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md)
