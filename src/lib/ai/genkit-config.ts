import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from 'zod';

// Configure Genkit instance with Google AI
export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'), // Latest model as per 2025 research
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