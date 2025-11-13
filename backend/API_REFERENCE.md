# API Endpoints Reference

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}

Response: 201 Created
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

---

## 🍳 Recipe Endpoints

### Generate Recipe (No Save)
```http
POST /api/recipes/generate-from-input
Authorization: Bearer {token} (OPTIONAL - for authenticated users)
Content-Type: application/json

{
  "ingredients_text": "chicken, rice, vegetables",
  "cuisine_preference": "italian",
  "dietary_restrictions": ["gluten_free"],
  "spice_level": "medium",
  "servings": 4,
  "cook_time_minutes": 30
}

OR (with image):
{
  "image_base64": "data:image/jpeg;base64,/9j/4AAQ...",
  "cuisine_preference": "italian",
  "servings": 4
}

Response: 200 OK (RecipeCreateRequest - NOT saved to DB)
```

### Generate & Save Recipe ⭐ NEW
```http
POST /api/recipes/generate-and-save
Authorization: Bearer {token} (REQUIRED)
Content-Type: application/json

{
  "ingredients_text": "chicken, rice, vegetables",
  "cuisine_preference": "italian",
  "servings": 4
}

Response: 201 Created (RecipeResponse - saved to DB with ID)
{
  "id": "uuid",
  "title": "Chicken and Vegetable Risotto",
  "author_id": "uuid",
  "author_email": "user@example.com",
  "ingredients": [...],
  "steps": [...],
  "nutrition": {...},
  "created_at": "2025-01-15T10:30:00Z"
}
```

### List Recipes
```http
GET /api/recipes?cuisine_type=italian&max_prep_time=30&my_recipes=false
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "Italian Pasta",
    "author_email": "chef@example.com",
    ...
  }
]
```

### Get Single Recipe
```http
GET /api/recipes/{recipe_id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "title": "Chicken Risotto",
  ...
}
```

### Create Recipe Manually
```http
POST /api/recipes
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "My Custom Recipe",
  "description": "A delicious meal",
  "ingredients": [
    {"name": "Chicken", "quantity": "500", "unit": "g"}
  ],
  "steps": [
    {"step_number": 1, "instruction": "Heat pan"}
  ],
  "cuisine_type": "italian",
  "difficulty": "medium",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "nutrition": {...},
  "is_public": true
}

Response: 201 Created
```

### Update Recipe
```http
PUT /api/recipes/{recipe_id}
Authorization: Bearer {token}
Content-Type: application/json

{...recipe data...}

Response: 200 OK
```

### Delete Recipe
```http
DELETE /api/recipes/{recipe_id}
Authorization: Bearer {token}

Response: 204 No Content
```

---

## 🥗 Nutrition Endpoints

### Analyze Dish & Auto-Save ⭐ UPDATED
```http
POST /api/nutrition/analyze-and-log-dish
Authorization: Bearer {token} (OPTIONAL - saves to DB if authenticated)
Content-Type: multipart/form-data

file: [dish_photo.jpg]
meal_type: "lunch"

Response: 200 OK
{
  "dish_name": "Grilled Chicken Salad",
  "portion_size": "350g",
  "nutrition": {
    "calories": 450,
    "protein_g": 35,
    "carbs_g": 25,
    "fat_g": 18,
    ...
  },
  "confidence_score": 0.92,
  "ingredients_detected": ["chicken", "lettuce", "tomato"]
}

Note: If authenticated, also saves to scanned_dishes table automatically
```

### Get Rate Limit Status
```http
GET /api/nutrition/rate-limit-status
Authorization: Bearer {token} (OPTIONAL)

Response: 200 OK (Anonymous)
{
  "authenticated": false,
  "unlimited": false,
  "remaining": 2,
  "total_limit": 3,
  "used": 1,
  "reset_at": "2025-01-16T10:30:00Z"
}

Response: 200 OK (Authenticated)
{
  "authenticated": true,
  "unlimited": true,
  "remaining": -1,
  "total_limit": -1,
  "reset_at": null
}
```

### Log Meal Manually
```http
POST /api/nutrition/log-meal
Authorization: Bearer {token}
Content-Type: application/json

{
  "dish_name": "Grilled Salmon",
  "nutrition": {...},
  "meal_type": "dinner",
  "confidence_score": 0.85
}

Response: 201 Created (ScannedDishEntry)
```

### Get Daily Nutrition Summary
```http
GET /api/nutrition/daily-log?target_date=2025-01-15
Authorization: Bearer {token}

Response: 200 OK
{
  "date": "2025-01-15",
  "total_calories": 1850,
  "total_protein_g": 120,
  "total_carbs_g": 180,
  "total_fat_g": 65,
  "meals": [
    {
      "id": "uuid",
      "dish_name": "Breakfast Omelette",
      "meal_type": "breakfast",
      "nutrition": {...},
      "scanned_at": "2025-01-15T08:00:00Z"
    },
    ...
  ]
}
```

---

## 🛠️ Admin Endpoints

### List All Rate Limits
```http
GET /api/admin/rate-limits

Response: 200 OK
{
  "total_ips": 5,
  "rate_limits": [
    {
      "ip": "192.168.1.1",
      "count": 2,
      "remaining": 1,
      "ttl_seconds": 82800,
      "reset_at": "2025-01-16T10:30:00Z"
    }
  ]
}
```

### Reset Rate Limit for IP
```http
DELETE /api/admin/rate-limits/192.168.1.1

Response: 200 OK
{
  "message": "Rate limit reset for IP: 192.168.1.1"
}
```

### Clear All Rate Limits
```http
DELETE /api/admin/rate-limits

Response: 200 OK
{
  "message": "All rate limits cleared",
  "count": 5
}
```

### Check Redis Status
```http
GET /api/admin/redis/status

Response: 200 OK
{
  "connected": true,
  "redis_url_configured": true,
  ...
}
```

---

## 📝 Common Patterns

### Authentication Header
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rate Limiting Behavior
- **Anonymous users**: 3 requests per 24 hours
- **Authenticated users**: Unlimited
- **429 Error**: Rate limit exceeded
  ```json
  {
    "detail": "Rate limit exceeded. Anonymous users: 3 requests per 24h. Please sign up for unlimited access!"
  }
  ```

### Error Responses
```http
400 Bad Request - Validation error
401 Unauthorized - Missing/invalid token
404 Not Found - Resource doesn't exist
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Server error
```

### JSONB Field Structures

**NutritionInfo**:
```json
{
  "calories": 450,
  "protein_g": 35,
  "carbs_g": 45,
  "fat_g": 18,
  "fiber_g": 8,
  "sugar_g": 5,
  "sodium_mg": 600,
  "cholesterol_mg": 85,
  ...
}
```

**IngredientItem**:
```json
{
  "name": "Chicken Breast",
  "quantity": "500",
  "unit": "g"
}
```

**RecipeStep**:
```json
{
  "step_number": 1,
  "instruction": "Preheat oven to 180°C"
}
```

---

## 🎯 Testing Tips

### Test Anonymous Access (Rate Limited)
```bash
# No auth header - limited to 3 requests
curl -X POST http://localhost:8000/api/recipes/generate-from-input \
  -H "Content-Type: application/json" \
  -d '{"ingredients_text": "pasta, tomato, basil", "servings": 2}'
```

### Test Authenticated Access (Unlimited)
```bash
# With auth token - unlimited requests + DB saves
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:8000/api/recipes/generate-and-save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredients_text": "chicken, rice", "servings": 4}'
```

### Test Image Upload
```bash
curl -X POST http://localhost:8000/api/nutrition/analyze-and-log-dish \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@dish.jpg" \
  -F "meal_type=lunch"
```

---

**Base URL**: `http://localhost:8000` (development)
**API Prefix**: `/api`
**Docs**: `http://localhost:8000/docs` (Swagger UI)
