import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Database {
  public: {
    Tables: {
      meal_reminder_preferences: {
        Row: {
          id: string
          user_id: string
          breakfast_enabled: boolean
          breakfast_time: string
          breakfast_message: string
          lunch_enabled: boolean
          lunch_time: string
          lunch_message: string
          dinner_enabled: boolean
          dinner_time: string
          dinner_message: string
          snacks_enabled: boolean
          snack_times: string[]
          snacks_message: string
          timezone: string
          reminder_minutes: number
          weekdays: boolean[]
          created_at: string
          updated_at: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          keys: {
            p256dh: string
            auth: string
          }
          user_agent: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      scheduled_notifications: {
        Row: {
          id: string
          user_id: string
          meal_type: string
          scheduled_time: string
          payload: object
          status: string
          created_at: string
          sent_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          meal_type: string
          scheduled_time: string
          payload: object
          status?: string
          created_at?: string
          sent_at?: string | null
          error_message?: string | null
        }
      }
    }
  }
}

// VAPID configuration for web push
const VAPID_PUBLIC_KEY = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:notifications@fitally.app'

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

    console.log('🔔 Meal Reminder Scheduler started at:', new Date().toISOString())

    // Get current time in UTC
    const now = new Date()
    const currentTimeUTC = now.toISOString()

    // Get all users with active meal reminder preferences
    const { data: preferences, error: prefError } = await supabase
      .from('meal_reminder_preferences')
      .select('*')
      .or('breakfast_enabled.eq.true,lunch_enabled.eq.true,dinner_enabled.eq.true,snacks_enabled.eq.true')

    if (prefError) {
      console.error('Error fetching preferences:', prefError)
      throw prefError
    }

    if (!preferences || preferences.length === 0) {
      console.log('No active meal reminder preferences found')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active preferences found',
        processed: 0 
      }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Found ${preferences.length} users with active meal reminders`)

    let notificationsSent = 0
    let notificationsFailed = 0

    // Process each user's preferences
    for (const pref of preferences) {
      try {
        const result = await processUserMealReminders(supabase, pref, now)
        notificationsSent += result.sent
        notificationsFailed += result.failed
      } catch (error) {
        console.error(`Error processing user ${pref.user_id}:`, error)
        notificationsFailed++
      }
    }

    console.log(`✅ Scheduler completed: ${notificationsSent} sent, ${notificationsFailed} failed`)

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${preferences.length} users`,
      stats: {
        usersProcessed: preferences.length,
        notificationsSent,
        notificationsFailed,
        executedAt: currentTimeUTC
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in meal reminder scheduler:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function processUserMealReminders(
  supabase: any,
  preferences: Database['public']['Tables']['meal_reminder_preferences']['Row'],
  currentTime: Date
) {
  let sent = 0
  let failed = 0

  // Get user's active push subscriptions
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', preferences.user_id)
    .eq('is_active', true)

  if (!subscriptions || subscriptions.length === 0) {
    console.log(`No active subscriptions for user ${preferences.user_id}`)
    return { sent, failed }
  }

  // Convert user timezone to current local time
  const userTimezone = preferences.timezone || 'UTC'
  const userCurrentTime = new Date(currentTime.toLocaleString("en-US", { timeZone: userTimezone }))
  
  // Check if today is enabled (weekdays array: [Sun, Mon, Tue, Wed, Thu, Fri, Sat])
  const dayOfWeek = userCurrentTime.getDay()
  const isEnabledDay = preferences.weekdays[dayOfWeek]
  
  if (!isEnabledDay) {
    console.log(`Meal reminders disabled for user ${preferences.user_id} on day ${dayOfWeek}`)
    return { sent, failed }
  }

  console.log(`Processing user ${preferences.user_id} in timezone ${userTimezone}`)

  // Check each meal type
  const mealsToCheck = [
    {
      type: 'breakfast',
      enabled: preferences.breakfast_enabled,
      time: preferences.breakfast_time,
      message: preferences.breakfast_message
    },
    {
      type: 'lunch', 
      enabled: preferences.lunch_enabled,
      time: preferences.lunch_time,
      message: preferences.lunch_message
    },
    {
      type: 'dinner',
      enabled: preferences.dinner_enabled,
      time: preferences.dinner_time,
      message: preferences.dinner_message
    }
  ]

  // Add snacks if enabled
  if (preferences.snacks_enabled && preferences.snack_times) {
    for (const snackTime of preferences.snack_times) {
      mealsToCheck.push({
        type: 'snack',
        enabled: true,
        time: snackTime,
        message: preferences.snacks_message
      })
    }
  }

  for (const meal of mealsToCheck) {
    if (!meal.enabled) continue

    const shouldSend = shouldSendNotification(
      userCurrentTime,
      meal.time,
      preferences.reminder_minutes
    )

    if (shouldSend) {
      // Check if we've already sent this notification today
      const today = userCurrentTime.toISOString().split('T')[0]
      const { data: existingNotification } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .eq('user_id', preferences.user_id)
        .eq('meal_type', meal.type)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`)
        .eq('status', 'sent')
        .single()

      if (existingNotification) {
        console.log(`Already sent ${meal.type} notification today for user ${preferences.user_id}`)
        continue
      }

      // Send notification
      const result = await sendMealReminderNotification(
        supabase,
        preferences.user_id,
        meal.type,
        meal.message,
        subscriptions
      )

      if (result.success) {
        sent++
      } else {
        failed++
      }
    }
  }

  return { sent, failed }
}

function shouldSendNotification(currentTime: Date, mealTime: string, reminderMinutes: number): boolean {
  // Parse meal time (HH:MM format)
  const [hours, minutes] = mealTime.split(':').map(Number)
  
  // Create target time for today
  const mealDateTime = new Date(currentTime)
  mealDateTime.setHours(hours, minutes, 0, 0)
  
  // Calculate reminder time (meal time minus reminder minutes)
  const reminderTime = new Date(mealDateTime.getTime() - (reminderMinutes * 60 * 1000))
  
  // Check if current time is within 15 minutes of reminder time
  const timeDiff = Math.abs(currentTime.getTime() - reminderTime.getTime())
  const fifteenMinutes = 15 * 60 * 1000 // 15 minutes in milliseconds
  
  const shouldSend = timeDiff <= fifteenMinutes && currentTime >= reminderTime
  
  if (shouldSend) {
    console.log(`📅 Time to send ${mealTime} reminder! Current: ${currentTime.toLocaleTimeString()}, Reminder: ${reminderTime.toLocaleTimeString()}`)
  }
  
  return shouldSend
}

async function sendMealReminderNotification(
  supabase: any,
  userId: string,
  mealType: string,
  message: string,
  subscriptions: any[]
) {
  // Create notification payload
  const notification = {
    web_push: 8030,
    notification: {
      title: `🍽️ ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Reminder`,
      body: message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      navigate: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/capture`,
      tag: `meal-${mealType}`,
      requireInteraction: false,
      silent: false,
      app_badge: "1"
    },
    title: `🍽️ ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Reminder`,
    body: message,
    icon: "/favicon.ico",
    data: {
      url: `${Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'}/capture`,
      type: 'meal_reminder',
      mealType: mealType,
      timestamp: Date.now(),
      userId: userId
    }
  }

  // Record the scheduled notification
  const { data: scheduledNotification, error: scheduleError } = await supabase
    .from('scheduled_notifications')
    .insert({
      user_id: userId,
      meal_type: mealType,
      scheduled_time: new Date().toISOString(),
      payload: notification,
      status: 'pending'
    })
    .select()
    .single()

  if (scheduleError) {
    console.error('Error recording scheduled notification:', scheduleError)
    return { success: false, error: scheduleError.message }
  }

  let sentCount = 0
  let failedCount = 0

  // Send to all active subscriptions
  for (const subscription of subscriptions) {
    try {
      await sendWebPushNotification(subscription, notification)
      sentCount++
    } catch (error) {
      console.error(`Failed to send to subscription ${subscription.id}:`, error)
      failedCount++
      
      // Mark subscription as inactive if endpoint is gone
      if (error.message.includes('410')) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.id)
      }
    }
  }

  // Update notification status
  const finalStatus = sentCount > 0 ? 'sent' : 'failed'
  const errorMessage = failedCount > 0 ? `Failed to send to ${failedCount}/${subscriptions.length} subscriptions` : null

  await supabase
    .from('scheduled_notifications')
    .update({
      status: finalStatus,
      sent_at: new Date().toISOString(),
      error_message: errorMessage
    })
    .eq('id', scheduledNotification.id)

  console.log(`📱 Sent ${mealType} reminder to user ${userId}: ${sentCount} success, ${failedCount} failed`)

  return { 
    success: sentCount > 0,
    sent: sentCount,
    failed: failedCount
  }
}

async function sendWebPushNotification(subscription: any, payload: any) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  }

  // Import web-push for Deno
  const webpush = await import('https://esm.sh/web-push@3.6.7')
  
  // Set VAPID details
  webpush.default.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )

  // Send notification
  await webpush.default.sendNotification(
    pushSubscription,
    JSON.stringify(payload),
    {
      TTL: 3600, // 1 hour TTL
      urgency: 'normal',
      topic: `meal-${payload.data?.mealType || 'reminder'}`
    }
  )
} 