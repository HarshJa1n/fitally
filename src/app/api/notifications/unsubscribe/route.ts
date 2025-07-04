import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Mark all user's subscriptions as inactive
    const { error: updateError } = await supabase
      .from('push_subscriptions')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating subscriptions:', updateError);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    // Also remove any meal reminder preferences
    const { error: reminderError } = await supabase
      .from('meal_reminder_preferences')
      .delete()
      .eq('user_id', user.id);

    if (reminderError) {
      console.error('Error removing meal reminders:', reminderError);
      // Non-critical error, don't fail the request
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully unsubscribed from notifications' 
    });

  } catch (error) {
    console.error('Error in unsubscribe endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 