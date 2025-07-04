const CACHE_NAME = 'fitally-v1';
const urlsToCache = [
  '/',
  '/capture',
  '/analytics',
  '/profile',
  '/favicon.ico'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache each URL individually to avoid failing on one bad URL
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: Install Complete');
      })
      .catch(err => {
        console.error('Service Worker: Install Failed', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received:', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      const data = event.data.json();
      
      // Check if it's a declarative web push format
      if (data.web_push === 8030 && data.notification) {
        // Declarative format - browser will handle this automatically
        // But we can still customize if needed
        notificationData = {
          title: data.notification.title,
          body: data.notification.body,
          icon: data.notification.icon || '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            url: data.notification.navigate || '/',
            type: data.notification.type || 'general',
            mealType: data.notification.mealType,
            timestamp: Date.now()
          },
          actions: getMealReminderActions(data.notification.mealType),
          vibrate: [200, 100, 200],
          requireInteraction: true,
          silent: false
        };
      } else {
        // Traditional format
        notificationData = {
          title: data.title || 'Fitally Reminder',
          body: data.body || 'Time for a healthy choice!',
          icon: data.icon || '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            url: data.url || '/',
            type: data.type || 'general',
            mealType: data.mealType,
            timestamp: Date.now()
          },
          actions: getMealReminderActions(data.mealType),
          vibrate: [200, 100, 200],
          requireInteraction: true,
          silent: false
        };
      }
    } else {
      // Fallback notification
      notificationData = {
        title: 'Fitally Health Reminder',
        body: 'Don\'t forget to log your activities!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          url: '/',
          type: 'general',
          timestamp: Date.now()
        },
        vibrate: [200, 100, 200]
      };
    }
    
    event.waitUntil(
      self.registration.showNotification(notificationData.title, notificationData)
    );
  } catch (error) {
    console.error('[Service Worker] Error handling push:', error);
    
    // Fallback notification in case of error
    event.waitUntil(
      self.registration.showNotification('Fitally Health Reminder', {
        body: 'Time to check your health goals!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: { url: '/' }
      })
    );
  }
});

// Helper function to get meal-specific actions
function getMealReminderActions(mealType) {
  const baseActions = [
    {
      action: 'log',
      title: '📝 Log Now',
      icon: '/favicon.ico'
    },
    {
      action: 'snooze',
      title: '⏰ Remind in 30min',
      icon: '/favicon.ico'
    }
  ];
  
  if (mealType) {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return [
          {
            action: 'log',
            title: '🥐 Log Breakfast',
            icon: '/favicon.ico'
          },
          ...baseActions.slice(1)
        ];
      case 'lunch':
        return [
          {
            action: 'log',
            title: '🥗 Log Lunch',
            icon: '/favicon.ico'
          },
          ...baseActions.slice(1)
        ];
      case 'dinner':
        return [
          {
            action: 'log',
            title: '🍽️ Log Dinner',
            icon: '/favicon.ico'
          },
          ...baseActions.slice(1)
        ];
      case 'snack':
        return [
          {
            action: 'log',
            title: '🍎 Log Snack',
            icon: '/favicon.ico'
          },
          ...baseActions.slice(1)
        ];
      default:
        return baseActions;
    }
  }
  
  return baseActions;
}

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  if (action === 'log') {
    // Direct to capture page with meal type
    const url = data.mealType 
      ? `/capture?type=food&meal=${data.mealType}` 
      : '/capture?type=food';
    
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (action === 'snooze') {
    // Schedule a reminder in 30 minutes
    event.waitUntil(
      scheduleSnoozeReminder(data)
    );
  } else {
    // Default action - open the app
    const targetUrl = data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(targetUrl.split('?')[0]) && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not found
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  }
});

// Background sync for offline meal logging
self.addEventListener('sync', (event) => {
  if (event.tag === 'meal-log-sync') {
    event.waitUntil(syncOfflineMealLogs());
  }
});

// Helper function to schedule snooze reminder
async function scheduleSnoozeReminder(data) {
  try {
    // Send request to backend to schedule another notification
    await fetch('/api/notifications/snooze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mealType: data.mealType,
        originalTime: data.timestamp,
        snoozeMinutes: 30
      })
    });
    
    console.log('[Service Worker] Snooze reminder scheduled');
  } catch (error) {
    console.error('[Service Worker] Failed to schedule snooze:', error);
  }
}

// Helper function to sync offline meal logs
async function syncOfflineMealLogs() {
  try {
    // Get offline logs from IndexedDB or cache
    const offlineLogs = await getOfflineMealLogs();
    
    for (const log of offlineLogs) {
      try {
        const response = await fetch('/api/meals/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(log)
        });
        
        if (response.ok) {
          // Remove synced log from offline storage
          await removeOfflineMealLog(log.id);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync meal log:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Background sync failed:', error);
  }
}

// Placeholder functions for offline meal logging
async function getOfflineMealLogs() {
  // Implementation would use IndexedDB or similar
  return [];
}

async function removeOfflineMealLog(id) {
  // Implementation would remove from IndexedDB
  console.log(`Removing offline meal log: ${id}`);
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 