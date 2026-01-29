/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// Precache static assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches from previous versions
cleanupOutdatedCaches();

/**
 * Handle push notifications from the server.
 * These work even when the app tab is closed.
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options: NotificationOptions = {
      body: data.body || 'You have a new notification',
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: data.tag || `notification-${Date.now()}`,
      data: {
        url: data.url || '/',
        notificationId: data.notificationId,
      },
      // Only add these for browsers that support them
      ...(data.requireInteraction !== undefined && { requireInteraction: data.requireInteraction }),
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Pilot', options)
    );
  } catch (error: unknown) {
    console.error('Error handling push notification:', error);
  }
});

/**
 * Handle notification click events.
 * Opens the app and navigates to the relevant page.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Try to focus an existing window first
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              if ('navigate' in client) {
                return (client as WindowClient).navigate(url);
              }
            });
          }
        }
        // Open new window if no existing window found
        return self.clients.openWindow(url);
      })
  );
});

/**
 * Handle service worker activation.
 * Claims all clients immediately for faster updates.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Handle service worker messages from the main thread.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
