import type { Profile, HealthActivity } from "@/types/database";

/**
 * Calculate BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation
 * More accurate than Harris-Benedict for modern populations
 */
export function calculateBMR(profile: Profile): number {
  if (!profile.height_cm || !profile.weight_kg || !profile.date_of_birth) {
    return 0;
  }

  // Calculate age from date of birth
  const today = new Date();
  const birthDate = new Date(profile.date_of_birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Mifflin-St Jeor Equation
  // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
  // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
  // Using men's formula as default since gender is not in profile schema
  const bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age + 5;

  return Math.round(bmr);
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure) by applying activity multiplier
 * Note: This represents base daily activity, separate from logged workouts
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };

  const multiplier = multipliers[activityLevel as keyof typeof multipliers] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate daily calorie budget based on goals
 * Returns the target daily calorie intake
 */
export function calculateCalorieBudget(
  bmr: number,
  activityLevel: string,
  fitnessGoals: string[]
): number {
  const tdee = calculateTDEE(bmr, activityLevel);
  const goalAdjustment = getDailyCalorieGoal(fitnessGoals);
  
  return Math.round(tdee + goalAdjustment);
}

/**
 * Get daily calorie goal based on fitness goals
 * Returns target calorie deficit/surplus for the day
 */
export function getDailyCalorieGoal(fitnessGoals: string[]): number {
  if (fitnessGoals.includes('weight_loss')) {
    return -400; // 400 calorie deficit for weight loss
  } else if (fitnessGoals.includes('weight_gain') || fitnessGoals.includes('muscle_building')) {
    return 300; // 300 calorie surplus for weight gain
  }
  return 0; // Maintenance for other goals
}

/**
 * Calculate net calorie balance for the day
 * Formula: (BMR + Workout Calories Burned) - Food Calories Consumed
 * Positive = surplus, Negative = deficit
 */
export function calculateNetCalorieBalance(
  bmr: number,
  workoutCaloriesBurned: number,
  foodCaloriesConsumed: number
): number {
  const totalCaloriesBurned = bmr + workoutCaloriesBurned;
  const netBalance = foodCaloriesConsumed - totalCaloriesBurned;

  return Math.round(netBalance);
}

/**
 * Calculate calorie deficit/surplus relative to goal
 * Positive = on track toward goal, Negative = away from goal
 */
export function calculateCalorieProgress(
  netCalorieBalance: number,
  dailyCalorieGoal: number
): {
  progressValue: number;
  isOnTrack: boolean;
  progressPercentage: number;
} {
  // For weight loss goal (negative target), we want negative balance
  // For weight gain goal (positive target), we want positive balance
  const progressValue = dailyCalorieGoal - netCalorieBalance;
  const isOnTrack = Math.abs(progressValue) <= 100; // Within 100 calories of goal
  
  // Calculate percentage (100% = perfectly on track)
  const maxDeviation = 500; // Max expected deviation
  const progressPercentage = Math.max(0, Math.min(100, 
    100 - (Math.abs(progressValue) / maxDeviation) * 100
  ));

  return {
    progressValue,
    isOnTrack,
    progressPercentage
  };
}

/**
 * Calculate daily protein intake
 */
export function calculateDailyProtein(activities: HealthActivity[]): number {
  let totalProtein = 0;

  activities.forEach((activity) => {
    if (activity.type === "meal") {
      // Check nutrition_data first
      if (activity.nutrition_data?.protein_g) {
        totalProtein += activity.nutrition_data.protein_g;
      }
      // Check AI analysis as fallback
      else if (activity.ai_analysis?.nutritionalInfo?.macros?.protein) {
        totalProtein += activity.ai_analysis.nutritionalInfo.macros.protein;
      }
    }
  });

  return totalProtein;
}

/**
 * Calculate workout duration
 */
export function calculateWorkoutDuration(activities: HealthActivity[]): number {
  let totalDuration = 0;

  activities.forEach((activity) => {
    if (activity.type === "workout") {
      // Check activity_data first
      if (activity.activity_data?.duration_minutes) {
        totalDuration += activity.activity_data.duration_minutes;
      }
      // Check AI analysis as fallback
      else if (activity.ai_analysis?.duration?.value) {
        totalDuration += activity.ai_analysis.duration.value;
      }
    }
  });

  return totalDuration;
}

/**
 * Calculate workout calories burned
 */
export function calculateWorkoutCalories(
  activities: { type: string; calories_estimated: number | null }[]
): number {
  let totalCalories = 0;

  activities.forEach((activity) => {
    if (activity.type === "workout" && activity.calories_estimated) {
      totalCalories += activity.calories_estimated;
    }
  });

  return totalCalories;
}

/**
 * Calculate food calories consumed
 */
export function calculateFoodCalories(
  activities: { type: string; calories_estimated: number | null }[]
): number {
  let totalCalories = 0;

  activities.forEach((activity) => {
    if (activity.type === "meal" && activity.calories_estimated) {
      totalCalories += activity.calories_estimated;
    }
  });

  return totalCalories;
}

/**
 * Calculate daily steps
 */
export function calculateDailySteps(activities: HealthActivity[]): number {
  let totalSteps = 0;

  activities.forEach((activity) => {
    if (activity.type === "workout" && activity.activity_data?.steps) {
      totalSteps += activity.activity_data.steps;
    }
  });

  return totalSteps;
}

/**
 * Check if steps are estimated
 */
export function areStepsEstimated(activities: HealthActivity[]): boolean {
  return activities.some(
    (activity) =>
      activity.type === "workout" && activity.activity_data?.steps_estimated
  );
}