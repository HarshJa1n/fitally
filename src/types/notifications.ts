export interface MealReminderSettings {
  id: string;
  userId: string;
  enabled: boolean;
  breakfast: {
    enabled: boolean;
    time: string; // HH:MM format
    reminderMinutes: number; // minutes before meal time
  };
  lunch: {
    enabled: boolean;
    time: string;
    reminderMinutes: number;
  };
  dinner: {
    enabled: boolean;
    time: string;
    reminderMinutes: number;
  };
  snacks: {
    enabled: boolean;
    times: string[]; // Multiple snack times
    reminderMinutes: number;
  };
  timezone: string;
  weekdays: boolean[]; // [Sunday, Monday, ..., Saturday]
  createdAt: string;
  updatedAt: string;
}

export interface PushSubscriptionData {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    type: 'meal_reminder' | 'general' | 'achievement' | 'weekly_summary';
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    timestamp: number;
    userId: string;
  };
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface DeclarativeNotificationPayload {
  web_push: 8030;
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    navigate: string;
    type?: string;
    mealType?: string;
    silent?: boolean;
    app_badge?: string;
  };
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  scheduledTime: string; // ISO string
  payload: NotificationPayload;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
  sentAt?: string;
}

export interface NotificationPermissionState {
  supported: boolean;
  permission: 'default' | 'granted' | 'denied';
  subscription: PushSubscription | null;
  error?: string;
}

export interface MealReminderPreferences {
  breakfast: {
    enabled: boolean;
    time: string;
    message: string;
  };
  lunch: {
    enabled: boolean;
    time: string;
    message: string;
  };
  dinner: {
    enabled: boolean;
    time: string;
    message: string;
  };
  snacks: {
    enabled: boolean;
    times: string[];
    message: string;
  };
  timezone: string;
  reminderMinutes: number;
  weekdays: boolean[];
}

export const DEFAULT_MEAL_REMINDERS: MealReminderPreferences = {
  breakfast: {
    enabled: true,
    time: '08:00',
    message: '🌅 Good morning! Time for a healthy breakfast to fuel your day!'
  },
  lunch: {
    enabled: true,
    time: '12:30',
    message: '🥗 Lunch time! Don\'t forget to log your nutritious meal.'
  },
  dinner: {
    enabled: true,
    time: '18:30',
    message: '🍽️ Dinner time! Cap off your day with a balanced meal.'
  },
  snacks: {
    enabled: false,
    times: ['10:00', '15:30'],
    message: '🍎 Snack time! How about something healthy?'
  },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  reminderMinutes: 15,
  weekdays: [true, true, true, true, true, true, true] // All days enabled by default
};

export interface NotificationStats {
  totalSent: number;
  totalClicked: number;
  clickRate: number;
  mealReminders: {
    breakfast: { sent: number; clicked: number };
    lunch: { sent: number; clicked: number };
    dinner: { sent: number; clicked: number };
    snacks: { sent: number; clicked: number };
  };
  lastWeek: {
    sent: number;
    clicked: number;
  };
} 