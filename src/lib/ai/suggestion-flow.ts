import { ai } from './genkit-config';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';

// Suggestion Input Schema
export const SuggestionInputSchema = z.object({
  userId: z.string(),
  recentActivities: z.array(z.object({
    id: z.string(),
    type: z.string(),
    activityType: z.string(),
    timestamp: z.string(),
    calories: z.number().optional(),
    insights: z.record(z.any()).optional(),
    nutritionalInfo: z.record(z.any()).optional(),
  })),
  userProfile: z.object({
    fitness_goals: z.array(z.string()).optional(),
    activity_level: z.string().optional(),
    dietary_preferences: z.array(z.string()).optional(),
    weight_kg: z.number().optional(),
    height_cm: z.number().optional(),
  }),
  timeContext: z.object({
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
    dayOfWeek: z.string(),
    season: z.string().optional(),
  }),
  suggestionType: z.enum(['workout', 'meal', 'general', 'recovery', 'nutrition']).default('general'),
});

// Suggestion Output Schema
export const SuggestionSchema = z.object({
  suggestions: z.array(z.object({
    type: z.enum(['workout', 'meal', 'hydration', 'rest', 'supplement', 'general']),
    title: z.string(),
    description: z.string(),
    reasoning: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    estimatedBenefit: z.string(),
    actionSteps: z.array(z.string()),
    timeToImplement: z.string(),
    tags: z.array(z.string()).default([]),
  })),
  insights: z.object({
    patterns: z.array(z.string()),
    improvements: z.array(z.string()),
    cautions: z.array(z.string()).optional(),
  }),
  goalProgress: z.object({
    currentStatus: z.string(),
    nextMilestone: z.string(),
    recommendation: z.string(),
  }).optional(),
  confidence: z.number().min(0).max(1),
  timestamp: z.string(),
});

export type SuggestionInput = z.infer<typeof SuggestionInputSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;

/**
 * AI flow for generating personalized health and fitness suggestions
 */
export const generateSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSuggestions',
    inputSchema: SuggestionInputSchema,
    outputSchema: SuggestionSchema,
  },
  async (input: SuggestionInput): Promise<Suggestion> => {
    try {
      // Analyze recent activity patterns
      const activityAnalysis = analyzeActivityPatterns(input.recentActivities);
      
      // Generate contextual prompt
      const prompt = createSuggestionPrompt(input, activityAnalysis);

      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt,
        output: {
          schema: SuggestionSchema,
        },
      });

      if (!output) {
        throw new Error('Failed to generate suggestions - no output received');
      }

      // Enhance suggestions with metadata
      output.timestamp = new Date().toISOString();
      
      // Add contextual tags to suggestions
      output.suggestions.forEach(suggestion => {
        suggestion.tags.push(`generated:${input.timeContext.timeOfDay}`);
        suggestion.tags.push(`context:${input.timeContext.dayOfWeek.toLowerCase()}`);
        if (input.suggestionType !== 'general') {
          suggestion.tags.push(`focus:${input.suggestionType}`);
        }
      });

      return output;

    } catch (error) {
      console.error('Suggestion Generation Error:', error);
      throw new Error(`Suggestion generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Quick daily suggestions flow for immediate recommendations
 */
export const quickDailySuggestionsFlow = ai.defineFlow(
  {
    name: 'quickDailySuggestions',
    inputSchema: SuggestionInputSchema,
    outputSchema: SuggestionSchema,
  },
  async (input: SuggestionInput): Promise<Suggestion> => {
    try {
      const quickPrompt = `Based on the user's profile and recent activities, provide 3-5 quick, actionable suggestions for today.

User Profile:
- Goals: ${input.userProfile.fitness_goals?.join(', ') || 'Not specified'}
- Activity Level: ${input.userProfile.activity_level || 'Not specified'}
- Dietary Preferences: ${input.userProfile.dietary_preferences?.join(', ') || 'Not specified'}

Recent Activities:
${input.recentActivities.slice(0, 5).map(activity => 
  `- ${activity.type}: ${activity.activityType} (${new Date(activity.timestamp).toLocaleDateString()})`
).join('\n')}

Time Context: ${input.timeContext.timeOfDay} on ${input.timeContext.dayOfWeek}

Focus on practical, achievable suggestions that align with their goals and current activity patterns. Consider the time of day for appropriate recommendations.`;

      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: quickPrompt,
        output: {
          schema: SuggestionSchema,
        },
      });

      if (!output) {
        throw new Error('Failed to generate quick suggestions');
      }

      output.timestamp = new Date().toISOString();
      output.suggestions.forEach(suggestion => {
        suggestion.tags.push('quick-suggestion', `time:${input.timeContext.timeOfDay}`);
      });

      return output;

    } catch (error) {
      console.error('Quick Suggestion Error:', error);
      throw new Error(`Quick suggestion generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Helper functions
function analyzeActivityPatterns(activities: SuggestionInput['recentActivities']) {
  const patterns = {
    mostCommonType: '',
    averageCalories: 0,
    activityFrequency: {} as Record<string, number>,
    recentTrends: [] as string[],
  };

  if (activities.length === 0) return patterns;

  // Count activity types
  const typeCounts: Record<string, number> = {};
  let totalCalories = 0;
  let calorieCount = 0;

  activities.forEach(activity => {
    typeCounts[activity.activityType] = (typeCounts[activity.activityType] || 0) + 1;
    if (activity.calories) {
      totalCalories += activity.calories;
      calorieCount++;
    }
  });

  patterns.mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
    typeCounts[a] > typeCounts[b] ? a : b
  );
  patterns.averageCalories = calorieCount > 0 ? totalCalories / calorieCount : 0;
  patterns.activityFrequency = typeCounts;

  // Analyze recent trends (last 7 days)
  const recentActivities = activities.slice(0, 7);
  if (recentActivities.length > 3) {
    patterns.recentTrends.push('Consistent activity logging');
  }
  
  const workoutCount = recentActivities.filter(a => a.type === 'workout').length;
  const mealCount = recentActivities.filter(a => a.type === 'meal').length;
  
  if (workoutCount > mealCount) {
    patterns.recentTrends.push('More focused on fitness tracking');
  } else if (mealCount > workoutCount) {
    patterns.recentTrends.push('More focused on nutrition tracking');
  }

  return patterns;
}

function createSuggestionPrompt(input: SuggestionInput, patterns: any): string {
  return `You are Fitally's AI health coach. Generate personalized suggestions for this user based on their profile, recent activities, and current context.

USER PROFILE:
- Fitness Goals: ${input.userProfile.fitness_goals?.join(', ') || 'Not specified'}
- Activity Level: ${input.userProfile.activity_level || 'Not specified'}
- Dietary Preferences: ${input.userProfile.dietary_preferences?.join(', ') || 'Not specified'}
- Physical Stats: ${input.userProfile.height_cm || 'N/A'}cm, ${input.userProfile.weight_kg || 'N/A'}kg

RECENT ACTIVITY PATTERNS:
- Most Common Activity: ${patterns.mostCommonType}
- Average Calories: ${patterns.averageCalories.toFixed(0)}
- Activity Frequency: ${Object.entries(patterns.activityFrequency).map(([type, count]) => `${type}: ${count}`).join(', ')}
- Recent Trends: ${patterns.recentTrends.join(', ')}

RECENT ACTIVITIES (Last ${input.recentActivities.length}):
${input.recentActivities.slice(0, 10).map(activity => 
  `- ${activity.activityType} (${activity.type}) - ${new Date(activity.timestamp).toLocaleDateString()} - ${activity.calories || 'N/A'} cal`
).join('\n')}

CURRENT CONTEXT:
- Time: ${input.timeContext.timeOfDay} on ${input.timeContext.dayOfWeek}
- Focus Area: ${input.suggestionType}
${input.timeContext.season ? `- Season: ${input.timeContext.season}` : ''}

INSTRUCTIONS:
1. Provide 3-5 personalized suggestions that are:
   - Specific and actionable
   - Aligned with their goals and preferences
   - Appropriate for the current time and context
   - Based on their activity patterns and gaps

2. Include insights about their current patterns and potential improvements

3. If they have specific goals, provide progress assessment and next milestone

4. Consider their activity level and recent habits when suggesting intensity and frequency

5. Be encouraging and supportive while being realistic about expectations

Generate suggestions that will genuinely help them progress toward their health goals.`;
} 