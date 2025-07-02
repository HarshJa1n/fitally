import type { Profile } from "@/types/database";

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
  workoutCalories: number,
  foodCalories: number
): number {
  const tdee = calculateTDEE(bmr, activityLevel);
  const totalBurned = tdee + workoutCalories;
  const deficit = totalBurned - foodCalories;
  
  return Math.round(deficit);
}

/**
 * Extract protein from health activities
 */
export function calculateDailyProtein(activities: any[]): number {
  let totalProtein = 0;

  activities.forEach(activity => {
    if (activity.type === 'meal' && activity.ai_analysis?.nutritionalInfo?.macros?.protein) {
      totalProtein += activity.ai_analysis.nutritionalInfo.macros.protein;
    }
    
    // Also check foodItems array if available
    if (activity.ai_analysis?.foodItems) {
      activity.ai_analysis.foodItems.forEach((foodItem: any) => {
        if (foodItem.macros?.protein) {
          totalProtein += foodItem.macros.protein;
        }
      });
    }
  });

  return Math.round(totalProtein);
}

/**
 * Calculate total workout duration in minutes
 */
export function calculateWorkoutDuration(activities: any[]): number {
  let totalDuration = 0;

  activities.forEach(activity => {
    if (activity.type === 'workout') {
      // Check AI analysis duration
      if (activity.ai_analysis?.duration) {
        const duration = activity.ai_analysis.duration;
        if (duration.unit === 'minutes') {
          totalDuration += duration.value;
        } else if (duration.unit === 'hours') {
          totalDuration += duration.value * 60;
        } else if (duration.unit === 'seconds') {
          totalDuration += duration.value / 60;
        }
      }
      
      // Also check exercises array for individual durations
      if (activity.ai_analysis?.exercises) {
        activity.ai_analysis.exercises.forEach((exercise: any) => {
          if (exercise.duration) {
            if (exercise.duration.unit === 'minutes') {
              totalDuration += exercise.duration.value;
            } else if (exercise.duration.unit === 'seconds') {
              totalDuration += exercise.duration.value / 60;
            }
          }
        });
      }
    }
  });

  return Math.round(totalDuration);
}

/**
 * Calculate workout calories burned
 */
export function calculateWorkoutCalories(activities: any[]): number {
  let totalCalories = 0;

  activities.forEach(activity => {
    if (activity.type === 'workout' && activity.calories_estimated) {
      totalCalories += activity.calories_estimated;
    }
  });

  return totalCalories;
}

/**
 * Calculate food calories consumed
 */
export function calculateFoodCalories(activities: any[]): number {
  let totalCalories = 0;

  activities.forEach(activity => {
    if (activity.type === 'meal' && activity.calories_estimated) {
      totalCalories += activity.calories_estimated;
    }
  });

  return totalCalories;
}

/**
 * Extract steps from activities (if logged)
 * This is a placeholder for future step tracking implementation
 */
export function calculateDailySteps(activities: any[]): number {
  let totalSteps = 0;

  activities.forEach(activity => {
    // Check if activity has step data in activity_data or ai_analysis
    if (activity.activity_data?.steps) {
      totalSteps += activity.activity_data.steps;
    }
    
    if (activity.ai_analysis?.steps) {
      totalSteps += activity.ai_analysis.steps;
    }

    // Check for walking/running activities with distance to estimate steps
    if (activity.type === 'workout' && 
        (activity.ai_analysis?.activityType === 'walking' || 
         activity.ai_analysis?.activityType === 'running')) {
      
      // Rough estimation: 2000 steps per mile, 1.6 km per mile
      if (activity.ai_analysis.exercises) {
        activity.ai_analysis.exercises.forEach((exercise: any) => {
          if (exercise.distance) {
            if (exercise.distance.unit === 'miles') {
              totalSteps += exercise.distance.amount * 2000;
            } else if (exercise.distance.unit === 'km') {
              totalSteps += exercise.distance.amount * 1250; // approx steps per km
            }
          }
        });
      }
    }
  });

  return Math.round(totalSteps);
}