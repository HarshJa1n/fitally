import { quickAnalyzeTextFlow } from './health-activity-flow';
import type { HealthAnalysisInput } from './genkit-config';

/**
 * Test function to validate our AI flow implementation
 * Run this to test the Genkit AI flow before using it in production
 */
export async function testHealthActivityAnalysis() {
  console.log('🧪 Testing Fitally AI Health Activity Analysis...\n');

  // Sample test input
  const testInput: HealthAnalysisInput = {
    textInput: "I went for a 30-minute morning run around the park. Felt great, about 3 miles at a moderate pace. Had some water before and after.",
    context: {
      userId: "test-user-123",
      timestamp: new Date().toISOString(),
      userGoals: ["weight_loss", "improve_cardio"],
      userPreferences: {
        fitnessLevel: "intermediate",
        preferredActivities: ["running", "cycling"],
        healthConditions: []
      }
    }
  };

  try {
    console.log('📝 Input:', JSON.stringify(testInput, null, 2));
    console.log('\n🤖 Analyzing with AI...\n');

    const result = await quickAnalyzeTextFlow(testInput);
    
    console.log('✅ Analysis Result:');
    console.log(JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Uncomment the line below to run the test
// testHealthActivityAnalysis(); 