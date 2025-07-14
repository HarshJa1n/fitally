-- Setup script for Fitally Meal Reminder Cron Job
-- Run this in your Supabase SQL Editor

-- 1. Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule meal reminder function to run every 15 minutes
-- Replace 'brkqcahswbakbhwxxjlt' with your actual project reference
SELECT cron.schedule(
  'meal-reminder-scheduler',
  '*/15 * * * *', -- Every 15 minutes
  $$ 
  SELECT 
    net.http_post(
      url := 'https://brkqcahswbakbhwxxjlt.supabase.co/functions/v1/meal-reminder-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- 3. Alternative: More precise timing - run at :00, :15, :30, :45 of every hour
-- Uncomment this if you prefer precise timing over 15-minute intervals
/*
SELECT cron.schedule(
  'meal-reminder-scheduler-precise',
  '0,15,30,45 * * * *', -- At :00, :15, :30, :45 minutes of every hour
  $$ 
  SELECT 
    net.http_post(
      url := 'https://brkqcahswbakbhwxxjlt.supabase.co/functions/v1/meal-reminder-scheduler',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
*/

-- 4. Check if the cron job was created successfully
SELECT * FROM cron.job WHERE jobname = 'meal-reminder-scheduler';

-- 5. To view cron job logs later, use:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'meal-reminder-scheduler') ORDER BY start_time DESC LIMIT 10;

-- 6. To unschedule/remove the cron job if needed:
-- SELECT cron.unschedule('meal-reminder-scheduler'); 