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
 * Calculate calorie deficit for the day
 * Positive = deficit, Negative = surplus
 */
export function calculateCalorieDeficit(
  bmr: number,
  activityLevel: string,
  foodCalories: number
): number {
  const tdee = calculateTDEE(bmr, activityLevel);
  const deficit = tdee - foodCalories;

  return Math.round(deficit);
}

/**
 * Calculate daily protein intake
 */
export function calculateDailyProtein(activities: HealthActivity[]): number {
  let totalProtein = 0;

  activities.forEach((activity) => {
    if (activity.type === "meal" && activity.nutrition_data?.protein_g) {
      totalProtein += activity.nutrition_data.protein_g;
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
    if (
      activity.type === "workout" &&
      activity.activity_data?.duration_minutes
    ) {
      totalDuration += activity.activity_data.duration_minutes;
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