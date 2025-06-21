import { ai, HealthActivitySchema, HealthAnalysisInputSchema, type HealthActivity, type HealthAnalysisInput } from './genkit-config';
import { googleAI } from '@genkit-ai/googleai';
import { MultimodalProcessor, HealthActivityPrompts, MediaDataSchema } from './multimodal-utils';

/**
 * Enhanced main AI flow for analyzing health activities using multimodal inputs
 * Supports text, image, audio, and video inputs with comprehensive validation
 */
export const analyzeHealthActivityFlow = ai.defineFlow(
  {
    name: 'analyzeHealthActivity',
    inputSchema: HealthAnalysisInputSchema,
    outputSchema: HealthActivitySchema,
  },
  async (input: HealthAnalysisInput): Promise<HealthActivity> => {
    try {
      // Step 1: Prepare and validate all inputs using multimodal processor
      const inputsToProcess: any = {
        text: input.textInput,
        imageData: input.imageData,
        audioData: input.audioData,
      };

      // Remove undefined inputs
      Object.keys(inputsToProcess).forEach(key => {
        if (inputsToProcess[key] === undefined) {
          delete inputsToProcess[key];
        }
      });

      if (Object.keys(inputsToProcess).length === 0) {
        throw new Error('At least one input type (text, image, or audio) is required');
      }

      // Step 2: Process inputs and get prompt parts
      const { promptParts, inputTypes } = MultimodalProcessor.combineInputsForAnalysis(inputsToProcess);

      // Step 3: Create contextual analysis instructions
      const contextualInstructions = HealthActivityPrompts.createContextualInstructions(input.context);
      
      // Add the contextual instructions to prompt
      promptParts.push({ text: contextualInstructions });

      // Step 4: Generate AI analysis using Gemini 2.0 Flash
      const analysis = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: promptParts,
        output: {
          schema: HealthActivitySchema,
        },
      });

      if (!analysis.output) {
        throw new Error('Failed to generate health activity analysis - no output received');
      }

      // Step 5: Post-process and enhance results
      const result = analysis.output;
      
      // Ensure timestamp is set
      result.timestamp = input.context.timestamp;
      
      // Add context-based tags
      if (input.context.userGoals) {
        const goalTags = input.context.userGoals.map(goal => 
          `goal:${goal.toLowerCase().replace(/\s+/g, '_')}`
        );
        result.tags = [...(result.tags || []), ...goalTags];
      }
      
      // Add source tags based on input types
      inputTypes.forEach(type => {
        result.tags.push(`source:${type}`);
      });

      // Add multimodal tag if multiple input types
      if (inputTypes.length > 1) {
        result.tags.push('analysis:multimodal');
      }

      // Add processing metadata
      result.tags.push(`processed:${new Date().toISOString()}`);

      return result;

    } catch (error) {
      console.error('Health Activity Analysis Error:', error);
      throw new Error(`Health activity analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Enhanced quick text analysis flow with improved validation
 */
export const quickAnalyzeTextFlow = ai.defineFlow(
  {
    name: 'quickAnalyzeText',
    inputSchema: HealthAnalysisInputSchema,
    outputSchema: HealthActivitySchema,
  },
  async (input: HealthAnalysisInput): Promise<HealthActivity> => {
    if (!input.textInput || input.textInput.trim().length === 0) {
      throw new Error('Non-empty text input is required for quick analysis');
    }

    try {
      // Generate activity-specific prompt based on text content
      const activityHint = detectActivityType(input.textInput);
      const activitySpecificPrompt = HealthActivityPrompts.getActivitySpecificPrompt(activityHint);
      const contextualInstructions = HealthActivityPrompts.createContextualInstructions(input.context);

      const fullPrompt = `${input.textInput}

${activitySpecificPrompt}

${contextualInstructions}

Provide a quick but comprehensive analysis focusing on the most relevant aspects for this type of activity.`;

      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: fullPrompt,
        output: {
          schema: HealthActivitySchema,
        },
      });

      if (!output) {
        throw new Error('Failed to generate quick text analysis - no output received');
      }

      // Enhance the output with metadata
      output.tags = [...(output.tags || []), 'analysis:quick', 'source:text'];
      output.timestamp = input.context.timestamp;

      // Add activity hint tag if detected
      if (activityHint) {
        output.tags.push(`detected:${activityHint}`);
      }

      return output;

    } catch (error) {
      console.error('Quick Text Analysis Error:', error);
      throw new Error(`Quick text analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Enhanced image analysis flow with comprehensive validation
 */
export const analyzeImageFlow = ai.defineFlow(
  {
    name: 'analyzeImage',
    inputSchema: HealthAnalysisInputSchema,
    outputSchema: HealthActivitySchema,
  },
  async (input: HealthAnalysisInput): Promise<HealthActivity> => {
    if (!input.imageData) {
      throw new Error('Image data is required for image analysis');
    }

    try {
      // Validate image data using multimodal processor
      const validation = MultimodalProcessor.validateImageData(input.imageData);
      if (!validation.isValid) {
        throw new Error(`Image validation failed: ${validation.error}`);
      }

      // Prepare image for processing
      const imagePromptPart = MultimodalProcessor.prepareForGenkit(input.imageData);
      
      // Generate context-aware analysis prompt for images
      const userContext = input.context.userPreferences ? {
        fitnessLevel: input.context.userPreferences.fitnessLevel,
        goals: input.context.userGoals,
        preferences: input.context.userPreferences.preferredActivities
      } : undefined;

      const imageAnalysisPrompt = MultimodalProcessor.generateAnalysisPrompt('image', userContext);
      const contextualInstructions = HealthActivityPrompts.createContextualInstructions(input.context);

      const promptParts = [
        imagePromptPart,
        { text: imageAnalysisPrompt },
        { text: input.textInput || 'No additional text context provided.' },
        { text: contextualInstructions }
      ];

      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: promptParts,
        output: {
          schema: HealthActivitySchema,
        },
      });

      if (!output) {
        throw new Error('Failed to generate image analysis - no output received');
      }

      // Enhance output with image-specific metadata
      output.tags = [...(output.tags || []), 'analysis:visual', 'source:image'];
      output.timestamp = input.context.timestamp;

      // Add image metadata if available
      if (input.imageData.filename) {
        output.tags.push(`file:${input.imageData.filename}`);
      }

      const mediaType = MultimodalProcessor.getMediaType(input.imageData.mimeType);
      output.tags.push(`format:${mediaType}`);

      return output;

    } catch (error) {
      console.error('Image Analysis Error:', error);
      throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * New audio analysis flow for processing audio inputs
 */
export const analyzeAudioFlow = ai.defineFlow(
  {
    name: 'analyzeAudio',
    inputSchema: HealthAnalysisInputSchema,
    outputSchema: HealthActivitySchema,
  },
  async (input: HealthAnalysisInput): Promise<HealthActivity> => {
    if (!input.audioData) {
      throw new Error('Audio data is required for audio analysis');
    }

    try {
      // Validate audio data
      const validation = MultimodalProcessor.validateAudioData(input.audioData);
      if (!validation.isValid) {
        throw new Error(`Audio validation failed: ${validation.error}`);
      }

      // Step 1: Transcribe audio first
      const audioPromptPart = MultimodalProcessor.prepareForGenkit(input.audioData);
      
      const transcriptionResponse = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: [
          audioPromptPart,
          { text: 'Transcribe this audio accurately and describe any health or fitness related activities mentioned.' }
        ]
      });

      if (!transcriptionResponse.text) {
        throw new Error('Failed to transcribe audio');
      }

      // Step 2: Analyze the transcribed content
      const userContext = input.context.userPreferences ? {
        fitnessLevel: input.context.userPreferences.fitnessLevel,
        goals: input.context.userGoals,
        preferences: input.context.userPreferences.preferredActivities
      } : undefined;

      const audioAnalysisPrompt = MultimodalProcessor.generateAnalysisPrompt('audio', userContext);
      const contextualInstructions = HealthActivityPrompts.createContextualInstructions(input.context);

      const analysisPrompt = `Transcribed Audio Content: "${transcriptionResponse.text}"

${input.textInput ? `Additional Context: ${input.textInput}` : ''}

${audioAnalysisPrompt}

${contextualInstructions}`;

      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash'),
        prompt: analysisPrompt,
        output: {
          schema: HealthActivitySchema,
        },
      });

      if (!output) {
        throw new Error('Failed to generate audio analysis - no output received');
      }

      // Enhance output with audio-specific metadata
      output.tags = [...(output.tags || []), 'analysis:audio', 'source:audio'];
      output.timestamp = input.context.timestamp;

      // Add transcription note
      if (output.notes) {
        output.notes += `\n\nTranscribed Audio: "${transcriptionResponse.text}"`;
      } else {
        output.notes = `Transcribed Audio: "${transcriptionResponse.text}"`;
      }

      return output;

    } catch (error) {
      console.error('Audio Analysis Error:', error);
      throw new Error(`Audio analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

/**
 * Helper function to detect activity type from text
 */
function detectActivityType(text: string): string | undefined {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('run') || lowerText.includes('jog') || lowerText.includes('cardio')) {
    return 'cardio';
  }
  if (lowerText.includes('weight') || lowerText.includes('lift') || lowerText.includes('strength')) {
    return 'strength';
  }
  if (lowerText.includes('yoga') || lowerText.includes('stretch') || lowerText.includes('flexibility')) {
    return 'yoga';
  }
  if (lowerText.includes('meal') || lowerText.includes('food') || lowerText.includes('ate') || lowerText.includes('nutrition')) {
    return 'nutrition';
  }
  
  return undefined;
} 