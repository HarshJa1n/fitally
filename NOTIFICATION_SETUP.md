# Fitally Notification System Setup Guide

This guide will help you set up the background meal reminder notification system for Fitally.

## Overview

The notification system consists of:
- ✅ **Frontend UI**: User configuration interface (already working)
- ✅ **Database Schema**: Tables for preferences and tracking (already deployed)
- ✅ **Web Push**: Browser notification infrastructure (already working)
- 🆕 **Background Scheduler**: Edge function + cron job (new implementation)

## Prerequisites

1. **Supabase Project**: You need a Supabase project with:
   - Database access
   - Edge Functions enabled
   - `pg_cron` extension enabled

2. **VAPID Keys**: Web push notification keys
   ```bash
   npx web-push generate-vapid-keys
   ```

## Step 1: Environment Variables

Copy `env.example` to `.env.local` and fill in your values:

```bash
cp env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (for edge functions)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: VAPID public key
- `VAPID_PRIVATE_KEY`: VAPID private key
- `VAPID_SUBJECT`: Contact email (e.g., mailto:notifications@fitally.app)
- `NEXT_PUBLIC_APP_URL`: Your app URL (for notification links)

## Step 2: Deploy Database Schema

Run the notification schema in your Supabase SQL editor:

```sql
-- Copy content from supabase-notification-schema.sql
```

## Step 3: Deploy Edge Function

### Install Supabase CLI

```bash
npm install -g supabase
```

### Login and Link Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

### Deploy the Edge Function

```bash
supabase functions deploy meal-reminder-scheduler
```

### Set Edge Function Environment Variables

In your Supabase dashboard, go to Edge Functions → meal-reminder-scheduler → Settings:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:notifications@fitally.app
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## Step 4: Enable pg_cron Extension

In your Supabase SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

## Step 5: Set Up Cron Job

Replace `your-project-ref` with your actual Supabase project reference in the cron.sql file, then run it:

```sql
-- Edit supabase/functions/meal-reminder-scheduler/cron.sql
-- Replace 'your-project-ref' with your actual project reference
-- Then run the SQL in your Supabase SQL editor
```

## Step 6: Configure Service Role Key

The cron job needs access to the service role key. Set it as a Postgres setting:

```sql
-- In Supabase SQL editor
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
```

## Step 7: Test the System

### 1. Test Immediate Notifications

Use the test notification endpoint:
```bash
curl -X POST https://yourapp.com/api/notifications/test \
  -H "Authorization: Bearer your-user-jwt"
```

### 2. Configure Meal Reminders

Go to your app's profile settings and configure meal reminder times.

### 3. Test Edge Function Manually

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/meal-reminder-scheduler \
  -H "Authorization: Bearer your-service-role-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 4. Check Cron Jobs

```sql
SELECT * FROM cron.job;
```

### 5. Monitor Logs

- **Edge Function Logs**: Supabase Dashboard → Edge Functions → meal-reminder-scheduler → Logs
- **Cron Logs**: Check your database logs for cron execution

## Step 8: Verify Scheduling

The system will:
1. Run every 15 minutes via cron
2. Check all users with active meal reminders
3. Calculate if it's time to send notifications based on:
   - User's timezone
   - Configured meal times
   - Reminder offset (minutes before meal)
   - Enabled weekdays
4. Send push notifications to active subscriptions
5. Track sent notifications to avoid duplicates

## Troubleshooting

### Common Issues

1. **Notifications not sending**
   - Check environment variables are set in edge function
   - Verify VAPID keys are correct
   - Check user has active push subscriptions
   - Look at edge function logs

2. **Cron not running**
   - Verify `pg_cron` extension is enabled
   - Check cron job is scheduled: `SELECT * FROM cron.job;`
   - Verify service role key is set correctly

3. **Wrong timing**
   - Check user's timezone in meal_reminder_preferences
   - Verify reminder_minutes offset is correct
   - Check weekdays array (Sunday = index 0)

4. **Edge function errors**
   - Check environment variables
   - Verify Supabase URL and service key
   - Check function deployment status

### Debug Queries

```sql
-- Check active preferences
SELECT * FROM meal_reminder_preferences WHERE breakfast_enabled = true;

-- Check recent notifications
SELECT * FROM scheduled_notifications ORDER BY created_at DESC LIMIT 10;

-- Check active subscriptions
SELECT user_id, count(*) FROM push_subscriptions WHERE is_active = true GROUP BY user_id;

-- Check cron jobs
SELECT * FROM cron.job;
```

## Monitoring

Set up monitoring for:
- Edge function execution success/failure rates
- Notification delivery rates
- User subscription health
- Cron job execution

## Security Notes

- Service role key has full database access - keep secure
- VAPID keys should be unique per environment
- Consider rate limiting the edge function
- Monitor for suspicious notification patterns

## Performance Considerations

- Edge function runs every 15 minutes for all users
- Consider sharding users if you have many (>10k active)
- Monitor database connection limits
- Consider notification batching for efficiency

The system is now ready to send proactive meal reminders! 🎉 