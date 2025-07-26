import type { HealthActivity, Profile } from "@/types/database";
import { 
  calculateBMR, 
  calculateNetCalorieBalance,
  calculateCalorieProgress,
  getDailyCalorieGoal,
  calculateCalorieBudget,
  calculateDailyProtein, 
  calculateDailySteps, 
  calculateWorkoutDuration, 
  calculateWorkoutCalories, 
  calculateFoodCalories 
} from "@/lib/utils/health-calculations";

export interface ProcessedHealthMetrics {
  calories: {
    netBalance: number;
    goal: number;
    budget: number;
    bmr: number;
    workoutCaloriesBurned: number;
    foodCaloriesConsumed: number;
    progressValue: number;
    progressPercentage: number;
    isOnTrack: boolean;
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
    calorieGoal: boolean;
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
    const workoutCaloriesBurned = calculateWorkoutCalories(activities);
    const foodCaloriesConsumed = calculateFoodCalories(activities);
    const fitnessGoals = this.profile.fitness_goals || [];
    
    const netCalorieBalance = calculateNetCalorieBalance(
      bmr,
      workoutCaloriesBurned,
      foodCaloriesConsumed
    );
    
    const dailyCalorieGoal = getDailyCalorieGoal(fitnessGoals);
    const calorieBudget = calculateCalorieBudget(
      bmr,
      this.profile.activity_level || 'moderately_active',
      fitnessGoals
    );
    
    const calorieProgress = calculateCalorieProgress(
      netCalorieBalance,
      dailyCalorieGoal
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
      calories: {
        netBalance: netCalorieBalance,
        goal: dailyCalorieGoal,
        budget: calorieBudget,
        bmr,
        workoutCaloriesBurned,
        foodCaloriesConsumed,
        progressValue: calorieProgress.progressValue,
        progressPercentage: calorieProgress.progressPercentage,
        isOnTrack: calorieProgress.isOnTrack
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
    
    const netBalance = this.profile ? calculateNetCalorieBalance(
      calculateBMR(this.profile),
      calculateWorkoutCalories(activities),
      calculateFoodCalories(activities)
    ) : 0;
    
    const dailyGoal = this.profile ? getDailyCalorieGoal(this.profile.fitness_goals || []) : 0;
    const calorieProgress = calculateCalorieProgress(netBalance, dailyGoal);

    return {
      mealsLogged: meals.length >= 3,
      workoutCompleted: workouts.length > 0,
      proteinTarget: protein >= 60,
      calorieGoal: calorieProgress.isOnTrack
    };
  }

  /**
   * Extract protein sources from meals
   */
  private extractProteinSources(activities: HealthActivity[]): string[] {
    const sources: Set<string> = new Set();
    
    activities.forEach(activity => {
      if (activity.type === 'meal') {
        // Check if there's protein data
        const hasProtein = activity.nutrition_data?.protein_g || 
                          activity.ai_analysis?.nutritionalInfo?.macros?.protein;
        
        if (hasProtein && hasProtein > 5) {
          // Use the meal title or description as the source
          if (activity.title && activity.title !== 'Meal') {
            sources.add(activity.title);
          } else if (activity.ai_analysis?.tags) {
            // Add cuisine type if available
            const cuisineTags = activity.ai_analysis.tags.filter((tag: string) => 
              tag.includes('Cuisine') || tag.includes('cuisine')
            );
            if (cuisineTags.length > 0) {
              sources.add(cuisineTags[0]);
            }
          }
        }
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
          activity.ai_analysis.exercises.forEach((exercise: { name: string }) => {
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
   * Generate insights based on processed data (static fallback)
   */
  generateInsights(processedData: DailyProcessedData): string[] {
    const insights: string[] = [];
    const { metrics } = processedData;

    // Calorie balance insights
    const { netBalance, goal, isOnTrack } = metrics.calories;
    
    if (isOnTrack) {
      insights.push("Perfect! You're right on track with your calorie goal.");
    } else if (goal < 0 && netBalance > 0) {
      // Weight loss goal but in surplus
      insights.push("You're in a calorie surplus. Consider adding a workout or reducing portions.");
    } else if (goal > 0 && netBalance < -200) {
      // Weight gain goal but large deficit
      insights.push("You're not eating enough for your weight gain goal. Add a healthy snack.");
    } else if (Math.abs(netBalance - goal) > 300) {
      insights.push("You're quite far from your calorie goal. Small adjustments can help!");
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