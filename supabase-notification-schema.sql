-- Push Subscriptions Table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL, -- {p256dh: string, auth: string}
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Meal Reminder Preferences Table
CREATE TABLE IF NOT EXISTS meal_reminder_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Breakfast settings
  breakfast_enabled BOOLEAN DEFAULT true,
  breakfast_time TIME DEFAULT '08:00',
  breakfast_message TEXT DEFAULT '🌅 Good morning! Time for a healthy breakfast to fuel your day!',
  
  -- Lunch settings
  lunch_enabled BOOLEAN DEFAULT true,
  lunch_time TIME DEFAULT '12:30',
  lunch_message TEXT DEFAULT '🥗 Lunch time! Don''t forget to log your nutritious meal.',
  
  -- Dinner settings
  dinner_enabled BOOLEAN DEFAULT true,
  dinner_time TIME DEFAULT '18:30',
  dinner_message TEXT DEFAULT '🍽️ Dinner time! Cap off your day with a balanced meal.',
  
  -- Snacks settings
  snacks_enabled BOOLEAN DEFAULT false,
  snack_times TEXT[] DEFAULT ARRAY['10:00', '15:30'],
  snacks_message TEXT DEFAULT '🍎 Snack time! How about something healthy?',
  
  -- General settings
  timezone TEXT DEFAULT 'UTC',
  reminder_minutes INTEGER DEFAULT 15,
  weekdays BOOLEAN[] DEFAULT ARRAY[true, true, true, true, true, true, true], -- [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Notifications Table (for tracking sent notifications)
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  scheduled_time TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- Notification Statistics Table (for tracking engagement)
CREATE TABLE IF NOT EXISTS notification_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  meal_type TEXT,
  action_taken TEXT, -- 'clicked', 'dismissed', 'logged', 'snoozed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_meal_preferences_user_id ON meal_reminder_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_time ON scheduled_notifications(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_notification_stats_user_id ON notification_stats(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_stats ENABLE ROW LEVEL SECURITY;

-- Push subscriptions policies
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Meal reminder preferences policies
CREATE POLICY "Users can view own meal preferences" ON meal_reminder_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal preferences" ON meal_reminder_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal preferences" ON meal_reminder_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal preferences" ON meal_reminder_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Scheduled notifications policies  
CREATE POLICY "Users can view own scheduled notifications" ON scheduled_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled notifications" ON scheduled_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled notifications" ON scheduled_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Notification stats policies
CREATE POLICY "Users can view own notification stats" ON notification_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification stats" ON notification_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_preferences_updated_at 
  BEFORE UPDATE ON meal_reminder_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 