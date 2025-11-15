"""
Pattern: Observer (Behavioral)
Goal achievement tracking with notification system
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from uuid import UUID
from datetime import date, datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class GoalObserver(ABC):
    """
    Pattern: Observer (Behavioral)
    Abstract observer interface for goal achievement notifications
    """
    
    @abstractmethod
    async def notify(self, user_id: UUID, achievement: Dict[str, Any]):
        """Notify about goal achievement"""
        pass


class ToastNotificationObserver(GoalObserver):
    """
    Pattern: Observer (Behavioral) - Concrete Observer
    Stores notifications for frontend display
    """
    
    def __init__(self):
        self.notifications: Dict[UUID, List[Dict[str, Any]]] = {}
    
    async def notify(self, user_id: UUID, achievement: Dict[str, Any]):
        """Store notification for user retrieval"""
        if user_id not in self.notifications:
            self.notifications[user_id] = []
        
        notification_id = f"{user_id}_{achievement['goal_type']}_{achievement['date']}"
        
        # Check if notification already exists (prevent duplicates)
        existing_notification = next(
            (n for n in self.notifications[user_id] if n['id'] == notification_id),
            None
        )
        
        if existing_notification:
            logger.debug(f"Notification already exists for user {user_id}: {notification_id}")
            return
        
        notification = {
            "id": notification_id,
            "type": "goal_achievement",
            "title": self._get_title(achievement),
            "message": self._get_message(achievement),
            "achievement": achievement,
            "read": False,
            "created_at": achievement.get('date', date.today()).isoformat()
        }
        
        self.notifications[user_id].append(notification)
        logger.info(f"Goal achievement notification created for user {user_id}: {achievement['goal_type']}")
    
    def _get_title(self, achievement: Dict[str, Any]) -> str:
        """Generate notification title"""
        goal_type = achievement['goal_type'].capitalize()
        percentage = achievement['percentage']
        
        if percentage >= 100:
            return f"🎉 {goal_type} Goal Achieved!"
        elif percentage >= 90:
            return f"🔥 Almost There! {goal_type} Goal"
        else:
            return f"💪 Progress: {goal_type} Goal"
    
    def _get_message(self, achievement: Dict[str, Any]) -> str:
        """Generate notification message"""
        goal_type = achievement['goal_type']
        actual = achievement['actual_value']
        goal = achievement['goal_value']
        percentage = achievement['percentage']
        unit = self._get_unit(goal_type)
        
        if percentage >= 100:
            return f"Great job! You've reached your daily {goal_type} goal of {goal}{unit}!"
        elif percentage >= 90:
            return f"You're at {actual}{unit} of {goal}{unit} ({percentage}%). Keep going!"
        else:
            return f"Current: {actual}{unit} / {goal}{unit} ({percentage}%)"
    
    def _get_unit(self, goal_type: str) -> str:
        """Get unit for goal type"""
        units = {
            'calories': ' kcal',
            'protein': 'g',
            'carbs': 'g',
            'fat': 'g'
        }
        return units.get(goal_type, '')
    
    def get_notifications(self, user_id: UUID, unread_only: bool = True) -> List[Dict[str, Any]]:
        """Get notifications for user"""
        # Cleanup old notifications before returning
        self._cleanup_old_notifications(user_id)
        
        if user_id not in self.notifications:
            return []
        
        notifications = self.notifications[user_id]
        if unread_only:
            notifications = [n for n in notifications if not n['read']]
        
        return notifications
    
    def mark_as_read(self, user_id: UUID, notification_id: str):
        """Mark notification as read"""
        if user_id in self.notifications:
            for notification in self.notifications[user_id]:
                if notification['id'] == notification_id:
                    notification['read'] = True
                    break
    
    def clear_notifications(self, user_id: UUID):
        """Clear all notifications for user"""
        if user_id in self.notifications:
            self.notifications[user_id] = []
    
    def _cleanup_old_notifications(self, user_id: UUID):
        """
        Automatic cleanup of old notifications:
        - Delete read notifications older than 7 days
        - Keep maximum 10 notifications per user (delete oldest read ones first)
        """
        if user_id not in self.notifications:
            return
        
        current_notifications = self.notifications[user_id]
        if not current_notifications:
            return
        
        # Step 1: Remove read notifications older than 7 days
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        filtered_notifications = []
        removed_count = 0
        
        for notification in current_notifications:
            created_at = datetime.fromisoformat(notification['created_at'])
            is_old = created_at < seven_days_ago
            is_read = notification['read']
            
            # Keep if: unread OR read but less than 7 days old
            if not is_read or not is_old:
                filtered_notifications.append(notification)
            else:
                removed_count += 1
        
        # Step 2: Enforce maximum limit (keep last 10 notifications)
        MAX_NOTIFICATIONS = 10
        if len(filtered_notifications) > MAX_NOTIFICATIONS:
            # Sort by created_at, keep newest
            filtered_notifications.sort(key=lambda n: n['created_at'], reverse=True)
            
            # Prioritize keeping unread notifications
            unread = [n for n in filtered_notifications if not n['read']]
            read = [n for n in filtered_notifications if n['read']]
            
            # Keep all unread + fill remaining slots with read
            remaining_slots = MAX_NOTIFICATIONS - len(unread)
            filtered_notifications = unread + read[:remaining_slots]
            
            removed_count += len(current_notifications) - removed_count - len(filtered_notifications)
        
        if removed_count > 0:
            logger.info(f"Cleaned up {removed_count} old notifications for user {user_id}")
        
        self.notifications[user_id] = filtered_notifications


class LoggingObserver(GoalObserver):
    """
    Pattern: Observer (Behavioral) - Concrete Observer
    Logs goal achievements to application logs
    """
    
    async def notify(self, user_id: UUID, achievement: Dict[str, Any]):
        """Log the achievement"""
        logger.info(
            f"Goal Achievement - User: {user_id}, "
            f"Type: {achievement['goal_type']}, "
            f"Actual: {achievement['actual_value']}, "
            f"Goal: {achievement['goal_value']}, "
            f"Percentage: {achievement['percentage']}%"
        )


class GoalTracker:
    """
    Pattern: Observer (Behavioral) - Subject
    Tracks goals and notifies observers when milestones are reached
    """
    
    def __init__(self):
        self.observers: List[GoalObserver] = []
        self.achievement_cache: Dict[str, bool] = {}
    
    def attach(self, observer: GoalObserver):
        """Attach observer to subject"""
        if observer not in self.observers:
            self.observers.append(observer)
            logger.info(f"Observer {observer.__class__.__name__} attached to GoalTracker")
    
    def detach(self, observer: GoalObserver):
        """Detach observer from subject"""
        if observer in self.observers:
            self.observers.remove(observer)
            logger.info(f"Observer {observer.__class__.__name__} detached from GoalTracker")
    
    async def notify_observers(self, user_id: UUID, achievement: Dict[str, Any]):
        """Notify all observers about achievement"""
        for observer in self.observers:
            await observer.notify(user_id, achievement)
    
    async def check_goals(
        self, 
        user_id: UUID, 
        daily_stats: Dict[str, Any], 
        user_goals: Dict[str, int],
        target_date: date = None
    ):
        """Check if goals achieved and notify observers"""
        if not target_date:
            target_date = date.today()
        
        goal_types = {
            'calories': ('total_calories', 'daily_calorie_goal'),
            'protein': ('total_protein_g', 'daily_protein_goal'),
            'carbs': ('total_carbs_g', 'daily_carbs_goal'),
            'fat': ('total_fat_g', 'daily_fat_goal')
        }
        
        for goal_type, (stat_key, goal_key) in goal_types.items():
            actual_value = float(daily_stats.get(stat_key, 0))
            goal_value = user_goals.get(goal_key, 0)
            
            if goal_value <= 0:
                continue
            
            percentage = round((actual_value / goal_value) * 100, 1)
            cache_key = f"{user_id}_{goal_type}_{target_date}"
            
            if percentage >= 100 and cache_key not in self.achievement_cache:
                achievement = {
                    'goal_type': goal_type,
                    'goal_value': goal_value,
                    'actual_value': round(actual_value, 1),
                    'percentage': percentage,
                    'date': target_date,
                    'achieved': True
                }
                await self.notify_observers(user_id, achievement)
                self.achievement_cache[cache_key] = True
            
            elif 90 <= percentage < 100 and f"{cache_key}_90" not in self.achievement_cache:
                achievement = {
                    'goal_type': goal_type,
                    'goal_value': goal_value,
                    'actual_value': round(actual_value, 1),
                    'percentage': percentage,
                    'date': target_date,
                    'achieved': False,
                    'milestone': '90%'
                }
                await self.notify_observers(user_id, achievement)
                self.achievement_cache[f"{cache_key}_90"] = True
            
            elif 80 <= percentage < 90 and f"{cache_key}_80" not in self.achievement_cache:
                achievement = {
                    'goal_type': goal_type,
                    'goal_value': goal_value,
                    'actual_value': round(actual_value, 1),
                    'percentage': percentage,
                    'date': target_date,
                    'achieved': False,
                    'milestone': '80%'
                }
                await self.notify_observers(user_id, achievement)
                self.achievement_cache[f"{cache_key}_80"] = True
    
    def clear_cache_for_date(self, target_date: date):
        """Clear achievement cache for specific date"""
        keys_to_remove = [k for k in self.achievement_cache.keys() if str(target_date) in k]
        for key in keys_to_remove:
            del self.achievement_cache[key]


_goal_tracker: GoalTracker = None
_toast_observer: ToastNotificationObserver = None


def get_goal_tracker() -> GoalTracker:
    """
    Pattern: Singleton (Creational)
    Get or create global GoalTracker instance
    """
    global _goal_tracker, _toast_observer
    
    if _goal_tracker is None:
        _goal_tracker = GoalTracker()
        _toast_observer = ToastNotificationObserver()
        logging_observer = LoggingObserver()
        
        _goal_tracker.attach(_toast_observer)
        _goal_tracker.attach(logging_observer)
        
        logger.info("GoalTracker initialized with observers")
    
    return _goal_tracker


def get_toast_observer() -> ToastNotificationObserver:
    """Get toast notification observer for retrieving notifications"""
    global _toast_observer
    if _toast_observer is None:
        get_goal_tracker()
    return _toast_observer
