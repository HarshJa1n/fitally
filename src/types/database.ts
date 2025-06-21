export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          date_of_birth: string | null
          height_cm: number | null
          weight_kg: number | null
          activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | null
          fitness_goals: string[] | null
          dietary_preferences: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | null
          fitness_goals?: string[] | null
          dietary_preferences?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active' | null
          fitness_goals?: string[] | null
          dietary_preferences?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      health_activities: {
        Row: {
          id: string
          user_id: string
          type: 'meal' | 'workout' | 'body_measurement' | 'sleep' | 'water_intake'
          title: string
          description: string | null
          image_url: string | null
          image_analysis: Record<string, any> | null
          activity_data: Record<string, any>
          ai_analysis: Record<string, any> | null
          nutrition_data: Record<string, any> | null
          calories_estimated: number | null
          confidence_score: number | null
          activity_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'meal' | 'workout' | 'body_measurement' | 'sleep' | 'water_intake'
          title: string
          description?: string | null
          image_url?: string | null
          image_analysis?: Record<string, any> | null
          activity_data?: Record<string, any>
          ai_analysis?: Record<string, any> | null
          nutrition_data?: Record<string, any> | null
          calories_estimated?: number | null
          confidence_score?: number | null
          activity_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'meal' | 'workout' | 'body_measurement' | 'sleep' | 'water_intake'
          title?: string
          description?: string | null
          image_url?: string | null
          image_analysis?: Record<string, any> | null
          activity_data?: Record<string, any>
          ai_analysis?: Record<string, any> | null
          nutrition_data?: Record<string, any> | null
          calories_estimated?: number | null
          confidence_score?: number | null
          activity_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      nutrition_logs: {
        Row: {
          id: string
          user_id: string
          health_activity_id: string | null
          food_item: string
          brand: string | null
          serving_size: number | null
          serving_unit: string | null
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          sugar_g: number | null
          sodium_mg: number | null
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          health_activity_id?: string | null
          food_item: string
          brand?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          health_activity_id?: string | null
          food_item?: string
          brand?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          health_activity_id: string | null
          workout_type: string
          duration_minutes: number | null
          calories_burned: number | null
          exercises: Record<string, any> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          health_activity_id?: string | null
          workout_type: string
          duration_minutes?: number | null
          calories_burned?: number | null
          exercises?: Record<string, any> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          health_activity_id?: string | null
          workout_type?: string
          duration_minutes?: number | null
          calories_burned?: number | null
          exercises?: Record<string, any> | null
          created_at?: string
        }
      }
      body_measurements: {
        Row: {
          id: string
          user_id: string
          health_activity_id: string | null
          weight_kg: number | null
          body_fat_percentage: number | null
          muscle_mass_kg: number | null
          measurements: Record<string, any> | null
          progress_photos: string[] | null
          measurement_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          health_activity_id?: string | null
          weight_kg?: number | null
          body_fat_percentage?: number | null
          muscle_mass_kg?: number | null
          measurements?: Record<string, any> | null
          progress_photos?: string[] | null
          measurement_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          health_activity_id?: string | null
          weight_kg?: number | null
          body_fat_percentage?: number | null
          muscle_mass_kg?: number | null
          measurements?: Record<string, any> | null
          progress_photos?: string[] | null
          measurement_date?: string
          created_at?: string
        }
      }
      ai_analysis_cache: {
        Row: {
          id: string
          content_hash: string
          analysis_type: string
          analysis_result: Record<string, any>
          confidence_score: number | null
          model_version: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          content_hash: string
          analysis_type: string
          analysis_result: Record<string, any>
          confidence_score?: number | null
          model_version?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          content_hash?: string
          analysis_type?: string
          analysis_result?: Record<string, any>
          confidence_score?: number | null
          model_version?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preference_key: string
          preference_value: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preference_key: string
          preference_value: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preference_key?: string
          preference_value?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type HealthActivity = Database['public']['Tables']['health_activities']['Row']
export type NutritionLog = Database['public']['Tables']['nutrition_logs']['Row']
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type BodyMeasurement = Database['public']['Tables']['body_measurements']['Row']
export type UserPreference = Database['public']['Tables']['user_preferences']['Row']

export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type InsertHealthActivity = Database['public']['Tables']['health_activities']['Insert']
export type InsertNutritionLog = Database['public']['Tables']['nutrition_logs']['Insert']
export type InsertWorkoutSession = Database['public']['Tables']['workout_sessions']['Insert']
export type InsertBodyMeasurement = Database['public']['Tables']['body_measurements']['Insert']

export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type UpdateHealthActivity = Database['public']['Tables']['health_activities']['Update'] 