import type { HealthActivity, Profile } from "@/types/database";
import { 
  calculateBMR, 
  calculateCalorieDeficit, 
  calculateDailyProtein, 
  calculateDailySteps, 
  calculateWorkoutDuration, 
  calculateWorkoutCalories, 
  calculateFoodCalories 
} from "@/lib/utils/health-calculations";

export interface ProcessedHealthMetrics {
  calorieDeficit: {
    value: number;
    bmr: number;
    tdee: number;
    workoutCalories: number;
    foodCalories: number;
    percentage: number;
  };
  protein: {
    consumed: number;
    goal: number;
    percentage: number;
    sources: string[];
  };
  steps: {
    count: number;
    goal: number;
    percentage: number;
    estimated: boolean;
  };
  exercise: {
    duration: number;
    goal: number;
    percentage: number;
    workoutCount: number;
    types: string[];
  };
}

export interface DailyProcessedData {
  date: string;
  metrics: ProcessedHealthMetrics;
  activities: {
    meals: HealthActivity[];
    workouts: HealthActivity[];
    other: HealthActivity[];
  };
  goals: {
    mealsLogged: boolean;
    workoutCompleted: boolean;
    proteinTarget: boolean;
    calorieDeficit: boolean;
  };
}

export class HealthDataProcessor {
  private profile: Profile | null;
  private activities: HealthActivity[];

  constructor(profile: Profile | null, activities: HealthActivity[]) {
    this.profile = profile;
    this.activities = activities;
  }

  /**
   * Process activities for a specific date
   */
  processDay(date: string): DailyProcessedData {
    const dayActivities = this.activities.filter(activity => 
      activity.activity_date.startsWith(date)
    );

    return {
      date,
      metrics: this.calculateMetrics(dayActivities),
      activities: this.categorizeActivities(dayActivities),
      goals: this.evaluateGoals(dayActivities)
    };
  }

  /**
   * Process activities for today
   */
  processToday(): DailyProcessedData {
    const today = new Date().toISOString().split('T')[0];
    return this.processDay(today);
  }

  /**
   * Process activities for the last 7 days
   */
  processWeek(): DailyProcessedData[] {
    const days: DailyProcessedData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      days.push(this.processDay(dateString));
    }
    
    return days;
  }

  /**
   * Calculate all health metrics for given activities
   */
  private calculateMetrics(activities: HealthActivity[]): ProcessedHealthMetrics {
    if (!this.profile) {
      return this.getEmptyMetrics();
    }

    // Calorie calculations
    const bmr = calculateBMR(this.profile);
    const workoutCalories = calculateWorkoutCalories(activities);
    const foodCalories = calculateFoodCalories(activities);
    const calorieDeficit = calculateCalorieDeficit(
      bmr,
      this.profile.activity_level || 'moderately_active',
      workoutCalories,
      foodCalories
    );

    // Protein calculations
    const proteinConsumed = calculateDailyProtein(activities);
    const proteinGoal = 60; // Default goal
    const proteinSources = this.extractProteinSources(activities);

    // Steps calculations
    const stepCount = calculateDailySteps(activities);
    const stepsGoal = 10000;
    const stepsEstimated = this.areStepsEstimated(activities);

    // Exercise calculations
    const exerciseDuration = calculateWorkoutDuration(activities);
    const exerciseGoal = 30; // 30 minutes daily
    const workoutCount = activities.filter(a => a.type === 'workout').length;
    const exerciseTypes = this.extractExerciseTypes(activities);

    return {
      calorieDeficit: {
        value: calorieDeficit,
        bmr,
        tdee: bmr * this.getActivityMultiplier(this.profile.activity_level || 'moderately_active'),
        workoutCalories,
        foodCalories,
        percentage: Math.max(0, Math.min(100, (calorieDeficit / 500) * 100)) // 500 cal deficit = 100%
      },
      protein: {
        consumed: proteinConsumed,
        goal: proteinGoal,
        percentage: Math.min(100, (proteinConsumed / proteinGoal) * 100),
        sources: proteinSources
      },
      steps: {
        count: stepCount,
        goal: stepsGoal,
        percentage: Math.min(100, (stepCount / stepsGoal) * 100),
        estimated: stepsEstimated
      },
      exercise: {
        duration: exerciseDuration,
        goal: exerciseGoal,
        percentage: Math.min(100, (exerciseDuration / exerciseGoal) * 100),
        workoutCount,
        types: exerciseTypes
      }
    };
  }

  /**
   * Categorize activities by type
   */
  private categorizeActivities(activities: HealthActivity[]) {
    return {
      meals: activities.filter(a => a.type === 'meal'),
      workouts: activities.filter(a => a.type === 'workout'),
      other: activities.filter(a => !['meal', 'workout'].includes(a.type))
    };
  }

  /**
   * Evaluate daily goals
   */
  private evaluateGoals(activities: HealthActivity[]) {
    const meals = activities.filter(a => a.type === 'meal');
    const workouts = activities.filter(a => a.type === 'workout');
    const protein = calculateDailyProtein(activities);
    
    const calorieDeficit = this.profile ? calculateCalorieDeficit(
      calculateBMR(this.profile),
      this.profile.activity_level || 'moderately_active',
      calculateWorkoutCalories(activities),
      calculateFoodCalories(activities)
    ) : 0;

    return {
      mealsLogged: meals.length >= 3,
      workoutCompleted: workouts.length > 0,
      proteinTarget: protein >= 60,
      calorieDeficit: calorieDeficit > 0
    };
  }

  /**
   * Extract protein sources from meals
   */
  private extractProteinSources(activities: HealthActivity[]): string[] {
    const sources: Set<string> = new Set();
    
    activities.forEach(activity => {
      if (activity.type === 'meal' && activity.ai_analysis?.foodItems) {
        activity.ai_analysis.foodItems.forEach((food: any) => {
          if (food.macros?.protein && food.macros.protein > 5) { // At least 5g protein
            sources.add(food.name);
          }
        });
      }
    });
    
    return Array.from(sources);
  }

  /**
   * Extract exercise types from workouts
   */
  private extractExerciseTypes(activities: HealthActivity[]): string[] {
    const types: Set<string> = new Set();
    
    activities.forEach(activity => {
      if (activity.type === 'workout') {
        if (activity.ai_analysis?.activityType) {
          types.add(activity.ai_analysis.activityType);
        }
        if (activity.ai_analysis?.exercises) {
          activity.ai_analysis.exercises.forEach((exercise: any) => {
            types.add(exercise.name.split(' ')[0]); // First word of exercise name
          });
        }
      }
    });
    
    return Array.from(types);
  }

  /**
   * Check if steps are estimated vs. directly tracked
   */
  private areStepsEstimated(activities: HealthActivity[]): boolean {
    const hasDirectSteps = activities.some(activity => 
      activity.activity_data?.steps || activity.ai_analysis?.steps
    );
    return !hasDirectSteps;
  }

  /**
   * Get activity level multiplier for TDEE calculation
   */
  private getActivityMultiplier(activityLevel: string): number {
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };
    return multipliers[activityLevel as keyof typeof multipliers] || 1.55;
  }

  /**
   * Return empty metrics when no profile is available
   */
  private getEmptyMetrics(): ProcessedHealthMetrics {
    return {
      calorieDeficit: {
        value: 0,
        bmr: 0,
        tdee: 0,
        workoutCalories: 0,
        foodCalories: 0,
        percentage: 0
      },
      protein: {
        consumed: 0,
        goal: 60,
        percentage: 0,
        sources: []
      },
      steps: {
        count: 0,
        goal: 10000,
        percentage: 0,
        estimated: true
      },
      exercise: {
        duration: 0,
        goal: 30,
        percentage: 0,
        workoutCount: 0,
        types: []
      }
    };
  }

  /**
   * Generate insights based on processed data
   */
  generateInsights(processedData: DailyProcessedData): string[] {
    const insights: string[] = [];
    const { metrics, goals } = processedData;

    // Calorie deficit insights
    if (metrics.calorieDeficit.value > 1000) {
      insights.push("Your calorie deficit is quite high. Consider adding a healthy snack.");
    } else if (metrics.calorieDeficit.value < 0) {
      insights.push("You're in a calorie surplus today. Consider a light workout or walk.");
    } else if (metrics.calorieDeficit.value > 300 && metrics.calorieDeficit.value <= 500) {
      insights.push("Great job maintaining a healthy calorie deficit!");
    }

    // Protein insights
    if (metrics.protein.percentage >= 100) {
      insights.push("Excellent protein intake today! This will help with muscle recovery.");
    } else if (metrics.protein.percentage < 50) {
      insights.push("Consider adding more protein-rich foods to reach your daily goal.");
    }

    // Exercise insights
    if (metrics.exercise.workoutCount === 0) {
      insights.push("No workouts logged today. Even a 10-minute walk counts!");
    } else if (metrics.exercise.percentage >= 100) {
      insights.push("Amazing workout today! Don't forget to rest and recover.");
    }

    // Steps insights
    if (metrics.steps.count < 5000) {
      insights.push("Try to get more steps in today. Take the stairs or go for a walk.");
    } else if (metrics.steps.count >= 10000) {
      insights.push("Fantastic step count today! You're staying active.");
    }

    return insights;
  }
}