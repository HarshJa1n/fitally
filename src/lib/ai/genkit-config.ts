import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from 'zod';

// Configure Genkit instance with Google AI
export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'), // Latest model as per 2025 research
});

// Individual Food Item Schema for editable nutrition tracking
export const FoodItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substr(2, 9)),
  name: z.string(),
  quantity: z.object({
    amount: z.number(),
    unit: z.string() // e.g., "cups", "grams", "pieces", "slices"
  }),
  calories: z.number(),
  macros: z.object({
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    sugar: z.number().optional()
  }).optional(),
  confidence: z.number().min(0).max(1).default(0.8)
});

// Individual Exercise Set Schema for editable workout tracking
export const ExerciseSetSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substr(2, 9)),
  name: z.string(),
  sets: z.number().optional(),
  reps: z.number().optional(),
  weight: z.object({
    amount: z.number(),
    unit: z.enum(['lbs', 'kg'])
  }).optional(),
  duration: z.object({
    value: z.number(),
    unit: z.enum(['seconds', 'minutes'])
  }).optional(),
  distance: z.object({
    amount: z.number(),
    unit: z.enum(['meters', 'miles', 'km'])
  }).optional(),
  calories: z.number().optional(),
  confidence: z.number().min(0).max(1).default(0.8)
});

// Health Activity Schema for structured output
export const HealthActivitySchema = z.object({
  activityType: z.enum([
    'cardio',
    'strength_training',
    'yoga',
    'pilates',
    'walking',
    'running',
    'cycling',
    'swimming',
    'sports',
    'stretching',
    'meditation',
    'nutrition',
    'meal',
    'snack',
    'hydration',
    'sleep',
    'rest',
    'other'
  ]),
  subCategory: z.string().optional(),
  duration: z.object({
    value: z.number(),
    unit: z.enum(['minutes', 'hours', 'seconds'])
  }).optional(),
  intensity: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  calories: z.object({
    estimated: z.number(),
    confidence: z.number().min(0).max(1)
  }).optional(),
  
  // Enhanced food tracking with individual items
  foodItems: z.array(FoodItemSchema).optional().describe('Individual food items detected for meals/snacks'),
  
  // Enhanced exercise tracking with individual exercises
  exercises: z.array(ExerciseSetSchema).optional().describe('Individual exercises detected for workouts'),
  
  insights: z.object({
    primaryMuscleGroups: z.array(z.string()).optional(),
    equipmentUsed: z.array(z.string()).optional(),
    technique: z.string().optional(),
    improvements: z.array(z.string()).optional(),
    warnings: z.array(z.string()).optional()
  }),
  nutritionalInfo: z.object({
    macros: z.object({
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional()
    }).optional(),
    micronutrients: z.array(z.string()).optional(),
    healthScore: z.number().min(0).max(10).optional()
  }).optional(),
  timestamp: z.string(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional()
});

// Enhanced media data schema with optional metadata
const MediaDataSchema = z.object({
  base64: z.string(),
  mimeType: z.string(),
  size: z.number().optional().describe('File size in bytes'),
  filename: z.string().optional().describe('Original filename')
});

// Input Schema for multimodal health analysis
export const HealthAnalysisInputSchema = z.object({
  textInput: z.string().optional(),
  imageData: MediaDataSchema.optional(),
  audioData: MediaDataSchema.optional(),
  videoData: MediaDataSchema.optional(),
  context: z.object({
    userId: z.string(),
    timestamp: z.string(),
    userGoals: z.array(z.string()).optional(),
    userPreferences: z.object({
      fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      preferredActivities: z.array(z.string()).optional(),
      healthConditions: z.array(z.string()).optional()
    }).optional()
  })
});

export type HealthActivity = z.infer<typeof HealthActivitySchema>;
export type HealthAnalysisInput = z.infer<typeof HealthAnalysisInputSchema>;
export type FoodItem = z.infer<typeof FoodItemSchema>;
export type ExerciseSet = z.infer<typeof ExerciseSetSchema>; 