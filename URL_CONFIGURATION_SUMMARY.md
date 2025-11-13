# URL Configuration - Production Ready Summary

## Overview
Replaced all hardcoded `http://localhost:8000` URLs throughout the frontend with dynamic, environment-aware configuration. The application now supports both local development and production deployment seamlessly.

## Changes Made

### 1. **Created Centralized Configuration** (`frontend/lib/config.ts`)
- **New file**: Centralized API URL configuration
- **Functions**:
  - `getApiUrl()`: Returns API URL based on environment (production uses `/api`, development uses full backend URL)
  - `getBackendUrl()`: Returns backend URL from environment variable or defaults to localhost
- **Exports**: `API_URL` and `BACKEND_URL` constants for easy import
- **Environment Variables Used**:
  - `NEXT_PUBLIC_BACKEND_URL`: Backend server URL (e.g., `http://localhost:8000`)
  - `NEXT_PUBLIC_API_URL`: Optional API endpoint override

### 2. **Updated Files** (9 files total)

#### Core Configuration
- **`next.config.ts`**: Updated rewrite rule to use dynamic `backendUrl` from environment variable

#### API Client & Components
- **`lib/api-client.ts`**: Replaced hardcoded URL constant with import from `config.ts` (2 instances)
- **`components/rate-limit-banner.tsx`**: Added import and replaced hardcoded fetch URL
- **`components/recipe-generator.tsx`**: Added import and replaced 2 hardcoded fetch URLs
- **`components/public-recipes.tsx`**: Added import and replaced hardcoded fetch URL
- **`contexts/auth-context.tsx`**: Added import and replaced hardcoded fetch URL

#### Already Environment-Aware (No changes needed)
- **`app/api/recipes/route.ts`**: ✅ Already uses `process.env.NEXT_PUBLIC_BACKEND_URL`
- **`app/api/recipes/[id]/route.ts`**: ✅ Already uses `process.env.NEXT_PUBLIC_BACKEND_URL`
- **`app/api/auth/me/route.ts`**: ✅ Already uses `process.env.NEXT_PUBLIC_BACKEND_URL`
- **`app/recipes/page.tsx`**: ✅ Already uses `process.env.NEXT_PUBLIC_BACKEND_URL`

### 3. **Environment Configuration**
- **Created**: `frontend/.env.example` - Template for environment variables
- **Updated**: `frontend/.env.local` - Added `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`

## Environment Variables

### Required
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # Development
# Or in production:
NEXT_PUBLIC_BACKEND_URL=https://api.yourapp.com  # Production backend
```

### Optional
```bash
NEXT_PUBLIC_API_URL=/api  # Override API endpoint (defaults to /api in production)
```

## How It Works

### Development Mode
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:8000`
- `API_URL` resolves to `http://localhost:8000/api`
- `BACKEND_URL` resolves to `http://localhost:8000`

### Production Mode (Vercel)
- Frontend deployed to Vercel
- Backend can be:
  - Deployed to Vercel as serverless functions
  - Separate backend server (set `NEXT_PUBLIC_BACKEND_URL` in Vercel env vars)
- `API_URL` resolves to `/api` (uses Next.js proxy/rewrite)
- `BACKEND_URL` resolves to `process.env.NEXT_PUBLIC_BACKEND_URL` or backend URL

## Code Patterns Used

### Before (Hardcoded)
```typescript
const response = await fetch("http://localhost:8000/api/recipes", {
  headers: { Authorization: `Bearer ${token}` }
});
```

### After (Dynamic)
```typescript
import { API_URL } from '@/lib/config';

const response = await fetch(`${API_URL}/recipes`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Benefits

1. **Environment Agnostic**: Works seamlessly in development, staging, and production
2. **Easy Configuration**: Change backend URL via single environment variable
3. **Type Safe**: TypeScript ensures proper imports and usage
4. **Centralized**: All URL logic in one place (`lib/config.ts`)
5. **Backward Compatible**: Defaults to `http://localhost:8000` if env var not set
6. **Production Ready**: Automatically uses relative `/api` in production for optimal performance

## Testing

### Build Status: ✅ PASSED
```bash
npm run build
# ✓ Compiled successfully in 4.7s
# ✓ Finished TypeScript in 5.3s
# ✓ Generating static pages (21/21)
```

### Local Testing
1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. All API calls route to `http://localhost:8000/api`

### Production Testing (Vercel)
1. Set `NEXT_PUBLIC_BACKEND_URL` in Vercel environment variables
2. Deploy: `vercel --prod`
3. API calls route through Next.js proxy to backend

## Migration Guide

### For Developers
1. Pull latest code
2. Copy `frontend/.env.example` to `frontend/.env.local`
3. Set `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
4. Run `npm run dev`

### For Production Deployment
1. Add environment variable in Vercel dashboard:
   - Key: `NEXT_PUBLIC_BACKEND_URL`
   - Value: Your backend URL (e.g., `https://api.yourapp.com`)
2. Deploy normally

## Files Summary

### New Files (2)
- `frontend/lib/config.ts` - Centralized URL configuration
- `frontend/.env.example` - Environment variable template

### Modified Files (10)
- `frontend/next.config.ts` - Dynamic rewrite destination
- `frontend/.env.local` - Added NEXT_PUBLIC_BACKEND_URL
- `frontend/lib/api-client.ts` - 2 URL replacements
- `frontend/components/rate-limit-banner.tsx` - 1 URL replacement
- `frontend/components/recipe-generator.tsx` - 2 URL replacements
- `frontend/components/public-recipes.tsx` - 1 URL replacement
- `frontend/contexts/auth-context.tsx` - 1 URL replacement

### Verified Files (4)
- `frontend/app/api/recipes/route.ts` - Already environment-aware ✅
- `frontend/app/api/recipes/[id]/route.ts` - Already environment-aware ✅
- `frontend/app/api/auth/me/route.ts` - Already environment-aware ✅
- `frontend/app/recipes/page.tsx` - Already environment-aware ✅

## Next Steps

1. ✅ All frontend URLs are now dynamic
2. ✅ Build passes successfully
3. ✅ Environment configuration documented
4. Ready for production deployment
5. Backend URL can be configured per environment without code changes

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │            lib/config.ts                          │   │
│  │  • getApiUrl()                                    │   │
│  │  • getBackendUrl()                                │   │
│  │  • API_URL (exported)                             │   │
│  │  • BACKEND_URL (exported)                         │   │
│  └──────────────────────────────────────────────────┘   │
│                         ↓                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Components & API Routes                   │   │
│  │  • api-client.ts                                  │   │
│  │  • rate-limit-banner.tsx                          │   │
│  │  • recipe-generator.tsx                           │   │
│  │  • public-recipes.tsx                             │   │
│  │  • auth-context.tsx                               │   │
│  │  • app/api/recipes/route.ts                       │   │
│  │  • app/api/auth/me/route.ts                       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
            NEXT_PUBLIC_BACKEND_URL
                    (env var)
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                      │
│                http://localhost:8000                     │
│              or https://api.yourapp.com                  │
└─────────────────────────────────────────────────────────┘
```

---
**Status**: ✅ COMPLETE - Production Ready
**Build**: ✅ PASSING - All 21 routes generated successfully
**Environment**: ✅ CONFIGURED - Development and production ready
