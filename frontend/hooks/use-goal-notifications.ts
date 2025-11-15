/**
 * useGoalNotifications Hook - Observer Pattern (Frontend)
 * 
 * Custom React hook that polls the backend for goal achievement notifications
 * Integrates with backend Observer Pattern implementation (GoalObserver, NotificationObserver)
 * Displays toast notifications when nutrition goals are achieved or progress milestones are reached
 * 
 * Backend Integration:
 * - Calls getNotifications() which triggers backend Observer pattern
 * - Backend NotificationObserver creates notifications when goals are achieved
 * - Frontend displays these notifications as toasts with visual feedback
 */
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getNotifications, markNotificationRead } from '@/lib/api-client';

interface GoalNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  achievement: {
    goal_type: string;
    percentage: number;
    actual_value: number;
    goal_value: number;
    achieved: boolean;
  };
  read: boolean;
  created_at: string;
}

export function useGoalNotifications(enabled: boolean = true) {
  const checkNotifications = useCallback(async () => {
    if (!enabled) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      console.log('[Goal Notifications] Checking for notifications...');
      const response = await getNotifications(token, true);
      console.log('[Goal Notifications] Response:', response);
      const notifications: GoalNotification[] = response.notifications || [];

      console.log('[Goal Notifications] Found', notifications.length, 'notifications');

      for (const notification of notifications) {
        const { title, message, achievement, id } = notification;

        console.log('[Goal Notifications] Displaying:', title);

        const percentage = achievement.percentage;
        
        if (percentage >= 100) {
          toast.success(title, {
            description: message,
            duration: 6000,
            action: {
              label: 'Awesome!',
              onClick: () => markNotificationRead(id, token).catch(console.error),
            },
          });
        } else if (percentage >= 90) {
          toast.info(title, {
            description: message,
            duration: 5000,
            action: {
              label: 'Got it',
              onClick: () => markNotificationRead(id, token).catch(console.error),
            },
          });
        } else {
          toast(title, {
            description: message,
            duration: 4000,
          });
        }

        try {
          await markNotificationRead(id, token);
          console.log('[Goal Notifications] Marked as read:', id);
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      }
    } catch (error) {
      console.error('[Goal Notifications] Failed to fetch notifications:', error);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    checkNotifications();

    const interval = setInterval(checkNotifications, 30000);

    return () => clearInterval(interval);
  }, [checkNotifications, enabled]);

  return {
    checkNotifications,
  };
}
