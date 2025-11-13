# Production Deployment Guide

## Fixed Issues

### ✅ Recipe Page 404 Error - FIXED
**Problem**: Production showed 404 when accessing recipe detail pages
**Cause**: API routes were using localhost URL in production
**Solution**: Updated API routes to use environment variables with proper fallbacks

### ✅ Dynamic URL Configuration - FIXED
**Problem**: Recipes page referenced `http://localhost:8000` in production
**Cause**: Used `BACKEND_URL` constant instead of dynamic `API_URL`
**Solution**: Replaced with `API_URL` from `lib/config.ts` which auto-detects current origin

## Deployment Checklist

### 1. Frontend (Vercel)

**Environment Variables to Set:**
```bash
NEXT_PUBLIC_BACKEND_URL=<your-backend-url>
```

**Examples:**
- Same repo backend: `https://your-app.vercel.app`
- Separate backend: `https://api.yourapp.com`
- Development: `http://localhost:8000` (automatic fallback)

**Deploy Command:**
```bash
cd frontend
vercel --prod
```

### 2. Backend (FastAPI)

If deploying backend separately, you need to configure CORS to allow your frontend domain.

**Update `backend/app/main.py`:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://your-app.vercel.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Database (Supabase)

No changes needed - already configured via environment variables.

## How It Works

### Client-Side (Browser)
```typescript
// Automatically uses current domain
API_URL = window.location.origin + "/api"
// Development: http://localhost:3000/api
// Production: https://your-app.vercel.app/api
```

### Server-Side (Next.js API Routes)
```typescript
// Uses environment variable
BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
// Development: http://localhost:8000
// Production: YOUR_BACKEND_URL (from Vercel env vars)
```

### Request Flow

**Development:**
```
Browser → http://localhost:3000/api/recipes
         ↓ (Next.js API route)
         → http://localhost:8000/api/recipes (FastAPI backend)
```

**Production:**
```
Browser → https://your-app.vercel.app/api/recipes
         ↓ (Next.js API route)
         → NEXT_PUBLIC_BACKEND_URL/api/recipes (FastAPI backend)
```

## Files Changed

1. **`app/recipes/page.tsx`**
   - Changed: `const BACKEND_URL = ...` → Import `API_URL` from config
   - Changed: `${BACKEND_URL}/api/recipes` → `${API_URL}/recipes`

2. **`lib/config.ts`**
   - Updated: `API_URL` to use `window.location.origin + "/api"`
   - Pattern: Same as working SignUp implementation

3. **API Routes** (Added logging and better fallbacks):
   - `app/api/recipes/route.ts`
   - `app/api/recipes/[id]/route.ts`
   - `app/api/auth/me/route.ts`

## Testing

### Local Testing
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Test URLs:**
- ✅ http://localhost:3000/recipes
- ✅ http://localhost:3000/recipes/[some-id]
- ✅ Recipe list should show "Community" and "My Recipes" tabs

### Production Testing

After deployment to Vercel:
1. ✅ Visit `/recipes` - Should load recipe list
2. ✅ Click on a recipe - Should show recipe details (no 404)
3. ✅ Check browser console - Should NOT see `http://localhost:8000` in network tab
4. ✅ Toggle "Community" / "My Recipes" - Should fetch from production backend

## Troubleshooting

### Issue: Recipe page shows 404 in production

**Check:**
1. Is `NEXT_PUBLIC_BACKEND_URL` set in Vercel environment variables?
2. Is the backend URL accessible from Vercel servers?
3. Check Vercel logs for API route errors

**Fix:**
```bash
# In Vercel dashboard
Settings → Environment Variables
Add: NEXT_PUBLIC_BACKEND_URL = https://your-backend-url.com
```

### Issue: Network requests show localhost in production

**Check:**
1. Open browser DevTools → Network tab
2. Look for requests to `http://localhost:8000`

**Should see:**
- Client requests: `https://your-app.vercel.app/api/*`
- NOT: `http://localhost:8000/api/*`

**If you see localhost:**
- Clear cache and hard reload (Ctrl+Shift+R)
- Verify you're using `API_URL` from `lib/config.ts`, not hardcoded URLs

### Issue: CORS errors

**Backend logs show:** `CORS policy blocked`

**Fix:** Update `backend/app/main.py` CORS configuration to include your Vercel domain

## Monitoring

Add these console logs to track requests:

```typescript
// In components that fetch data
console.log(`Fetching from: ${API_URL}/recipes`);
```

Check Vercel logs:
```bash
vercel logs your-deployment-url
```

## Environment Variables Summary

### Required for Production
```env
# In Vercel
NEXT_PUBLIC_BACKEND_URL=https://your-backend.com

# In Backend (if separate)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Optional
```env
# Development only (automatic fallback)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## ✅ Status

- [x] Recipe 404 error fixed
- [x] Dynamic URL configuration implemented
- [x] Client-side auto-detects origin
- [x] Server-side uses environment variables
- [x] Build passing
- [x] Logging added for debugging

**Ready for production deployment!** 🚀
