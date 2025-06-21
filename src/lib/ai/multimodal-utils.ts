import { z } from 'zod';

// Supported media types for different input modalities
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
] as const;

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mp3',
  'audio/wav', 
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/flac'
] as const;

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/mov',
  'video/avi'
] as const;

// Media validation schemas
export const MediaDataSchema = z.object({
  base64: z.string().describe('Base64 encoded media data'),
  mimeType: z.string().describe('MIME type of the media'),
  size: z.number().optional().describe('File size in bytes'),
  filename: z.string().optional().describe('Original filename'),
});

export type MediaData = z.infer<typeof MediaDataSchema>;

// Utility functions for media processing
export class MultimodalProcessor {
  
  /**
   * Validates if a MIME type is supported for the given media type
   */
  static isSupported(mimeType: string, mediaType: 'image' | 'audio' | 'video'): boolean {
    switch (mediaType) {
      case 'image':
        return SUPPORTED_IMAGE_TYPES.includes(mimeType as any);
      case 'audio':
        return SUPPORTED_AUDIO_TYPES.includes(mimeType as any);
      case 'video':
        return SUPPORTED_VIDEO_TYPES.includes(mimeType as any);
      default:
        return false;
    }
  }

  /**
   * Creates a data URL from media data
   */
  static createDataUrl(mediaData: MediaData): string {
    return `data:${mediaData.mimeType};base64,${mediaData.base64}`;
  }

  /**
   * Validates and processes image data
   */
  static validateImageData(mediaData: MediaData): { isValid: boolean; error?: string } {
    if (!this.isSupported(mediaData.mimeType, 'image')) {
      return {
        isValid: false,
        error: `Unsupported image type: ${mediaData.mimeType}. Supported types: ${SUPPORTED_IMAGE_TYPES.join(', ')}`
      };
    }

    // Check base64 format
    if (!mediaData.base64 || typeof mediaData.base64 !== 'string') {
      return {
        isValid: false,
        error: 'Invalid base64 data provided'
      };
    }

    // Basic base64 validation
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(mediaData.base64)) {
      return {
        isValid: false,
        error: 'Invalid base64 encoding'
      };
    }

    // Check reasonable size limits (50MB max)
    if (mediaData.size && mediaData.size > 50 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'Image size too large (max 50MB)'
      };
    }

    return { isValid: true };
  }

  /**
   * Validates and processes audio data
   */
  static validateAudioData(mediaData: MediaData): { isValid: boolean; error?: string } {
    if (!this.isSupported(mediaData.mimeType, 'audio')) {
      return {
        isValid: false,
        error: `Unsupported audio type: ${mediaData.mimeType}. Supported types: ${SUPPORTED_AUDIO_TYPES.join(', ')}`
      };
    }

    if (!mediaData.base64 || typeof mediaData.base64 !== 'string') {
      return {
        isValid: false,
        error: 'Invalid base64 data provided'
      };
    }

    // Check reasonable size limits (100MB max for audio)
    if (mediaData.size && mediaData.size > 100 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'Audio file size too large (max 100MB)'
      };
    }

    return { isValid: true };
  }

  /**
   * Validates and processes video data
   */
  static validateVideoData(mediaData: MediaData): { isValid: boolean; error?: string } {
    if (!this.isSupported(mediaData.mimeType, 'video')) {
      return {
        isValid: false,
        error: `Unsupported video type: ${mediaData.mimeType}. Supported types: ${SUPPORTED_VIDEO_TYPES.join(', ')}`
      };
    }

    if (!mediaData.base64 || typeof mediaData.base64 !== 'string') {
      return {
        isValid: false,
        error: 'Invalid base64 data provided'
      };
    }

    // Check reasonable size limits (500MB max for video)
    if (mediaData.size && mediaData.size > 500 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'Video file size too large (max 500MB)'
      };
    }

    return { isValid: true };
  }

  /**
   * Prepares media data for Genkit/Gemini processing
   */
  static prepareForGenkit(mediaData: MediaData): { media: { url: string } } {
    return {
      media: {
        url: this.createDataUrl(mediaData)
      }
    };
  }

  /**
   * Extracts media type from MIME type
   */
  static getMediaType(mimeType: string): 'image' | 'audio' | 'video' | 'unknown' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio'; 
    if (mimeType.startsWith('video/')) return 'video';
    return 'unknown';
  }

  /**
   * Generates analysis prompts based on media type and context
   */
  static generateAnalysisPrompt(
    mediaType: 'image' | 'audio' | 'video',
    userContext?: {
      fitnessLevel?: string;
      goals?: string[];
      preferences?: string[];
    }
  ): string {
    const basePrompts = {
      image: `Analyze this health and fitness related image. Focus on:
- Activity type and exercise being performed
- Form and technique assessment
- Equipment being used
- Safety considerations and recommendations
- Muscle groups being targeted
- Estimated intensity level
- Any improvements or modifications suggested`,

      audio: `Transcribe and analyze this health and fitness related audio. Focus on:
- Activity descriptions mentioned
- Duration and intensity details
- Equipment or locations referenced
- Goals or challenges discussed
- Nutritional information if mentioned
- Progress updates or achievements`,

      video: `Analyze this health and fitness related video. Focus on:
- Activity type and movement patterns
- Form and technique throughout the exercise
- Equipment usage and setup
- Range of motion and execution quality
- Safety considerations
- Progression or regression options
- Estimated calorie burn and intensity`
    };

    let prompt = basePrompts[mediaType];

    if (userContext) {
      prompt += '\n\nUser Context:';
      if (userContext.fitnessLevel) {
        prompt += `\n- Fitness Level: ${userContext.fitnessLevel}`;
      }
      if (userContext.goals?.length) {
        prompt += `\n- Goals: ${userContext.goals.join(', ')}`;
      }
      if (userContext.preferences?.length) {
        prompt += `\n- Preferences: ${userContext.preferences.join(', ')}`;
      }
      prompt += '\n\nPlease tailor your analysis to the user\'s context and provide personalized recommendations.';
    }

    return prompt;
  }

  /**
   * Combines multiple inputs for comprehensive analysis
   */
  static combineInputsForAnalysis(inputs: {
    text?: string;
    imageData?: MediaData;
    audioData?: MediaData;
    videoData?: MediaData;
  }): { promptParts: any[], inputTypes: string[] } {
    const promptParts = [];
    const inputTypes = [];

    // Add text input
    if (inputs.text) {
      promptParts.push({ text: inputs.text });
      inputTypes.push('text');
    }

    // Add image input
    if (inputs.imageData) {
      const validation = this.validateImageData(inputs.imageData);
      if (validation.isValid) {
        promptParts.push(this.prepareForGenkit(inputs.imageData));
        inputTypes.push('image');
      } else {
        throw new Error(`Image validation failed: ${validation.error}`);
      }
    }

    // Add audio input  
    if (inputs.audioData) {
      const validation = this.validateAudioData(inputs.audioData);
      if (validation.isValid) {
        promptParts.push(this.prepareForGenkit(inputs.audioData));
        inputTypes.push('audio');
      } else {
        throw new Error(`Audio validation failed: ${validation.error}`);
      }
    }

    // Add video input
    if (inputs.videoData) {
      const validation = this.validateVideoData(inputs.videoData);
      if (validation.isValid) {
        promptParts.push(this.prepareForGenkit(inputs.videoData));
        inputTypes.push('video');
      } else {
        throw new Error(`Video validation failed: ${validation.error}`);
      }
    }

    return { promptParts, inputTypes };
  }
}

// Health activity specific prompt enhancements
export class HealthActivityPrompts {
  
  /**
   * Generates specialized prompts for different health activity types
   */
  static getActivitySpecificPrompt(activityHint?: string): string {
    const activityPrompts = {
      cardio: `For cardiovascular activities, focus on:
- Heart rate zones and intensity levels
- Duration and distance metrics
- Calorie burn estimation
- Recovery recommendations`,

      strength: `For strength training activities, focus on:
- Muscle groups targeted
- Proper form and technique
- Weight/resistance levels
- Rep ranges and sets
- Progressive overload opportunities`,

      yoga: `For yoga and flexibility activities, focus on:
- Pose alignment and modifications
- Breathing techniques
- Flexibility improvements
- Balance and stability
- Mental wellness benefits`,

      nutrition: `For nutrition-related content, focus on:
- Macronutrient breakdown
- Calorie content estimation
- Meal timing and frequency
- Hydration recommendations
- Portion size assessment`
    };

    if (activityHint && activityHint.toLowerCase() in activityPrompts) {
      return activityPrompts[activityHint.toLowerCase() as keyof typeof activityPrompts];
    }

    return `Analyze this health and fitness content comprehensively, identifying the most relevant aspects based on the content provided.`;
  }

  /**
   * Creates context-aware analysis instructions
   */
  static createContextualInstructions(userContext: {
    userId: string;
    timestamp: string;
    userGoals?: string[];
    userPreferences?: {
      fitnessLevel?: string;
      preferredActivities?: string[];
      healthConditions?: string[];
    };
  }): string {
    let instructions = `
Analyze this health activity with the following user context:
- User ID: ${userContext.userId}
- Timestamp: ${userContext.timestamp}`;

    if (userContext.userGoals?.length) {
      instructions += `\n- User Goals: ${userContext.userGoals.join(', ')}`;
    }

    if (userContext.userPreferences) {
      const prefs = userContext.userPreferences;
      if (prefs.fitnessLevel) {
        instructions += `\n- Fitness Level: ${prefs.fitnessLevel}`;
      }
      if (prefs.preferredActivities?.length) {
        instructions += `\n- Preferred Activities: ${prefs.preferredActivities.join(', ')}`;
      }
      if (prefs.healthConditions?.length) {
        instructions += `\n- Health Conditions: ${prefs.healthConditions.join(', ')}`;
      }
    }

    instructions += `\n
Please provide a comprehensive analysis that:
1. Identifies the specific activity type and category
2. Estimates duration, intensity, and calorie burn
3. Provides detailed insights relevant to the user's goals and fitness level
4. Offers personalized recommendations and improvements
5. Considers any health conditions or preferences mentioned
6. Assigns appropriate tags for categorization and tracking`;

    return instructions;
  }
} 