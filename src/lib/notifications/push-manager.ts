'use client';

import { 
  NotificationPermissionState, 
  PushSubscriptionData, 
  MealReminderPreferences, 
  DEFAULT_MEAL_REMINDERS 
} from '@/types/notifications';

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  
  // Singleton pattern for consistent state management
  public static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  /**
   * Check if push notifications are supported in the current browser
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check if Declarative Web Push is supported (Safari 18.5+, iOS 18.4+)
   */
  public isDeclarativeWebPushSupported(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check for window.pushManager (new in Declarative Web Push)
    return 'pushManager' in window && this.isSupported();
  }

  /**
   * Get current notification permission state and subscription info
   */
  public async getPermissionState(): Promise<NotificationPermissionState> {
    if (!this.isSupported()) {
      return {
        supported: false,
        permission: 'denied',
        subscription: null,
        error: 'Push notifications are not supported in this browser'
      };
    }

    try {
      const permission = Notification.permission;
      
      let subscription: PushSubscription | null = null;

      if (permission === 'granted') {
        // Try to get existing subscription
        const registration = await this.getServiceWorkerRegistration();
        if (registration) {
          subscription = await registration.pushManager.getSubscription();
        } else if (this.isDeclarativeWebPushSupported()) {
          // For declarative web push, use window.pushManager
          subscription = await (window as any).pushManager.getSubscription();
        }
      }

      return {
        supported: true,
        permission,
        subscription,
      };
    } catch (error) {
      console.error('Error getting permission state:', error);
      return {
        supported: true,
        permission: Notification.permission,
        subscription: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Request notification permission and set up push subscription
   */
  public async requestPermissionAndSubscribe(): Promise<{
    success: boolean;
    subscription?: PushSubscription;
    error?: string;
  }> {
    try {
      if (!this.isSupported()) {
        throw new Error('Push notifications are not supported');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error(`Permission denied. Status: ${permission}`);
      }

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      let subscription: PushSubscription;

      // Try Declarative Web Push first (for Safari)
      if (this.isDeclarativeWebPushSupported()) {
        try {
          subscription = await (window as any).pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
          });
          console.log('Subscribed using Declarative Web Push');
        } catch (error) {
          console.log('Declarative Web Push failed, falling back to Service Worker approach');
          subscription = await this.subscribeWithServiceWorker(vapidPublicKey);
        }
      } else {
        // Use traditional Service Worker approach
        subscription = await this.subscribeWithServiceWorker(vapidPublicKey);
      }

      // Store subscription
      this.subscription = subscription;
      
      // Save subscription to backend
      await this.saveSubscriptionToServer(subscription);

      return {
        success: true,
        subscription
      };

    } catch (error) {
      console.error('Error requesting permission and subscribing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Subscribe using traditional Service Worker approach
   */
  private async subscribeWithServiceWorker(vapidPublicKey: string): Promise<PushSubscription> {
    const registration = await this.getServiceWorkerRegistration();
    if (!registration) {
      throw new Error('Service Worker registration failed');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Subscribed using Service Worker');
    return subscription;
  }

  /**
   * Get or register Service Worker
   */
  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.swRegistration) {
      return this.swRegistration;
    }

    try {
      // Check for existing registration
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      
      if (existingRegistration) {
        this.swRegistration = existingRegistration;
        console.log('Found existing Service Worker registration');
      } else {
        // Register new Service Worker
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('Registered new Service Worker');
      }

      // Wait for Service Worker to be ready
      await navigator.serviceWorker.ready;
      
      return this.swRegistration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Save push subscription to server
   */
  private async saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData: Partial<PushSubscriptionData> = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        },
        userAgent: navigator.userAgent,
        isActive: true
      };

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save subscription');
      }

      console.log('Subscription saved to server');
    } catch (error) {
      console.error('Error saving subscription to server:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  public async unsubscribe(): Promise<{ success: boolean; error?: string }> {
    try {
      let unsubscribed = false;

      // Try to unsubscribe from current subscription
      if (this.subscription) {
        unsubscribed = await this.subscription.unsubscribe();
        this.subscription = null;
      } else {
        // Try to get and unsubscribe from existing subscription
        const state = await this.getPermissionState();
        if (state.subscription) {
          unsubscribed = await state.subscription.unsubscribe();
        }
      }

      // Remove subscription from server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return {
        success: unsubscribed,
        error: unsubscribed ? undefined : 'Failed to unsubscribe'
      };
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a test notification
   */
  public async sendTestNotification(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test notification');
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending test notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Set up meal reminders
   */
  public async setupMealReminders(preferences: MealReminderPreferences): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/notifications/meal-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup meal reminders');
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting up meal reminders:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get meal reminder preferences
   */
  public async getMealReminderPreferences(): Promise<MealReminderPreferences> {
    try {
      const response = await fetch('/api/notifications/meal-reminders');
      
      if (!response.ok) {
        console.log('No existing preferences found, using defaults');
        return DEFAULT_MEAL_REMINDERS;
      }

      const preferences = await response.json();
      return preferences;
    } catch (error) {
      console.error('Error getting meal reminder preferences:', error);
      return DEFAULT_MEAL_REMINDERS;
    }
  }

  /**
   * Utility: Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance(); 