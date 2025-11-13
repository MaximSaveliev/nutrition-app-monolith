# Notification Debug Guide

## Overview
This guide helps you debug the goal notification system that uses the Observer Pattern.

## System Flow

```
1. User scans dish photo 📸
   ↓
2. Backend saves to scanned_dishes table 💾
   ↓
3. Trigger updates daily_nutrition_stats 🔄
   ↓
4. Backend calls check_goals() 🎯
   ↓
5. GoalTracker notifies observers 📢
   ↓
6. ToastNotificationObserver stores notification 📝
   ↓
7. Frontend polls /notifications every 30s 🔍
   ↓
8. Hook displays toast notification 🔔
```

## Backend Debug Logs (Terminal)

When you scan a dish and backend processes it, you should see:

```bash
🔍 [GOAL CHECK] Starting goal check for user <uuid>
📊 Daily stats: {'total_calories': 1500, 'total_protein_g': 120, ...}
🎯 User goals: {'daily_calorie_goal': 2000, 'daily_protein_goal': 150, ...}

📈 calories: 1500/2000 = 75.0%
📈 protein: 120/150 = 80.0%
💪 MILESTONE! protein at 80.0%
🔔 [TOAST OBSERVER] Received notification for user <uuid>
🔔 Achievement data: {'goal_type': 'protein', 'percentage': 80.0, ...}
📝 [TOAST OBSERVER] Stored notification. Total for user: 1
✅ Milestone notification sent to 2 observers

📈 carbs: 200/250 = 80.0%
💪 MILESTONE! carbs at 80.0%
...

✅ [GOAL CHECK] Completed
```

### Key Indicators:
- **🔍 [GOAL CHECK]** - Goal checking started
- **💪 MILESTONE!** - 80-89% of goal reached
- **🎉 ACHIEVEMENT!** - 100%+ of goal reached
- **🔔 [TOAST OBSERVER]** - Notification stored
- **✅ Notification sent** - Observers notified

## Frontend Debug Logs (Browser Console)

Every 30 seconds, you should see:

```javascript
[Goal Notifications] Checking for notifications...
[Goal Notifications] Response: {notifications: [...], count: 1}
[Goal Notifications] Found 1 notifications
[Goal Notifications] Displaying: 💪 Progress: Protein Goal
[Goal Notifications] Marked as read: <uuid>_protein_2024-01-15
```

### Key Indicators:
- **Checking for notifications...** - Polling is working
- **Found X notifications** - Backend returned data
- **Displaying:** - Toast will be shown
- **Marked as read** - Notification processed

## API Debug Logs (Backend Terminal)

When frontend polls for notifications:

```bash
📬 [API] GET /notifications for user <uuid>, unread_only=True
📬 [API] Found 2 notifications
📬 [API] Notification IDs: ['<uuid>_protein_2024-01-15', '<uuid>_carbs_2024-01-15']
```

## Testing Steps

### 1. Start Backend with Logs Visible
```bash
cd backend
source venv/bin/activate  # On Linux/Mac
uvicorn app.main:app --reload
```

Keep this terminal visible to see backend logs.

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Open Browser Console
- Press F12 or Ctrl+Shift+I
- Go to Console tab
- Filter for "Goal Notifications" to see only relevant logs

### 4. Test the Flow

#### Option A: Test with Fresh User (No Cache)
1. Sign up as new user or clear achievement cache
2. Go to Analyze Dish page
3. Upload a dish photo with enough nutrition to reach 80%+ of any goal
4. Watch backend terminal for:
   - `🔍 [GOAL CHECK] Starting...`
   - `💪 MILESTONE!` or `🎉 ACHIEVEMENT!`
   - `🔔 [TOAST OBSERVER] Stored notification`
5. Within 30 seconds, watch browser console for:
   - `[Goal Notifications] Checking...`
   - `[Goal Notifications] Found X notifications`
   - `[Goal Notifications] Displaying:`
6. See the toast appear in top-right corner

#### Option B: Test with Multiple Dishes
1. Scan first dish (e.g., 500 calories → 25% of 2000 goal)
2. Scan second dish (e.g., 800 calories → 65% total)
3. Scan third dish (e.g., 700 calories → 100% total)
   - Should trigger 90% milestone (after 2nd) and 100% achievement (after 3rd)

### 5. Check User Goals
Make sure your user has goals set:
```sql
SELECT 
    email,
    daily_calorie_goal,
    daily_protein_goal,
    daily_carbs_goal,
    daily_fat_goal
FROM users
WHERE id = '<your-user-id>';
```

If any goal is NULL or 0, goal checking will skip it.

## Common Issues

### Issue 1: No Backend Logs Appear
**Symptom:** No `🔍 [GOAL CHECK]` logs when scanning dish

**Causes:**
- Backend not calling `check_goals()` after dish save
- Error in goal checking code (check for exceptions)
- daily_nutrition_stats table not updated (trigger issue)

**Fix:**
```bash
# Check if trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'scanned_dishes';

# Check if stats table has data
SELECT * FROM daily_nutrition_stats 
WHERE user_id = '<your-user-id>' 
ORDER BY date DESC LIMIT 5;
```

### Issue 2: Backend Logs Show "⏭️ Skipping X - no goal set"
**Symptom:** All goals skipped

**Cause:** User goals are NULL or 0

**Fix:** Update user goals in database or Profile page

### Issue 3: Backend Shows Notification Created But Frontend Doesn't Poll
**Symptom:** 
- Backend: `📝 [TOAST OBSERVER] Stored notification. Total for user: 1`
- No frontend logs in browser console

**Causes:**
- useGoalNotifications hook not enabled (user not logged in)
- Polling not started (check useEffect dependency)
- Token not available in localStorage

**Fix:**
```javascript
// Check in browser console:
console.log('User logged in:', !!user);
console.log('Token exists:', !!localStorage.getItem('access_token'));
```

### Issue 4: Frontend Polls But Gets Empty Response
**Symptom:**
- Browser console: `[Goal Notifications] Found 0 notifications`
- Backend: `📬 [API] Found 0 notifications`

**Causes:**
- Notifications marked as read already
- Achievement cache preventing duplicates
- Wrong user ID (mismatch)

**Fix:**
```bash
# Check backend terminal for user ID when scanning dish
# Compare with user ID when polling:
📬 [API] GET /notifications for user <uuid>

# Clear achievement cache (restart backend)
```

### Issue 5: Frontend Shows Notification But Toast Doesn't Appear
**Symptom:**
- Browser console: `[Goal Notifications] Displaying: ...`
- No toast visible on screen

**Causes:**
- Sonner Toaster not in layout
- CSS z-index issue
- Toast quickly dismissed

**Fix:**
```typescript
// Check app/layout.tsx has Toaster:
<Toaster position="top-right" richColors closeButton />

// Test manual toast:
toast.success("Test notification");
```

## Manual Testing Commands

### Backend: Manually Trigger Notification
```python
# In Python REPL or endpoint:
from app.services.goal_observer import get_goal_tracker, get_toast_observer
from uuid import UUID
from datetime import date

tracker = get_goal_tracker()
observer = get_toast_observer()

# Simulate achievement
achievement = {
    'goal_type': 'protein',
    'goal_value': 150,
    'actual_value': 125,
    'percentage': 83.3,
    'date': date.today(),
    'achieved': False
}

await tracker.notify_observers(
    user_id=UUID('<your-user-id>'),
    achievement=achievement
)

# Check stored notifications
notifications = observer.get_notifications(UUID('<your-user-id>'), unread_only=True)
print(f"Stored: {len(notifications)} notifications")
```

### Frontend: Manually Trigger Check
```javascript
// In browser console:
const { checkNotifications } = useGoalNotifications(true);
await checkNotifications();
```

### API: Direct Curl Test
```bash
# Get notifications
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:8000/api/nutrition/notifications

# Expected response:
{
  "notifications": [
    {
      "id": "...",
      "type": "goal_achievement",
      "title": "💪 Progress: Protein Goal",
      "message": "Current: 125g / 150g (83.3%)",
      "read": false,
      "created_at": "2024-01-15"
    }
  ],
  "count": 1
}
```

## Success Criteria

✅ **Backend logs show:**
- Goal checking starts after dish scan
- Percentage calculations correct
- Notifications stored in observer

✅ **Frontend logs show:**
- Polling every 30 seconds
- Receiving notifications from API
- Displaying toasts
- Marking as read

✅ **User sees:**
- Toast notification appears in top-right
- Different colors based on percentage (80%: default, 90%: info, 100%: success)
- Notification only shown once (marked as read)

## Next Steps

If everything works except the toast display:
1. Check Sonner documentation for custom styling
2. Verify z-index of toast container
3. Test on different browsers
4. Check if toast duration is too short

If backend doesn't trigger at all:
1. Verify migration 002 was applied
2. Check trigger on scanned_dishes table
3. Ensure daily_nutrition_stats is being updated
4. Look for exceptions in goal_observer.py
