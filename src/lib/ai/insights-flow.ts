import { ai } from './genkit-config';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import type { DailyProcessedData } from '@/lib/processors/health-data-processor';

// Insights Input Schema
export const InsightsInputSchema = z.object({
  date: z.string(),
  metrics: z.object({
    calorieDeficit: z.object({
      value: z.number(),
      bmr: z.number(),
      tdee: z.number(),
      workoutCalories: z.number(),
      foodCalories: z.number(),
      percentage: z.number(),
    }),
    protein: z.object({
      consumed: z.number(),
      goal: z.number(),
      percentage: z.number(),
      sources: z.array(z.string()),
    }),
    steps: z.object({
      count: z.number(),
      goal: z.number(),
      percentage: z.number(),
      estimated: z.boolean(),
    }),
    exercise: z.object({
      duration: z.number(),
      goal: z.number(),
      percentage: z.number(),
      workoutCount: z.number(),
      types: z.array(z.string()),
    }),
  }),
  activities: z.object({
    meals: z.array(z.any()),
    workouts: z.array(z.any()),
    other: z.array(z.any()),
  }),
  goals: z.object({
    mealsLogged: z.boolean(),
    workoutCompleted: z.boolean(),
    proteinTarget: z.boolean(),
    calorieDeficit: z.boolean(),
  }),
});

// Insights Output Schema
export const InsightsSchema = z.object({
  insights: z.array(z.object({
    type: z.enum(['nutrition', 'exercise', 'calories', 'habits', 'motivation']),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    actionable: z.boolean(),
    timeRelevant: z.boolean(),
  })),
  summary: z.object({
    overallScore: z.number().min(0).max(100),
    keyWin: z.string(),
    mainImprovement: z.string(),
    motivationalMessage: z.string(),
  }),
  trends: z.array(z.object({
    metric: z.string(),
    direction: z.enum(['improving', 'declining', 'stable']),
    confidence: z.number().min(0).max(1),
  })),
  timestamp: z.string(),
});

export type InsightsInput = z.infer<typeof InsightsInputSchema>;
export type Insights = z.infer<typeof InsightsSchema>;

/**
 * AI flow for generating personalized health insights based on processed data
 */
export const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateHealthInsights',
    inputSchema: InsightsInputSchema,
    outputSchema: InsightsSchema,
  },
  async (input: InsightsInput): Promise<Insights> => {
    try {
      const prompt = createInsightsPrompt(input);

      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt,
        output: {
          schema: InsightsSchema,
        },
      });

      if (!output) {
        throw new Error('Failed to generate insights - no output received');
      }

      // Add timestamp
      output.timestamp = new Date().toISOString();

      return output;

    } catch (error) {
      console.error('Health Insights Generation Error:', error);
      throw new Error(`Insights generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Create detailed prompt for insights generation
 */
function createInsightsPrompt(input: InsightsInput): string {
  const { metrics, activities, goals } = input;

  return `Analyze the following health data for ${input.date} and provide personalized insights:

**Daily Metrics:**
- Calorie Deficit: ${metrics.calorieDeficit.value} cal (${metrics.calorieDeficit.percentage}% of goal)
  - BMR: ${metrics.calorieDeficit.bmr} cal
  - TDEE: ${metrics.calorieDeficit.tdee} cal
  - Workout: ${metrics.calorieDeficit.workoutCalories} cal burned
  - Food: ${metrics.calorieDeficit.foodCalories} cal consumed

- Protein: ${metrics.protein.consumed}g/${metrics.protein.goal}g (${metrics.protein.percentage}%)
  - Sources: ${metrics.protein.sources.join(', ') || 'None logged'}

- Steps: ${metrics.steps.count}/${metrics.steps.goal} (${metrics.steps.percentage}%)
  - Data source: ${metrics.steps.estimated ? 'Estimated' : 'Tracked'}

- Exercise: ${metrics.exercise.duration}/${metrics.exercise.goal} min (${metrics.exercise.percentage}%)
  - Workouts: ${metrics.exercise.workoutCount}
  - Types: ${metrics.exercise.types.join(', ') || 'None'}

**Activities Summary:**
- Meals logged: ${activities.meals.length}
- Workouts completed: ${activities.workouts.length}
- Other activities: ${activities.other.length}

**Goal Achievement:**
- Meals logged (3+): ${goals.mealsLogged ? 'Yes' : 'No'}
- Workout completed: ${goals.workoutCompleted ? 'Yes' : 'No'}
- Protein target: ${goals.proteinTarget ? 'Yes' : 'No'}
- Calorie deficit: ${goals.calorieDeficit ? 'Yes' : 'No'}

Please provide:
1. 3-5 specific, personalized insights based on the data
2. An overall health score (0-100) for the day
3. The biggest win and main area for improvement
4. A motivational message
5. Trend analysis for key metrics

Focus on being encouraging, actionable, and data-driven. Consider the time of day and what's realistic for the user to achieve.`;
}

/**
 * Wrapper function to match the expected signature from HealthDataProcessor
 */
export async function generateInsights(processedData: DailyProcessedData): Promise<string[]> {
  try {
    const insights = await generateInsightsFlow(processedData);
    return insights.insights.map(insight => insight.message);
  } catch (error) {
    console.error('Failed to generate AI insights:', error);
    // Fallback to simple static insights
    return [
      "Keep up the great work with your health tracking!",
      "Every small step towards your goals counts.",
      "Consider reviewing your progress and adjusting goals as needed."
    ];
  }
} 