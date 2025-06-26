import { NextRequest, NextResponse } from 'next/server';
import { generateSuggestionsFlow, quickDailySuggestionsFlow, SuggestionInputSchema } from '@/lib/ai/suggestion-flow';
import { dbService } from '@/lib/supabase/database';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// API request schema (removed userId since we'll get it from auth)
const APIRequestSchema = z.object({
  type: z.enum(['full', 'quick']).default('quick'),
  suggestionType: z.enum(['workout', 'meal', 'general', 'recovery', 'nutrition']).default('general'),
  includeRecentActivities: z.boolean().default(true),
  timeContext: z.object({
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    dayOfWeek: z.string().optional(),
    season: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { type, suggestionType, includeRecentActivities, timeContext } = APIRequestSchema.parse(body);
    const userId = user.id;

    // Get user profile or use defaults
    const userProfile = await dbService.getUserProfile(userId);
    const defaultProfile = {
      fitness_goals: ['general_fitness'],
      activity_level: 'moderately_active',
      dietary_preferences: [],
      weight_kg: null,
      height_cm: null,
    };
    
    const profileToUse = userProfile || defaultProfile;

    // Get recent activities if requested
    let recentActivities: any[] = [];
    if (includeRecentActivities) {
      const activities = await dbService.getHealthActivities(userId, 20);
      recentActivities = activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        activityType: activity.ai_analysis?.activityType || activity.type,
        timestamp: activity.activity_date,
        calories: activity.calories_estimated ?? undefined,
        insights: activity.ai_analysis?.insights,
        nutritionalInfo: activity.ai_analysis?.nutritionalInfo,
      }));
    }

    // Determine time context
    const now = new Date();
    const currentTimeContext = {
      timeOfDay: timeContext?.timeOfDay || determineTimeOfDay(now),
      dayOfWeek: timeContext?.dayOfWeek || getDayOfWeek(now),
      season: timeContext?.season || determineSeason(now),
    };

    // Prepare input for AI flow
    const suggestionInput = {
      userId,
      recentActivities,
      userProfile: {
        fitness_goals: profileToUse.fitness_goals || [],
        activity_level: profileToUse.activity_level || 'moderately_active',
        dietary_preferences: profileToUse.dietary_preferences || [],
        weight_kg: profileToUse.weight_kg || undefined,
        height_cm: profileToUse.height_cm || undefined,
      },
      timeContext: currentTimeContext,
      suggestionType,
    };

    // Validate the input
    const validatedInput = SuggestionInputSchema.parse(suggestionInput);

    // Generate suggestions using the appropriate flow
    let result;
    if (type === 'quick') {
      result = await quickDailySuggestionsFlow(validatedInput);
    } else {
      result = await generateSuggestionsFlow(validatedInput);
    }

    // Return successful result
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        suggestionType: type,
        timestamp: new Date().toISOString(),
        userContext: {
          activitiesAnalyzed: recentActivities.length,
          timeContext: currentTimeContext,
          userGoals: profileToUse.fitness_goals,
        },
      }
    });

  } catch (error) {
    console.error('Suggestions API Error:', error);
    
    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check if it's an AI flow error
      if (error.message.includes('Suggestion generation failed')) {
        return NextResponse.json(
          { 
            error: 'AI suggestion generation failed',
            details: error.message,
            code: 'AI_PROCESSING_ERROR'
          },
          { status: 500 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get authenticated user from session
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const userId = user.id;

  try {
    // Generate quick daily suggestions
    const userProfile = await dbService.getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const activities = await dbService.getHealthActivities(userId, 10);
    const recentActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      activityType: activity.ai_analysis?.activityType || activity.type,
      timestamp: activity.activity_date,
      calories: activity.calories_estimated ?? undefined,
      insights: activity.ai_analysis?.insights,
      nutritionalInfo: activity.ai_analysis?.nutritionalInfo,
    }));

    const now = new Date();
    const suggestionInput = {
      userId,
      recentActivities,
      userProfile: {
        fitness_goals: userProfile.fitness_goals || [],
        activity_level: userProfile.activity_level || 'moderately_active',
        dietary_preferences: userProfile.dietary_preferences || [],
        weight_kg: userProfile.weight_kg || undefined,
        height_cm: userProfile.height_cm || undefined,
      },
      timeContext: {
        timeOfDay: determineTimeOfDay(now),
        dayOfWeek: getDayOfWeek(now),
        season: determineSeason(now),
      },
      suggestionType: 'general' as const,
    };

    const result = await quickDailySuggestionsFlow(suggestionInput);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        suggestionType: 'quick',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Quick suggestions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestions',
        details: (error as Error).message,
        code: 'SUGGESTION_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function determineTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function getDayOfWeek(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function determineSeason(date: Date): string {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  if (month >= 12 || month <= 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
} 