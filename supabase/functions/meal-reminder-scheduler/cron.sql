-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule meal reminder function to run every 15 minutes
-- This will call the edge function every 15 minutes to check for pending notifications
SELECT cron.schedule(
  'meal-reminder-scheduler',
  '*/15 * * * *', -- Every 15 minutes
  $$ 
  SELECT 
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/meal-reminder-scheduler',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Alternative: Schedule at specific intervals for better timing
-- Run at :00, :15, :30, :45 minutes of every hour
SELECT cron.schedule(
  'meal-reminder-scheduler-precise',
  '0,15,30,45 * * * *',
  $$ 
  SELECT 
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/meal-reminder-scheduler',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Check cron jobs
-- SELECT * FROM cron.job;

-- To remove a cron job if needed:
-- SELECT cron.unschedule('meal-reminder-scheduler');
-- SELECT cron.unschedule('meal-reminder-scheduler-precise'); 