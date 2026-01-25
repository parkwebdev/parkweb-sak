/**
 * Push Subscription Hook
 * 
 * Manages Web Push subscription lifecycle using VAPID keys.
 * Handles subscribing/unsubscribing and syncing with the database.
 * 
 * @module hooks/usePushSubscription
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = 'BLzV9aE5oTF_2bGk8lJQv8sEbE3IzLQxVmcMZxDhJz0YwqJKVEwYHpCpN_kFhN2wP0xE5RQz4xKNhJwYVxqPz8Y';

/**
 * Convert a base64 string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushSubscriptionState {
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

/**
 * Hook for managing Web Push subscriptions.
 * 
 * @returns {Object} Push subscription state and actions
 */
export function usePushSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<PushSubscriptionState>({
    isSubscribed: false,
    isLoading: true,
    error: null,
    isSupported: false,
  });

  // Check if push is supported
  const isSupported = 
    'serviceWorker' in navigator && 
    'PushManager' in window && 
    'Notification' in window;

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!isSupported || !user) {
      setState(prev => ({ ...prev, isLoading: false, isSupported }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState({
        isSubscribed: !!subscription,
        isLoading: false,
        error: null,
        isSupported: true,
      });
    } catch (error: unknown) {
      logger.error('Error checking push subscription:', error);
      setState({
        isSubscribed: false,
        isLoading: false,
        error: getErrorMessage(error),
        isSupported: true,
      });
    }
  }, [isSupported, user]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request notification permission if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Notification permission denied' 
          }));
          return false;
        }
      } else if (Notification.permission === 'denied') {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Notifications are blocked in browser settings' 
        }));
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Convert VAPID key to ArrayBuffer (required by pushManager.subscribe)
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      
      // Subscribe to push with VAPID key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      // Extract keys from subscription
      const subscriptionJson = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = subscriptionJson.keys?.p256dh || '';
      const auth = subscriptionJson.keys?.auth || '';

      // Save to database (upsert based on endpoint)
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
        }, {
          onConflict: 'endpoint',
        });

      if (dbError) {
        logger.error('Error saving push subscription:', dbError);
        // Unsubscribe if we couldn't save
        await subscription.unsubscribe();
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: getErrorMessage(dbError) 
        }));
        return false;
      }

      setState({
        isSubscribed: true,
        isLoading: false,
        error: null,
        isSupported: true,
      });

      logger.info('Push subscription created successfully');
      return true;
    } catch (error: unknown) {
      logger.error('Error subscribing to push:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: getErrorMessage(error) 
      }));
      return false;
    }
  }, [isSupported, user]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Delete from database first
        const { error: dbError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);

        if (dbError) {
          logger.error('Error deleting push subscription from DB:', dbError);
        }

        // Unsubscribe from browser
        await subscription.unsubscribe();
      }

      setState({
        isSubscribed: false,
        isLoading: false,
        error: null,
        isSupported: true,
      });

      logger.info('Push subscription removed successfully');
      return true;
    } catch (error: unknown) {
      logger.error('Error unsubscribing from push:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: getErrorMessage(error) 
      }));
      return false;
    }
  }, [isSupported, user]);

  // Check subscription status on mount
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    refresh: checkSubscription,
  };
}
