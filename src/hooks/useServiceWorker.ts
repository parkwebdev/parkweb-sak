/**
 * Hook for managing service worker registration and updates.
 * Provides access to the SW registration for push notification subscriptions.
 * 
 * @module hooks/useServiceWorker
 */

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isReady: boolean;
  isUpdateAvailable: boolean;
  error: Error | null;
}

/**
 * Hook to manage service worker lifecycle.
 * Automatically registers and tracks SW state.
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    registration: null,
    isReady: false,
    isUpdateAvailable: false,
    error: null,
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      logger.warn('Service workers not supported in this browser');
      return;
    }

    // Wait for the service worker to be ready
    navigator.serviceWorker.ready
      .then((registration) => {
        setState(prev => ({
          ...prev,
          registration,
          isReady: true,
        }));
        logger.info('Service worker ready');

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, isUpdateAvailable: true }));
                logger.info('New service worker update available');
              }
            });
          }
        });
      })
      .catch((error) => {
        setState(prev => ({ ...prev, error }));
        logger.error('Service worker registration failed:', error);
      });

    // Listen for controller changes (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      logger.info('Service worker controller changed');
    });
  }, []);

  /**
   * Skip waiting and activate new service worker immediately.
   * Use when user confirms they want to update.
   */
  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [state.registration]);

  /**
   * Check for service worker updates.
   */
  const checkForUpdates = useCallback(async () => {
    if (state.registration) {
      try {
        await state.registration.update();
        logger.info('Checked for service worker updates');
      } catch (error) {
        logger.error('Failed to check for SW updates:', error);
      }
    }
  }, [state.registration]);

  return {
    ...state,
    skipWaiting,
    checkForUpdates,
  };
}
