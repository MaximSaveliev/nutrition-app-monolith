# 🔍 Quick Notification Debug Reference

## Start Testing (3 Commands)

```bash
# Terminal 1: Backend with logs
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser: Open Console (F12) and go to http://localhost:3000
```

## What Should Happen

### ✅ After Scanning a Dish (Backend Terminal):
```
🔍 [GOAL CHECK] Starting goal check for user...
📈 protein: 120/150 = 80.0%
💪 MILESTONE! protein at 80.0%
🔔 [TOAST OBSERVER] Received notification
📝 [TOAST OBSERVER] Stored notification. Total: 1
✅ [GOAL CHECK] Completed
```

### ✅ Every 30 Seconds (Backend Terminal):
```
📬 [API] GET /notifications for user..., unread_only=True
📬 [API] Found 1 notifications
```

### ✅ Every 30 Seconds (Browser Console):
```javascript
[Goal Notifications] Checking for notifications...
[Goal Notifications] Found 1 notifications
[Goal Notifications] Displaying: 💪 Progress: Protein Goal
[Goal Notifications] Marked as read: ...
```

### ✅ On Screen:
Toast notification in top-right corner! 🎉

## Common Problems & Quick Fixes

| Problem | Quick Check | Fix |
|---------|------------|-----|
| No `🔍 [GOAL CHECK]` logs | Backend not calling check_goals() | Check scanned_dishes trigger exists |
| All goals skipped | User goals are 0/NULL | Update user profile with goals |
| Percentage below 80% | Need more calories/protein | Scan more dishes |
| No `📬 [API]` logs | Frontend not polling | Check user logged in + token exists |
| Empty notifications | Already marked read | Restart backend to clear cache |
| No toast appears | Toaster not in layout | Check app/layout.tsx has `<Toaster />` |

## Quick Tests

### 1. Check User Goals:
```javascript
// In browser console:
console.log('Token:', localStorage.getItem('access_token'));
```

### 2. Manual API Call:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/nutrition/notifications
```

### 3. Check Database:
```sql
-- Check today's stats
SELECT * FROM daily_nutrition_stats 
WHERE user_id = 'YOUR_USER_ID' AND date = CURRENT_DATE;

-- Check user goals
SELECT daily_calorie_goal, daily_protein_goal, daily_carbs_goal, daily_fat_goal
FROM users WHERE id = 'YOUR_USER_ID';
```

## Goal Thresholds

| Percentage | Notification Type | Toast Color | Emoji |
|------------|------------------|-------------|-------|
| 80-89% | Progress | Default | 💪 |
| 90-99% | Almost There | Blue (info) | 🔥 |
| 100%+ | Achieved! | Green (success) | 🎉 |

## Emoji Legend

Backend logs:
- 🔍 Goal check starting
- 📊 Stats data
- 🎯 User goals
- 📈 Percentage calculation
- 💪 80-89% milestone
- 🔥 90-99% milestone (in message)
- 🎉 100%+ achievement
- 🔔 Observer receiving notification
- 📝 Notification stored
- 📬 API endpoint called
- ✅ Success/completion

Frontend logs:
- `[Goal Notifications]` All hook activities

## Full Log Example (Happy Path)

```bash
# BACKEND: After dish scan
🔍 [GOAL CHECK] Starting goal check for user abc-123
📊 Daily stats: {'total_protein_g': 130, ...}
🎯 User goals: {'daily_protein_goal': 150, ...}
📈 protein: 130/150 = 86.7%
💪 MILESTONE! protein at 86.7%
🔔 [TOAST OBSERVER] Received notification for user abc-123
📝 [TOAST OBSERVER] Stored notification. Total for user: 1
✅ [GOAL CHECK] Completed

# BACKEND: ~30s later when frontend polls
📬 [API] GET /notifications for user abc-123, unread_only=True
📬 [API] Found 1 notifications
📬 [API] Notification IDs: ['abc-123_protein_2024-01-15']

# FRONTEND: Browser console
[Goal Notifications] Checking for notifications...
[Goal Notifications] Response: {notifications: [...], count: 1}
[Goal Notifications] Found 1 notifications  
[Goal Notifications] Displaying: 💪 Progress: Protein Goal
[Goal Notifications] Marked as read: abc-123_protein_2024-01-15

# SCREEN: Toast appears
Title: 💪 Progress: Protein Goal
Message: Current: 130g / 150g (86.7%)
```

## Need More Help?

📖 **Full guides:**
- `NOTIFICATION_DEBUG_GUIDE.md` - Complete testing guide
- `DEBUG_LOGGING_SUMMARY.md` - Detailed log explanation
- `OBSERVER_PATTERN.md` - Architecture documentation

💡 **Remember:**
- Notifications only trigger once per day per goal
- Must reach 80%+ threshold
- Backend caches achievements (restart clears)
- Frontend polls every 30 seconds
- User must be logged in with valid token
