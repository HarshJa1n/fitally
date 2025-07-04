import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PushSubscriptionData } from '@/types/notifications';

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

    const subscriptionData = await request.json();
    
    // Validate required fields
    if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Prepare subscription data for database
    const dbSubscription: Omit<PushSubscriptionData, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      endpoint: subscriptionData.endpoint,
      keys: {
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
      },
      userAgent: subscriptionData.userAgent || '',
      isActive: true,
    };

    // Check if subscription already exists for this user and endpoint
    const { data: existingSubscription, error: checkError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('endpoint', subscriptionData.endpoint)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', checkError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          keys: dbSubscription.keys,
          user_agent: dbSubscription.userAgent,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          user_id: dbSubscription.userId,
          endpoint: dbSubscription.endpoint,
          keys: dbSubscription.keys,
          user_agent: dbSubscription.userAgent,
          is_active: dbSubscription.isActive,
        });

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription saved successfully' 
    });

  } catch (error) {
    console.error('Error in subscription endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 