interface NotificationSettings {
  mealReminders: boolean;
  workoutReminders: boolean;
  hydrationReminders: boolean;
  weeklyReports: boolean;
  achievementAlerts: boolean;
  lunchReminderTime?: string; // Time in HH:MM format, default "14:00"
}

interface ScheduledReminder {
  id: string;
  type: 'lunch' | 'workout' | 'hydration';
  time: string; // HH:MM format
  title: string;
  body: string;
  enabled: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationPermission: NotificationPermission = 'default';
  private scheduledReminders: ScheduledReminder[] = [];
  private timeoutIds: Map<string, number> = new Map();

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init() {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;

    // Request notification permission
    await this.requestPermission();

    // Load saved settings
    this.loadSettings();

    // Schedule default reminders
    this.scheduleDefaultReminders();
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notifications are denied');
      return false;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    }

    this.notificationPermission = Notification.permission;
    return Notification.permission === 'granted';
  }

  public isPermissionGranted(): boolean {
    return this.notificationPermission === 'granted';
  }

  private loadSettings(): NotificationSettings {
    if (typeof window === 'undefined') {
      return this.getDefaultSettings();
    }

    const saved = localStorage.getItem('fitally-notification-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
    return this.getDefaultSettings();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      mealReminders: true,
      workoutReminders: true,
      hydrationReminders: false,
      weeklyReports: true,
      achievementAlerts: true,
      lunchReminderTime: '14:00'
    };
  }

  public saveSettings(settings: NotificationSettings): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('fitally-notification-settings', JSON.stringify(settings));
    
    // Update scheduled reminders based on new settings
    this.updateScheduledReminders(settings);
  }

  public getSettings(): NotificationSettings {
    return this.loadSettings();
  }

  private scheduleDefaultReminders(): void {
    const settings = this.loadSettings();
    
    // Schedule lunch reminder
    if (settings.mealReminders) {
      this.scheduleLunchReminder(settings.lunchReminderTime || '14:00');
    }

    // Add other default reminders here
    if (settings.hydrationReminders) {
      this.scheduleHydrationReminders();
    }
  }

  private updateScheduledReminders(settings: NotificationSettings): void {
    // Clear all existing timeouts
    this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeoutIds.clear();

    // Reschedule based on new settings
    if (settings.mealReminders) {
      this.scheduleLunchReminder(settings.lunchReminderTime || '14:00');
    }

    if (settings.hydrationReminders) {
      this.scheduleHydrationReminders();
    }
  }

  public scheduleLunchReminder(time: string = '14:00'): void {
    const reminderId = 'lunch-reminder';
    
    // Clear existing lunch reminder
    const existingTimeout = this.timeoutIds.get(reminderId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const scheduleForToday = () => {
      const now = new Date();
      const [hours, minutes] = time.split(':').map(Number);
      
      const reminderTime = new Date();
      reminderTime.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const msUntilReminder = reminderTime.getTime() - now.getTime();

      const timeoutId = setTimeout(() => {
        this.showLunchReminder();
        // Schedule the next one for tomorrow
        scheduleForToday();
      }, msUntilReminder);

      this.timeoutIds.set(reminderId, timeoutId);

      console.log(`Lunch reminder scheduled for ${reminderTime.toLocaleString()}`);
    };

    scheduleForToday();
  }

  private async showLunchReminder(): Promise<void> {
    if (!this.isPermissionGranted()) {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    const title = '🍽️ Lunch Time!';
    const body = 'Time to log your lunch! Remember to track your meal for better health insights.';
    const options: NotificationOptions = {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'lunch-reminder',
      requireInteraction: true
    };

    try {
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        // Navigate to meal logging page
        window.location.href = '/capture';
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  private scheduleHydrationReminders(): void {
    // Schedule hydration reminders every 2 hours from 8 AM to 8 PM
    const hydrationTimes = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
    
    hydrationTimes.forEach((time, index) => {
      const reminderId = `hydration-reminder-${index}`;
      
      // Clear existing reminder
      const existingTimeout = this.timeoutIds.get(reminderId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const scheduleHydrationForToday = () => {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        
        const reminderTime = new Date();
        reminderTime.setHours(hours, minutes, 0, 0);

        if (reminderTime <= now) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const msUntilReminder = reminderTime.getTime() - now.getTime();

        const timeoutId = setTimeout(() => {
          this.showHydrationReminder();
          scheduleHydrationForToday();
        }, msUntilReminder);

        this.timeoutIds.set(reminderId, timeoutId);
      };

      scheduleHydrationForToday();
    });
  }

  private async showHydrationReminder(): Promise<void> {
    if (!this.isPermissionGranted()) return;

    const title = '💧 Hydration Reminder';
    const body = 'Time to drink some water! Stay hydrated for better health.';
    
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'hydration-reminder',
      });

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show hydration notification:', error);
    }
  }

  public async showNotification(title: string, body: string, options?: NotificationOptions): Promise<void> {
    if (!this.isPermissionGranted()) {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        ...options
      });

      // Auto-close after 5 seconds unless specified otherwise
      if (!options?.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  public clearAllReminders(): void {
    this.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeoutIds.clear();
  }

  // Achievement notification
  public async showAchievementNotification(title: string, message: string): Promise<void> {
    const settings = this.loadSettings();
    if (!settings.achievementAlerts) return;

    await this.showNotification(`🎉 ${title}`, message, {
      requireInteraction: true,
      tag: 'achievement'
    });
  }

  // Meal logging notification
  public async showMealLoggedNotification(mealType: string): Promise<void> {
    await this.showNotification(
      '✅ Meal Logged!',
      `Your ${mealType} has been successfully logged.`,
      { tag: 'meal-logged' }
    );
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export type { NotificationSettings, ScheduledReminder };