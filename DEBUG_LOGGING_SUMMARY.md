# Debug Logging Summary

## What Was Added

We've added comprehensive debug logging throughout the notification system to trace the complete flow from dish scan to toast display.

## Files Modified

### 1. `/backend/app/services/goal_observer.py`

#### In `GoalTracker.check_goals()`:
```python
# At start of function:
print(f"\n🔍 [GOAL CHECK] Starting goal check for user {user_id}")
print(f"📊 Daily stats: {daily_stats}")
print(f"🎯 User goals: {user_goals}")

# For each goal type:
print(f"⏭️  Skipping {goal_type} - no goal set")  # When goal is 0
print(f"📈 {goal_type}: {actual_value}/{goal_value} = {percentage}%")

# When milestone reached:
print(f"🎉 ACHIEVEMENT! {goal_type} goal reached at {percentage}%")
print(f"✅ Notification sent to {len(self.observers)} observers")

print(f"💪 MILESTONE! {goal_type} at {percentage}%")
print(f"✅ Milestone notification sent to {len(self.observers)} observers")

# For tracking progress:
print(f"📊 Progress: {goal_type} at {percentage}% (no new notification)")

# At end:
print(f"✅ [GOAL CHECK] Completed\n")
```

#### In `ToastNotificationObserver.notify()`:
```python
print(f"🔔 [TOAST OBSERVER] Received notification for user {user_id}")
print(f"🔔 Achievement data: {achievement}")
print(f"📝 [TOAST OBSERVER] Stored notification. Total for user: {len(self.notifications[user_id])}")
print(f"📋 Notification: {notification}")
```

### 2. `/backend/app/api/nutrition.py`

#### In `get_notifications()` endpoint:
```python
print(f"\n📬 [API] GET /notifications for user {user_id}, unread_only={unread_only}")
print(f"📬 [API] Found {len(notifications)} notifications")
if notifications:
    print(f"📬 [API] Notification IDs: {[n.get('id') for n in notifications]}")
```

### 3. `/frontend/hooks/use-goal-notifications.ts`

#### In `checkNotifications()` callback:
```javascript
console.log('[Goal Notifications] Checking for notifications...');
console.log('[Goal Notifications] Response:', response);
console.log(`[Goal Notifications] Found ${notifications.length} notifications`);
console.log('[Goal Notifications] Displaying:', title);
console.log('[Goal Notifications] Marked as read:', id);
console.error('[Goal Notifications] Error marking as read:', error);
```

## How to Use the Logs

### Backend Terminal (uvicorn output):
1. Start backend: `cd backend && uvicorn app.main:app --reload`
2. Watch for these log patterns when scanning a dish:
   ```
   🔍 [GOAL CHECK] Starting...
   📊 Daily stats: ...
   🎯 User goals: ...
   📈 protein: 120/150 = 80.0%
   💪 MILESTONE! protein at 80.0%
   🔔 [TOAST OBSERVER] Received notification...
   📝 [TOAST OBSERVER] Stored notification...
   ✅ [GOAL CHECK] Completed
   ```

3. When frontend polls (every 30s):
   ```
   📬 [API] GET /notifications for user <uuid>
   📬 [API] Found 2 notifications
   📬 [API] Notification IDs: [...]
   ```

### Browser Console (F12):
1. Open developer tools (F12)
2. Go to Console tab
3. Look for these logs:
   ```javascript
   [Goal Notifications] Checking for notifications...
   [Goal Notifications] Response: {notifications: [...], count: 2}
   [Goal Notifications] Found 2 notifications
   [Goal Notifications] Displaying: 💪 Progress: Protein Goal
   [Goal Notifications] Marked as read: <uuid>_protein_2024-01-15
   ```

## Diagnostic Checklist

Run through this checklist when testing notifications:

### ✅ Backend Checks:
- [ ] Backend terminal shows `🔍 [GOAL CHECK] Starting...` after dish scan
- [ ] Daily stats values look correct
- [ ] User goals are not 0 or NULL
- [ ] Percentage calculations are accurate
- [ ] `💪 MILESTONE!` or `🎉 ACHIEVEMENT!` appears when >= 80%
- [ ] `🔔 [TOAST OBSERVER] Received notification` confirms storage
- [ ] `📝 [TOAST OBSERVER] Stored notification. Total for user: X` shows count

### ✅ API Checks:
- [ ] `📬 [API] GET /notifications` appears every 30 seconds
- [ ] `📬 [API] Found X notifications` shows non-zero count
- [ ] Notification IDs are listed

### ✅ Frontend Checks:
- [ ] Browser console shows `[Goal Notifications] Checking...` every 30s
- [ ] Response object contains notifications array
- [ ] `Found X notifications` matches backend count
- [ ] `Displaying:` appears before toast shows
- [ ] `Marked as read:` confirms processing

### ✅ Visual Checks:
- [ ] Toast appears in top-right corner
- [ ] Toast has correct color (green for 100%, blue for 90%, default for 80%)
- [ ] Toast shows goal type and percentage
- [ ] Toast closes automatically or manually

## Expected Log Flow for Complete Success

### Scenario: User scans dish that brings protein to 85%

**1. Backend Terminal (after dish scan):**
```
🔍 [GOAL CHECK] Starting goal check for user abc123...
📊 Daily stats: {'total_protein_g': 127.5, ...}
🎯 User goals: {'daily_protein_goal': 150, ...}
📈 protein: 127.5/150 = 85.0%
💪 MILESTONE! protein at 85.0%
🔔 [TOAST OBSERVER] Received notification for user abc123
📝 [TOAST OBSERVER] Stored notification. Total for user: 1
✅ Milestone notification sent to 2 observers
✅ [GOAL CHECK] Completed
```

**2. Backend Terminal (when frontend polls ~30s later):**
```
📬 [API] GET /notifications for user abc123, unread_only=True
📬 [API] Found 1 notifications
📬 [API] Notification IDs: ['abc123_protein_2024-01-15']
```

**3. Browser Console:**
```javascript
[Goal Notifications] Checking for notifications...
[Goal Notifications] Response: {notifications: [{...}], count: 1}
[Goal Notifications] Found 1 notifications
[Goal Notifications] Displaying: 💪 Progress: Protein Goal
[Goal Notifications] Marked as read: abc123_protein_2024-01-15
```

**4. Screen:**
Toast appears with:
- Title: "💪 Progress: Protein Goal"
- Message: "Current: 127.5g / 150g (85.0%)"
- Default color (not blue or green)

## Troubleshooting with Logs

### Problem: No backend logs appear
**Look for:** Complete absence of `🔍 [GOAL CHECK]`
**Diagnosis:** Goal checking not being called
**Solution:** Check if backend saves dish to scanned_dishes and triggers daily_nutrition_stats update

### Problem: Backend shows "Skipping all goals"
**Look for:** Multiple `⏭️  Skipping X - no goal set`
**Diagnosis:** User goals are NULL or 0
**Solution:** Update user profile with goal values

### Problem: Backend calculates but no milestone/achievement
**Look for:** `📈 protein: 50/150 = 33.3%` but no `💪 MILESTONE!`
**Diagnosis:** Percentage is below 80%
**Solution:** Scan more dishes to reach 80%+ threshold

### Problem: Backend stores notification but frontend doesn't poll
**Look for:** Backend has `📝 Stored notification` but no `📬 [API] GET /notifications`
**Diagnosis:** Frontend polling not enabled or token missing
**Solution:** Check user is logged in and token in localStorage

### Problem: Frontend polls but gets empty response
**Look for:** Frontend `Checking...` but `Found 0 notifications`
**Diagnosis:** Notifications already marked as read, or wrong user ID
**Solution:** Scan new dish or restart backend to clear cache

### Problem: Frontend displays but no toast appears
**Look for:** Console shows `Displaying:` but no visual toast
**Diagnosis:** Sonner Toaster not rendered or CSS z-index issue
**Solution:** Check `<Toaster />` in layout.tsx, inspect element CSS

## Clean Up

Once debugging is complete, you can remove or reduce logging verbosity:

1. **Keep for production:** `logger.info()` calls (structured logging)
2. **Remove for production:** `print()` statements (clutters console)
3. **Keep frontend logs:** Console logs help users debug issues

### To remove all debug prints:
```bash
# Search for debug prints
grep -r "print(f\"🔍" backend/app/services/goal_observer.py
grep -r "print(f\"🔔" backend/app/services/goal_observer.py
grep -r "print(f\"📬" backend/app/api/nutrition.py

# Replace with logger.debug() for production:
logger.debug(f"[GOAL CHECK] Starting goal check for user {user_id}")
```

## Additional Tools

### Network Tab (Browser DevTools):
- Filter for `/notifications` endpoint
- Check request/response headers
- Verify token is sent in Authorization header
- See actual JSON response

### Backend Logs File:
```bash
# Save logs to file for analysis
uvicorn app.main:app --reload 2>&1 | tee backend_logs.txt
```

### Frontend Network Monitor:
```javascript
// Add to useGoalNotifications hook for detailed network logging
console.log('Request URL:', 'http://localhost:8000/api/nutrition/notifications');
console.log('Request headers:', { Authorization: `Bearer ${token}` });
```

---

**Next Steps:**
1. Follow NOTIFICATION_DEBUG_GUIDE.md for step-by-step testing
2. Use this document to interpret the logs you see
3. Report any unexpected log patterns for further debugging
