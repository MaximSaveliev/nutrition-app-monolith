# Database Setup Complete ✅

## What Was Done

### 1. ✅ Created Nutrition Repository
**File**: `backend/app/repositories/nutrition_repository.py`

**Features**:
- `log_scanned_dish()` - Saves analyzed dishes to database
- `get_user_dishes()` - Retrieves user's scanned dishes with filters
- `get_daily_summary()` - Aggregates nutrition data for a specific day
- `delete_scanned_dish()` - Removes scanned dish entries
- **Pattern**: Repository pattern for clean data access layer

### 2. ✅ Migration Ready
**File**: `backend/migrations/001_initial_schema.sql`

**Tables Created**:
- `users` - Extended user profiles (dietary preferences, goals)
- `recipes` - User-created and AI-generated recipes
- `scanned_dishes` - Nutrition tracking from photo analysis

**Security**:
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Public recipes viewable by everyone
- Indexes for optimized queries

### 3. ✅ Recipe API Updated
**File**: `backend/app/api/recipes.py`

**New Endpoint**: `POST /api/recipes/generate-and-save`
- Generates recipe from ingredients (text or image)
- **Saves to database** for authenticated users
- Anonymous users can generate but can't save
- Returns full `RecipeResponse` with database ID

**Existing Endpoints**:
- `POST /api/recipes/generate-from-input` - Still works (no DB save)
- `POST /api/recipes` - Create recipe manually
- `GET /api/recipes` - List recipes with filters
- `GET /api/recipes/{id}` - Get specific recipe
- `PUT /api/recipes/{id}` - Update recipe
- `DELETE /api/recipes/{id}` - Delete recipe

### 4. ✅ Nutrition API Updated
**File**: `backend/app/api/nutrition.py`

**Enhanced Endpoint**: `POST /api/nutrition/analyze-and-log-dish`
- Analyzes dish photo with AI
- **Automatically saves to database** if user authenticated
- Optional image upload to Supabase Storage
- Anonymous users get analysis but no history
- Non-blocking: Returns analysis even if DB save fails

**Behavior**:
- **Anonymous**: Analysis only (no database save)
- **Authenticated**: Analysis + automatic database save
- Image uploaded to `scanned_dishes/{user_id}/{filename}`

## How to Apply Migration

### Step-by-Step:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   ```bash
   # Copy the entire content from:
   backend/migrations/001_initial_schema.sql
   ```

4. **Run Migration**
   - Paste into SQL editor
   - Click "Run" button
   - Wait for "Success" message

5. **Verify Tables Created**
   - Go to "Table Editor" in sidebar
   - Should see: `users`, `recipes`, `scanned_dishes`

## Testing the Database

### Test Recipe Saving:

```bash
# 1. Register a user (if not already)
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "Test",
    "last_name": "User"
  }'

# 2. Login to get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 3. Generate and save a recipe
curl -X POST http://localhost:8000/api/recipes/generate-and-save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "ingredients_text": "chicken, rice, vegetables",
    "cuisine_preference": "italian",
    "servings": 4
  }'

# 4. Check Supabase Table Editor - you should see the recipe!
```

### Test Nutrition Tracking:

```bash
# Analyze a dish photo (with authentication to save)
curl -X POST http://localhost:8000/api/nutrition/analyze-and-log-dish \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/dish_photo.jpg" \
  -F "meal_type=lunch"

# Check Supabase Table Editor -> scanned_dishes table
```

## Database Schema Overview

### `users` Table
```sql
- id (UUID, references auth.users)
- first_name, last_name
- dietary_restrictions (TEXT[])
- preferred_cuisines (TEXT[])
- spice_preference
- daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal
- created_at, updated_at
```

### `recipes` Table
```sql
- id (UUID, primary key)
- author_id (UUID, references auth.users)
- title, description
- ingredients (JSONB) - array of {name, quantity, unit}
- steps (JSONB) - array of {step_number, instruction}
- cuisine_type, dietary_restrictions, spice_level, difficulty
- prep_time_minutes, cook_time_minutes, servings
- nutrition (JSONB) - calories, protein, carbs, fat, etc.
- is_public (BOOLEAN)
- image_url
- created_at, updated_at
```

### `scanned_dishes` Table
```sql
- id (UUID, primary key)
- user_id (UUID, references auth.users)
- dish_name
- nutrition (JSONB) - full nutrition breakdown
- meal_type (breakfast, lunch, dinner, snack)
- image_url
- confidence_score (0.00 to 1.00)
- scanned_at (timestamp)
```

## Key Features

### 🔒 Security (RLS Policies)
- Users can only view/edit their own data
- Public recipes visible to everyone
- Anonymous users blocked from database writes

### ⚡ Performance
- Indexes on frequently queried fields
- JSONB for flexible nested data
- Efficient foreign key relationships

### 🎯 Rate Limiting
- Anonymous: 3 free requests per 24 hours
- Authenticated: Unlimited requests
- Redis-backed persistence

### 📊 Data Integrity
- ON DELETE CASCADE for user cleanup
- NOT NULL constraints on critical fields
- Proper timestamps (created_at, updated_at)

## Next Steps

1. **Apply Migration** (see instructions above)
2. **Test Endpoints** with authenticated requests
3. **Verify Data** in Supabase Table Editor
4. **Monitor Logs** for any errors
5. **Optional**: Set up automated backups in Supabase dashboard

## Troubleshooting

### Migration Fails?
- Check if tables already exist (drop them first)
- Verify Supabase project is active
- Ensure `uuid-ossp` extension is enabled

### RLS Blocking Queries?
- Verify user is authenticated
- Check token is valid
- Ensure user ID matches auth.uid()

### Data Not Saving?
- Check backend logs for errors
- Verify SUPABASE_URL and SUPABASE_KEY in .env
- Ensure migration was applied successfully
- Check Supabase dashboard -> Logs for RLS violations

## Files Modified

1. ✅ `backend/app/repositories/nutrition_repository.py` (NEW)
2. ✅ `backend/app/api/recipes.py` (Updated - added generate-and-save endpoint)
3. ✅ `backend/app/api/nutrition.py` (Updated - auto-save on analysis)
4. ✅ `backend/test_database_connection.py` (NEW - testing script)
5. ✅ `backend/migrations/001_initial_schema.sql` (Already existed - ready to apply)

---

**Status**: ✅ All code changes complete. Ready to apply migration and test!
