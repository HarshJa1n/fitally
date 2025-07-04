import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MealReminderPreferences, DEFAULT_MEAL_REMINDERS } from '@/types/notifications';

export async function GET(request: NextRequest) {
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

    // Get user's meal reminder preferences
    const { data: preferences, error: prefError } = await supabase
      .from('meal_reminder_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return preferences or defaults
    if (preferences) {
      const userPreferences: MealReminderPreferences = {
        breakfast: {
          enabled: preferences.breakfast_enabled || false,
          time: preferences.breakfast_time || DEFAULT_MEAL_REMINDERS.breakfast.time,
          message: preferences.breakfast_message || DEFAULT_MEAL_REMINDERS.breakfast.message,
        },
        lunch: {
          enabled: preferences.lunch_enabled || false,
          time: preferences.lunch_time || DEFAULT_MEAL_REMINDERS.lunch.time,
          message: preferences.lunch_message || DEFAULT_MEAL_REMINDERS.lunch.message,
        },
        dinner: {
          enabled: preferences.dinner_enabled || false,
          time: preferences.dinner_time || DEFAULT_MEAL_REMINDERS.dinner.time,
          message: preferences.dinner_message || DEFAULT_MEAL_REMINDERS.dinner.message,
        },
        snacks: {
          enabled: preferences.snacks_enabled || false,
          times: preferences.snack_times || DEFAULT_MEAL_REMINDERS.snacks.times,
          message: preferences.snacks_message || DEFAULT_MEAL_REMINDERS.snacks.message,
        },
        timezone: preferences.timezone || DEFAULT_MEAL_REMINDERS.timezone,
        reminderMinutes: preferences.reminder_minutes || DEFAULT_MEAL_REMINDERS.reminderMinutes,
        weekdays: preferences.weekdays || DEFAULT_MEAL_REMINDERS.weekdays,
      };

      return NextResponse.json(userPreferences);
    } else {
      return NextResponse.json(DEFAULT_MEAL_REMINDERS);
    }

  } catch (error) {
    console.error('Error in GET meal reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const preferences: MealReminderPreferences = await request.json();

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    // Prepare data for database
    const dbPreferences = {
      user_id: user.id,
      breakfast_enabled: preferences.breakfast?.enabled || false,
      breakfast_time: preferences.breakfast?.time || DEFAULT_MEAL_REMINDERS.breakfast.time,
      breakfast_message: preferences.breakfast?.message || DEFAULT_MEAL_REMINDERS.breakfast.message,
      lunch_enabled: preferences.lunch?.enabled || false,
      lunch_time: preferences.lunch?.time || DEFAULT_MEAL_REMINDERS.lunch.time,
      lunch_message: preferences.lunch?.message || DEFAULT_MEAL_REMINDERS.lunch.message,
      dinner_enabled: preferences.dinner?.enabled || false,
      dinner_time: preferences.dinner?.time || DEFAULT_MEAL_REMINDERS.dinner.time,
      dinner_message: preferences.dinner?.message || DEFAULT_MEAL_REMINDERS.dinner.message,
      snacks_enabled: preferences.snacks?.enabled || false,
      snack_times: preferences.snacks?.times || DEFAULT_MEAL_REMINDERS.snacks.times,
      snacks_message: preferences.snacks?.message || DEFAULT_MEAL_REMINDERS.snacks.message,
      timezone: preferences.timezone || DEFAULT_MEAL_REMINDERS.timezone,
      reminder_minutes: preferences.reminderMinutes || DEFAULT_MEAL_REMINDERS.reminderMinutes,
      weekdays: preferences.weekdays || DEFAULT_MEAL_REMINDERS.weekdays,
      updated_at: new Date().toISOString(),
    };

    // Check if preferences already exist
    const { data: existing, error: checkError } = await supabase
      .from('meal_reminder_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing preferences:', checkError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (existing) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from('meal_reminder_preferences')
        .update(dbPreferences)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating preferences:', updateError);
        return NextResponse.json(
          { error: 'Failed to update preferences' },
          { status: 500 }
        );
      }
    } else {
      // Create new preferences
      const { error: insertError } = await supabase
        .from('meal_reminder_preferences')
        .insert({
          ...dbPreferences,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        );
      }
    }

    // Schedule notifications based on the new preferences
    // This would integrate with a job scheduler in production
    console.log('Meal reminder preferences updated for user:', user.id);
    
    // TODO: Integrate with scheduling system (cron jobs, background tasks, etc.)
    // For now, we'll just log that scheduling should happen here
    
    return NextResponse.json({
      success: true,
      message: 'Meal reminder preferences saved successfully',
    });

  } catch (error) {
    console.error('Error in POST meal reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Delete user's meal reminder preferences
    const { error: deleteError } = await supabase
      .from('meal_reminder_preferences')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting preferences:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meal reminder preferences deleted successfully',
    });

  } catch (error) {
    console.error('Error in DELETE meal reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 