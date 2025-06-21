#!/usr/bin/env node

// Comprehensive Test Suite for Fitally AI Flows
// Usage: node test-ai-flows.js [test-name]
// Available tests: quick, full, yoga, strength, nutrition, all

const API_BASE = 'http://localhost:3000/api/ai/analyze';

// Test cases for different scenarios
const testCases = {
  quick: {
    name: 'Quick Text Analysis - Running',
    type: 'quick',
    input: {
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
    }
  },

  yoga: {
    name: 'Quick Analysis - Yoga Session',
    type: 'quick',
    input: {
      textInput: "Did 45 minutes of yoga this morning. Focused on flexibility and balance poses. Used a yoga mat and blocks.",
      context: {
        userId: "test-user-456",
        timestamp: new Date().toISOString(),
        userGoals: ["flexibility", "stress_relief"],
        userPreferences: {
          fitnessLevel: "beginner",
          preferredActivities: ["yoga", "pilates"],
          healthConditions: []
        }
      }
    }
  },

  strength: {
    name: 'Full Analysis - Strength Training',
    type: 'full',
    input: {
      textInput: "Just finished my strength training session. Did 4 sets of squats (135 lbs), 3 sets of deadlifts (185 lbs), and 3 sets of bench press (155 lbs). Total workout time was about 90 minutes.",
      context: {
        userId: "test-user-789",
        timestamp: new Date().toISOString(),
        userGoals: ["muscle_gain", "strength"],
        userPreferences: {
          fitnessLevel: "advanced",
          preferredActivities: ["strength_training", "powerlifting"],
          healthConditions: []
        }
      }
    }
  },

  nutrition: {
    name: 'Quick Analysis - Meal Logging',
    type: 'quick',
    input: {
      textInput: "Had a healthy breakfast: 2 scrambled eggs, 1 slice of whole grain toast, half an avocado, and a cup of black coffee.",
      context: {
        userId: "test-user-101",
        timestamp: new Date().toISOString(),
        userGoals: ["weight_loss", "healthy_eating"],
        userPreferences: {
          fitnessLevel: "intermediate",
          preferredActivities: ["running", "yoga"],
          healthConditions: []
        }
      }
    }
  },

  swimming: {
    name: 'Full Analysis - Swimming',
    type: 'full',
    input: {
      textInput: "Went swimming for 45 minutes. Did 20 laps of freestyle, 10 laps of backstroke, and 5 laps of butterfly stroke. Pool was 25 meters.",
      context: {
        userId: "test-user-202",
        timestamp: new Date().toISOString(),
        userGoals: ["cardio", "full_body_workout"],
        userPreferences: {
          fitnessLevel: "intermediate",
          preferredActivities: ["swimming", "cycling"],
          healthConditions: []
        }
      }
    }
  },

  cycling: {
    name: 'Quick Analysis - Bike Ride',
    type: 'quick',
    input: {
      textInput: "Took a 2-hour bike ride through the hills. Covered about 25 miles with some challenging climbs. Used my road bike.",
      context: {
        userId: "test-user-303",
        timestamp: new Date().toISOString(),
        userGoals: ["endurance", "weight_loss"],
        userPreferences: {
          fitnessLevel: "advanced",
          preferredActivities: ["cycling", "running"],
          healthConditions: []
        }
      }
    }
  }
};

// Utility functions
function formatResult(result, testName) {
  console.log(`\n✅ ${testName} - SUCCESS`);
  console.log('📊 Key Results:');
  console.log(`   Activity: ${result.data.activityType}${result.data.subCategory ? ` (${result.data.subCategory})` : ''}`);
  console.log(`   Confidence: ${(result.data.confidence * 100).toFixed(1)}%`);
  
  if (result.data.duration) {
    console.log(`   Duration: ${result.data.duration.value} ${result.data.duration.unit}`);
  }
  
  if (result.data.calories) {
    console.log(`   Calories: ${result.data.calories.estimated} (${(result.data.calories.confidence * 100).toFixed(1)}% confidence)`);
  }
  
  if (result.data.intensity) {
    console.log(`   Intensity: ${result.data.intensity}`);
  }
  
  if (result.data.insights?.primaryMuscleGroups?.length) {
    console.log(`   Muscle Groups: ${result.data.insights.primaryMuscleGroups.join(', ')}`);
  }
  
  if (result.data.insights?.equipmentUsed?.length) {
    console.log(`   Equipment: ${result.data.insights.equipmentUsed.join(', ')}`);
  }
  
  console.log(`   Tags: ${result.data.tags?.join(', ') || 'none'}`);
  
  if (result.data.insights?.improvements?.length) {
    console.log('💡 Top Improvement Suggestion:');
    console.log(`   ${result.data.insights.improvements[0]}`);
  }
}

async function runTest(testCase) {
  try {
    console.log(`\n🧪 Running: ${testCase.name}`);
    console.log(`📝 Input: "${testCase.input.textInput.substring(0, 50)}..."`);
    
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: testCase.type,
        input: testCase.input
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    formatResult(result, testCase.name);
    return result;

  } catch (error) {
    console.log(`\n❌ ${testCase.name} - FAILED`);
    console.log(`   Error: ${error.message}`);
    throw error;
  }
}

async function runAllTests() {
  console.log('🚀 Running All Fitally AI Flow Tests\n');
  console.log('=' .repeat(50));
  
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const [key, testCase] of Object.entries(testCases)) {
    try {
      const result = await runTest(testCase);
      results.push({ test: key, status: 'PASSED', result });
      passed++;
    } catch (error) {
      results.push({ test: key, status: 'FAILED', error: error.message });
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Fitally AI flows are working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
  
  return { passed, failed, total: passed + failed };
}

// Main execution
async function main() {
  const testName = process.argv[2];

  try {
    if (!testName || testName === 'all') {
      await runAllTests();
    } else if (testCases[testName]) {
      await runTest(testCases[testName]);
      console.log('\n🎉 Test completed successfully!');
    } else {
      console.log('❌ Unknown test name. Available tests:');
      console.log('   ' + Object.keys(testCases).join(', ') + ', all');
      console.log('\nUsage: node test-ai-flows.js [test-name]');
      console.log('Example: node test-ai-flows.js quick');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 