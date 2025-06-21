import { NextRequest, NextResponse } from 'next/server';
import { analyzeHealthActivityFlow, quickAnalyzeTextFlow, analyzeImageFlow, analyzeAudioFlow } from '@/lib/ai/health-activity-flow';
import { HealthAnalysisInputSchema } from '@/lib/ai/genkit-config';
import { MultimodalProcessor } from '@/lib/ai/multimodal-utils';
import { z } from 'zod';

// Enhanced input validation schema for the API
const APIRequestSchema = z.object({
  type: z.enum(['full', 'quick', 'image', 'audio']).default('full'),
  input: HealthAnalysisInputSchema,
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { type, input } = APIRequestSchema.parse(body);

    // Pre-validate multimodal inputs if present
    if (input.imageData) {
      const imageValidation = MultimodalProcessor.validateImageData(input.imageData);
      if (!imageValidation.isValid) {
        return NextResponse.json(
          { 
            error: 'Invalid image data', 
            details: imageValidation.error,
            code: 'INVALID_IMAGE_DATA'
          },
          { status: 400 }
        );
      }
    }

    if (input.audioData) {
      const audioValidation = MultimodalProcessor.validateAudioData(input.audioData);
      if (!audioValidation.isValid) {
        return NextResponse.json(
          { 
            error: 'Invalid audio data', 
            details: audioValidation.error,
            code: 'INVALID_AUDIO_DATA'
          },
          { status: 400 }
        );
      }
    }

    // Choose the appropriate flow based on type and validate inputs
    let result;
    switch (type) {
      case 'quick':
        if (!input.textInput || input.textInput.trim().length === 0) {
          return NextResponse.json(
            { 
              error: 'Text input is required for quick analysis',
              code: 'MISSING_TEXT_INPUT'
            },
            { status: 400 }
          );
        }
        result = await quickAnalyzeTextFlow(input);
        break;

      case 'image':
        if (!input.imageData) {
          return NextResponse.json(
            { 
              error: 'Image data is required for image analysis',
              code: 'MISSING_IMAGE_DATA'
            },
            { status: 400 }
          );
        }
        result = await analyzeImageFlow(input);
        break;

      case 'audio':
        if (!input.audioData) {
          return NextResponse.json(
            { 
              error: 'Audio data is required for audio analysis',
              code: 'MISSING_AUDIO_DATA'
            },
            { status: 400 }
          );
        }
        result = await analyzeAudioFlow(input);
        break;

      case 'full':
      default:
        // Validate that at least one input type is provided for full analysis
        const hasAnyInput = input.textInput || input.imageData || input.audioData;
        if (!hasAnyInput) {
          return NextResponse.json(
            { 
              error: 'At least one input type (text, image, or audio) is required for full analysis',
              code: 'NO_INPUT_PROVIDED'
            },
            { status: 400 }
          );
        }
        result = await analyzeHealthActivityFlow(input);
        break;
    }

    // Return successful result with metadata
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analysisType: type,
        timestamp: new Date().toISOString(),
        inputTypes: [
          input.textInput && 'text',
          input.imageData && 'image',
          input.audioData && 'audio'
        ].filter(Boolean),
        processingTime: Date.now() // Client can calculate duration
      }
    });

  } catch (error) {
    console.error('AI Analysis API Error:', error);
    
    // Handle different types of errors appropriately
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
      // Check if it's a known AI flow error
      if (error.message.includes('validation failed') || 
          error.message.includes('is required') ||
          error.message.includes('Invalid')) {
        return NextResponse.json(
          { 
            error: 'Input validation failed',
            details: error.message,
            code: 'INPUT_VALIDATION_ERROR'
          },
          { status: 400 }
        );
      }

      // Check if it's an AI processing error
      if (error.message.includes('analysis failed') || 
          error.message.includes('Failed to generate')) {
        return NextResponse.json(
          { 
            error: 'AI analysis failed',
            details: error.message,
            code: 'AI_PROCESSING_ERROR'
          },
          { status: 500 }
        );
      }
    }

    // Generic server error for unknown issues
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

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export async function GET() {
  return NextResponse.json({
    message: 'Fitally AI Health Activity Analysis API',
    endpoints: {
      POST: '/api/ai/analyze',
      description: 'Analyze health activities using multimodal AI',
      supportedTypes: ['full', 'quick', 'image', 'audio'],
      requiredFields: {
        type: 'Analysis type (full, quick, image, audio)',
        input: {
          textInput: 'Text description (optional)',
          imageData: 'Base64 image data with mimeType (optional)',
          audioData: 'Base64 audio data with mimeType (optional)',
          context: {
            userId: 'User identifier (required)',
            timestamp: 'ISO timestamp (required)',
            userGoals: 'Array of user goals (optional)',
            userPreferences: 'User preferences object (optional)'
          }
        }
      }
    }
  });
} 