# Deployment Guide - Vercel

This guide walks you through deploying the Nutrition App monolith to Vercel.

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase project
- Groq API key
- Redis instance (optional, can use Upstash Redis free tier)

## Step 1: Prepare Your Repository

1. **Push to GitHub**:
```bash
cd nutrition-app-monolith
git init
git add .
git commit -m "Initial commit - Nutrition App Monolith"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nutrition-app-monolith.git
git push -u origin main
```

## Step 2: Setup Supabase

1. **Create Database Schema**:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy content from `backend/schema.sql`
   - Execute the SQL

2. **Get Supabase Credentials**:
   - Project URL: `Settings → API → Project URL`
   - Anon Key: `Settings → API → Project API keys → anon/public`
   - Service Role Key: `Settings → API → Project API keys → service_role`

## Step 3: Get Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Login
3. Create a new API key
4. Copy the key (you won't be able to see it again)

## Step 4: Setup Redis (Optional but Recommended)

### Option A: Upstash Redis (Free)

1. Go to [upstash.com](https://upstash.com)
2. Create account
3. Create Redis database
4. Get connection details:
   - Endpoint (host)
   - Port (usually 6379)
   - Password

### Option B: Skip Redis

If you skip Redis, caching won't work, but the app will still function.

## Step 5: Deploy to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"

2. **Import Repository**:
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**:
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: cd frontend && npm run build
   Output Directory: frontend/.next
   Install Command: cd frontend && npm install
   ```

4. **Environment Variables**:
   Click "Environment Variables" and add:
   
   ```
   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Groq AI
   GROQ_API_KEY=your_groq_api_key
   
   # Redis (Optional)
   REDIS_HOST=your-redis-host.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password
   
   # App Settings
   ENVIRONMENT=production
   DEBUG=False
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Method 2: Using Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login**:
```bash
vercel login
```

3. **Deploy**:
```bash
cd nutrition-app-monolith
vercel
```

4. **Add Environment Variables**:
```bash
# Add each variable
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add GROQ_API_KEY production
vercel env add REDIS_HOST production
vercel env add REDIS_PORT production
vercel env add REDIS_PASSWORD production
```

5. **Redeploy with env vars**:
```bash
vercel --prod
```

## Step 6: Configure Frontend Environment

1. In Vercel dashboard, add these additional frontend variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 7: Verify Deployment

1. **Check Health Endpoint**:
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected"
}
```

2. **Check API Documentation**:
   Visit: `https://your-app.vercel.app/api/docs`

3. **Test Frontend**:
   Visit: `https://your-app.vercel.app`

## Step 8: Configure Custom Domain (Optional)

1. In Vercel Dashboard:
   - Go to Project Settings
   - Click "Domains"
   - Add your custom domain
   - Follow DNS configuration instructions

## Troubleshooting

### Build Failures

**Python Dependencies Issue**:
```bash
# Make sure requirements.txt is correct
cd backend
pip install -r requirements.txt
```

**Next.js Build Issue**:
```bash
# Test build locally
cd frontend
npm run build
```

### Runtime Errors

**Check Logs**:
1. Vercel Dashboard → Your Project
2. Click "Functions" or "Logs"
3. Check for errors

**Common Issues**:

1. **Missing Environment Variables**:
   - Check all required env vars are set
   - Restart deployment after adding

2. **Database Connection Failed**:
   - Verify Supabase URL and keys
   - Check Supabase project is running

3. **Redis Connection Failed**:
   - Verify Redis credentials
   - If not using Redis, the app will still work (without caching)

4. **API Timeout**:
   - Vercel free tier has 10s function timeout
   - Groq API calls should complete within this
   - Consider upgrading for longer timeouts

### API Not Working

**Check Rewrites**:
Make sure `vercel.json` has correct routing:
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/main.py"
    }
  ]
}
```

**Check CORS**:
Backend should allow frontend domain:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your domain in production
    ...
)
```

## Performance Optimization

### 1. Enable Vercel Analytics
```bash
npm i @vercel/analytics
```

### 2. Configure Caching
Vercel automatically caches static assets. For API:
```python
# Add cache headers in FastAPI
from fastapi.responses import Response

@app.get("/api/recipes")
async def get_recipes():
    response = Response(...)
    response.headers["Cache-Control"] = "public, max-age=3600"
    return response
```

### 3. Image Optimization
Next.js automatically optimizes images. Use:
```tsx
import Image from 'next/image'

<Image src={src} alt={alt} width={500} height={300} />
```

## Monitoring

### Setup Monitoring

1. **Vercel Analytics** (Built-in):
   - Automatic in Vercel Pro
   - Shows traffic, performance

2. **Supabase Monitoring**:
   - Check DB performance in Supabase dashboard
   - Monitor API usage

3. **Custom Logging**:
   - Events logged to `event_logs` table
   - Query for analytics

## Scaling

### Free Tier Limits
- 100 GB bandwidth
- 100 GB-hours serverless function execution
- 6,000 build minutes

### If You Need More
1. **Upgrade Vercel Plan**:
   - Pro: $20/month
   - More bandwidth, faster builds

2. **Optimize**:
   - Use caching extensively
   - Implement rate limiting
   - Optimize images before upload

## Security Checklist

- ✅ Environment variables in Vercel (not in code)
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ Row Level Security enabled in Supabase
- ✅ API keys stored securely
- ✅ CORS configured properly
- ✅ Input validation on all endpoints

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys
```

### Preview Deployments
- Every PR gets a preview URL
- Test before merging to main
- Main branch deploys to production

## Cost Estimation

### Monthly Costs (Approximate)

**Minimal Usage** (Free Tier):
- Vercel: $0 (Hobby)
- Supabase: $0 (Free)
- Groq API: $0 (Free tier)
- Redis: $0 (Upstash free)
- **Total: $0/month**

**Production** (1000 users):
- Vercel Pro: $20
- Supabase: $25
- Groq API: ~$50 (depends on usage)
- Redis: $10
- **Total: ~$105/month**

## Next Steps

1. ✅ Deploy application
2. ✅ Test all features
3. ✅ Setup monitoring
4. ✅ Configure custom domain
5. 📝 Share with users
6. 📊 Monitor performance
7. 🔄 Iterate based on feedback

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Groq Docs: [console.groq.com/docs](https://console.groq.com/docs)

---

**Congratulations!** Your Nutrition App is now deployed and accessible worldwide! 🎉
