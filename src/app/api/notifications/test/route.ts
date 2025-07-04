import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import webpush from 'web-push';

// Configure VAPID details
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:notifications@fitally.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's active push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No active subscriptions found' },
        { status: 404 }
      );
    }

    // Create test notification using 2025 Declarative Web Push format
    const testNotification = {
      // Declarative Web Push magic key (RFC 8030)
      web_push: 8030,
      notification: {
        title: "🎉 Fitally Test Notification",
        body: "Your meal reminders are working perfectly! This notification confirms your settings.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        navigate: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        tag: "test-notification",
        requireInteraction: false,
        silent: false,
        app_badge: "1"
      },
      // Fallback data for traditional web push
      title: "🎉 Fitally Test Notification",
      body: "Your meal reminders are working perfectly! This notification confirms your settings.",
      icon: "/favicon.ico",
      data: {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
        type: 'test',
        timestamp: Date.now()
      }
    };

    const notifications = [];

    // Send notification to all active subscriptions
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(testNotification),
          {
            TTL: 60, // 1 minute TTL
            urgency: 'normal',
            topic: 'test-notification'
          }
        );

        notifications.push({
          endpoint: subscription.endpoint,
          status: 'sent',
        });

      } catch (error) {
        console.error(`Error sending to subscription ${subscription.id}:`, error);
        
        // Check if subscription is invalid (410 Gone)
        if (error instanceof Error && error.message.includes('410')) {
          // Mark subscription as inactive
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('id', subscription.id);
        }

        notifications.push({
          endpoint: subscription.endpoint,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = notifications.filter(n => n.status === 'sent').length;
    const failureCount = notifications.filter(n => n.status === 'failed').length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Test notification sent to ${successCount} device(s)${failureCount > 0 ? `, failed for ${failureCount}` : ''}`,
      details: {
        sent: successCount,
        failed: failureCount,
        notifications: notifications,
      },
    });

  } catch (error) {
    console.error('Error in test notification endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 