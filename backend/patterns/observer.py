"""
Observer Pattern: Event notification system
Notifies subscribers about events (recipe creation, analysis completion, etc.)
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime
from enum import Enum


class EventType(Enum):
    """Types of events in the system"""
    RECIPE_CREATED = "recipe_created"
    DISH_ANALYZED = "dish_analyzed"
    USER_PREFERENCE_UPDATED = "user_preference_updated"
    NUTRITION_GOAL_ACHIEVED = "nutrition_goal_achieved"


class Observer(ABC):
    """Abstract Observer interface"""
    
    @abstractmethod
    def update(self, event_type: EventType, data: Dict[str, Any]):
        """Called when an event occurs"""
        pass


class EmailNotificationObserver(Observer):
    """Observer that sends email notifications"""
    
    def update(self, event_type: EventType, data: Dict[str, Any]):
        """Send email notification"""
        print(f"[EMAIL] Sending notification for {event_type.value}")
        print(f"[EMAIL] Data: {data}")
        # In production, integrate with email service
        # e.g., SendGrid, AWS SES, etc.


class DatabaseLogObserver(Observer):
    """Observer that logs events to database"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def update(self, event_type: EventType, data: Dict[str, Any]):
        """Log event to database"""
        try:
            log_entry = {
                'event_type': event_type.value,
                'data': data,
                'timestamp': datetime.utcnow().isoformat()
            }
            self.supabase.table('event_logs').insert(log_entry).execute()
            print(f"[DATABASE] Logged event: {event_type.value}")
        except Exception as e:
            print(f"[DATABASE] Error logging event: {str(e)}")


class AnalyticsObserver(Observer):
    """Observer that tracks analytics"""
    
    def update(self, event_type: EventType, data: Dict[str, Any]):
        """Track analytics event"""
        print(f"[ANALYTICS] Tracking {event_type.value}")
        print(f"[ANALYTICS] Metrics: {data}")
        # In production, integrate with analytics service
        # e.g., Google Analytics, Mixpanel, etc.


class WebhookObserver(Observer):
    """Observer that triggers webhooks"""
    
    def __init__(self, webhook_urls: Dict[EventType, List[str]]):
        self.webhook_urls = webhook_urls
    
    def update(self, event_type: EventType, data: Dict[str, Any]):
        """Trigger webhooks"""
        urls = self.webhook_urls.get(event_type, [])
        for url in urls:
            print(f"[WEBHOOK] Triggering {url} for {event_type.value}")
            # In production, make HTTP POST request to webhook URL
            # import httpx
            # httpx.post(url, json=data)


class EventPublisher:
    """
    Observer Pattern: Event Publisher (Subject)
    Manages observers and notifies them of events
    """
    
    def __init__(self):
        self._observers: Dict[EventType, List[Observer]] = {
            event_type: [] for event_type in EventType
        }
    
    def subscribe(self, event_type: EventType, observer: Observer):
        """Subscribe an observer to an event type"""
        if observer not in self._observers[event_type]:
            self._observers[event_type].append(observer)
            print(f"Observer {observer.__class__.__name__} subscribed to {event_type.value}")
    
    def unsubscribe(self, event_type: EventType, observer: Observer):
        """Unsubscribe an observer from an event type"""
        if observer in self._observers[event_type]:
            self._observers[event_type].remove(observer)
            print(f"Observer {observer.__class__.__name__} unsubscribed from {event_type.value}")
    
    def notify(self, event_type: EventType, data: Dict[str, Any]):
        """Notify all observers of an event"""
        print(f"\n=== Publishing Event: {event_type.value} ===")
        observers = self._observers.get(event_type, [])
        
        for observer in observers:
            try:
                observer.update(event_type, data)
            except Exception as e:
                print(f"Error notifying observer {observer.__class__.__name__}: {str(e)}")
        
        print(f"=== Event Published to {len(observers)} observers ===\n")


# Global event publisher instance
event_publisher = EventPublisher()


def publish_recipe_created(recipe_id: str, recipe_title: str, user_id: str):
    """Convenience function to publish recipe creation event"""
    event_publisher.notify(
        EventType.RECIPE_CREATED,
        {
            'recipe_id': recipe_id,
            'recipe_title': recipe_title,
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }
    )


def publish_dish_analyzed(dish_name: str, calories: float, user_id: str):
    """Convenience function to publish dish analysis event"""
    event_publisher.notify(
        EventType.DISH_ANALYZED,
        {
            'dish_name': dish_name,
            'calories': calories,
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }
    )
