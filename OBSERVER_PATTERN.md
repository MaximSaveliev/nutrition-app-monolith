# Goal Achievement Observer Pattern

## Overview

The Observer pattern is implemented to automatically notify users when they achieve their daily nutrition goals. When a user scans a dish, the system checks if they've reached any goal milestones and sends beautiful toast notifications to celebrate their progress!

## How It Works

### 🏗️ Architecture

```
User Scans Dish
     ↓
Backend saves dish → Trigger updates daily_nutrition_stats
     ↓
GoalTracker.check_goals() is called
     ↓
Compares current stats vs user goals
     ↓
If goal achieved (≥80%) → notify_observers()
     ↓
ToastNotificationObserver stores notification
     ↓
Frontend polls /api/nutrition/notifications
     ↓
useGoalNotifications hook fetches new notifications
     ↓
Sonner displays beautiful toast!
```

### 🎯 Observer Pattern Components

**Subject (Observable):**
- `GoalTracker` - Monitors nutrition stats and detects achievements

**Observers:**
- `ToastNotificationObserver` - Stores notifications for frontend display
- `LoggingObserver` - Logs achievements to console

**Concrete Notifications:**
- `GoalAchievement` - Represents a single goal achievement

## Backend Implementation

### 1. GoalTracker (Subject)

Located: `backend/app/services/goal_observer.py`

```python
class GoalTracker:
    def __init__(self):
        self.observers: List[GoalObserver] = []
    
    def attach(self, observer: GoalObserver):
        """Attach an observer to receive notifications"""
        
    def notify_observers(self, user_id, achievement):
        """Notify all observers about an achievement"""
        
    async def check_goals(self, user_id, daily_stats, user_goals):
        """Check if any goals achieved and notify observers"""
```

**Goal Milestones:**
- **100%+** → "🎉 Goal Achieved!" (success toast)
- **90-99%** → "🔥 Almost There!" (info toast)
- **80-89%** → "💪 Progress Update" (normal toast)

### 2. ToastNotificationObserver

Stores notifications in memory for retrieval by frontend:

```python
class ToastNotificationObserver(GoalObserver):
    def __init__(self):
        self.notifications: Dict[UUID, List[Dict]] = {}
    
    async def notify(self, user_id, achievement):
        """Store notification for user"""
        notification = {
            "id": f"{user_id}_{goal_type}_{date}",
            "type": "goal_achievement",
            "title": "🎉 Protein Goal Achieved!",
            "message": "Great job! You've reached your daily protein goal of 150g!",
            "achievement": achievement,
            "read": False
        }
        self.notifications[user_id].append(notification)
```

### 3. Integration in Nutrition API

Located: `backend/app/api/nutrition.py`

When a dish is scanned and saved:

```python
# After saving dish to database
goal_tracker = get_goal_tracker()
daily_stats = await daily_stats_repo.get_daily_stats(user_id, today)

# Check goals
await goal_tracker.check_goals(
    user_id=user_id,
    daily_stats=stats,
    user_goals=user_goals,
    target_date=today
)
```

### 4. API Endpoints

**Get Notifications:**
```http
GET /api/nutrition/notifications?unread_only=true
Authorization: Bearer <token>

Response:
{
  "notifications": [
    {
      "id": "uuid_protein_2024-11-13",
      "type": "goal_achievement",
      "title": "🎉 Protein Goal Achieved!",
      "message": "Great job! You've reached...",
      "achievement": {...},
      "read": false,
      "created_at": "2024-11-13T10:30:00"
    }
  ],
  "count": 1
}
```

**Mark as Read:**
```http
POST /api/nutrition/notifications/{notification_id}/read
Authorization: Bearer <token>
```

**Clear All:**
```http
DELETE /api/nutrition/notifications
Authorization: Bearer <token>
```

## Frontend Implementation

### 1. useGoalNotifications Hook

Located: `frontend/hooks/use-goal-notifications.ts`

**Features:**
- Polls for new notifications every 30 seconds
- Automatically displays toasts for unread notifications
- Marks notifications as read after display
- Can be manually triggered

```typescript
const { checkNotifications } = useGoalNotifications(enabled);

// Manually trigger check
await checkNotifications();
```

### 2. Toast Display Logic

```typescript
if (percentage >= 100) {
  toast.success(title, {
    description: message,
    duration: 6000,
    action: { label: 'Awesome!', onClick: markRead }
  });
} else if (percentage >= 90) {
  toast.info(title, {
    description: message,
    duration: 5000
  });
}
```

### 3. Integration in Pages

**Dashboard:**
```tsx
import { useGoalNotifications } from '@/hooks/use-goal-notifications';

export default function Dashboard() {
  useGoalNotifications(!!user); // Enable when logged in
  // ... rest of component
}
```

**Statistics Page:**
```tsx
export default function StatisticsPage() {
  useGoalNotifications(!!user);
  // ... rest of component
}
```

### 4. Sonner Toaster

Located: `frontend/app/layout.tsx`

```tsx
import { Toaster } from 'sonner';

<Toaster 
  position="top-right" 
  expand={false}
  richColors 
  closeButton
/>
```

## User Experience Flow

### Example Scenario

1. **Morning:** User scans breakfast (500 cal, 20g protein)
   - Stats: 500/2000 cal (25%), 20/150g protein (13%)
   - No notifications (below 80% threshold)

2. **Lunch:** User scans lunch (700 cal, 40g protein)
   - Stats: 1200/2000 cal (60%), 60/150g protein (40%)
   - No notifications yet

3. **Afternoon Snack:** User scans snack (400 cal, 30g protein)
   - Stats: 1600/2000 cal (80%), 90/150g protein (60%)
   - 🎊 Toast appears: "💪 Progress: Calories Goal - 80%!"

4. **Dinner:** User scans dinner (600 cal, 70g protein)
   - Stats: 2200/2000 cal (110%), 160/150g protein (107%)
   - 🎉 Toast appears: "🎉 Calories Goal Achieved!"
   - 🎉 Toast appears: "🎉 Protein Goal Achieved!"

## Benefits of Observer Pattern

### 1. **Decoupling**
- Business logic (goal checking) separate from notifications
- Easy to add new observer types (email, push, database logging)

### 2. **Extensibility**
```python
# Easy to add new observers!
class EmailNotificationObserver(GoalObserver):
    async def notify(self, user_id, achievement):
        send_email(user_id, achievement)

goal_tracker.attach(EmailNotificationObserver())
```

### 3. **Multiple Notifications**
- One event triggers multiple observers
- Toast notification + Logging + Future email/push

### 4. **Real-time Updates**
- Immediate feedback when goals achieved
- Motivates users to reach their targets

## Future Enhancements

### 1. WebSocket for Real-time Notifications
```python
class WebSocketObserver(GoalObserver):
    async def notify(self, user_id, achievement):
        await websocket_manager.send(user_id, achievement)
```

### 2. Streak Tracking
- Notify when user maintains goals for consecutive days
- "🔥 7 Day Streak!"

### 3. Weekly/Monthly Achievements
- "🏆 Perfect Week! All goals met 7/7 days"
- "⭐ Monthly Champion - 28/30 days"

### 4. Social Sharing
```python
class SocialShareObserver(GoalObserver):
    async def notify(self, user_id, achievement):
        # Generate shareable achievement card
        create_achievement_badge(achievement)
```

### 5. Database Persistence
- Save achievements to `goal_achievements` table
- History of all achievements
- Analytics and progress reports

## Testing

### Backend Test

```bash
# Test goal checking
curl -X POST http://localhost:8000/api/nutrition/analyze-and-log-dish \
  -H "Authorization: Bearer <token>" \
  -F "file=@dish.jpg" \
  -F "meal_type=lunch"

# Check notifications
curl http://localhost:8000/api/nutrition/notifications \
  -H "Authorization: Bearer <token>"
```

### Frontend Test

1. Log in to the app
2. Go to Dashboard or Statistics page
3. Scan multiple dishes to reach 80%+ of any goal
4. Watch for toast notifications! 🎉

## Performance Considerations

### Polling Interval
- Current: 30 seconds
- Adjustable based on needs
- Consider WebSocket for instant notifications

### Caching
- Prevents duplicate notifications with `achievement_cache`
- Cache cleared daily at midnight

### Memory Management
- In-memory notifications cleared after read
- Consider Redis for production scale
- Database persistence for important achievements

## Troubleshooting

### No Notifications Appearing

**Check:**
1. User is logged in
2. `useGoalNotifications` hook is enabled
3. Backend `/notifications` endpoint returns data
4. Browser console for errors
5. Toaster component is in layout

### Duplicate Notifications

**Solution:**
- `achievement_cache` prevents duplicates
- Check cache clearing logic
- Verify notification IDs are unique

### Notifications Not Marking as Read

**Check:**
- API call to `/notifications/{id}/read` succeeds
- Observer's `mark_as_read` method works
- Frontend calls `markNotificationRead()`

---

**Status:** ✅ Fully Implemented

**Pattern:** Observer Pattern (Behavioral)

**Impact:** Enhanced user engagement through immediate positive feedback when achieving nutrition goals!
