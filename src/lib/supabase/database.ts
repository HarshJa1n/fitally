import { createBrowserClient } from '@supabase/ssr';
import type { Database, HealthActivity, InsertHealthActivity, Profile, InsertProfile } from '@/types/database';
import type { HealthActivity as AIHealthActivity } from '@/lib/ai/genkit-config';

export class DatabaseService {
  private supabase;

  constructor() {
    this.supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  async createOrUpdateProfile(profile: InsertProfile): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating profile:', error);
      return null;
    }

    return data;
  }

  // Health activity operations
  async createHealthActivity(
    activity: Omit<InsertHealthActivity, 'id'>,
    aiAnalysis?: AIHealthActivity
  ): Promise<HealthActivity | null> {
    const activityData: InsertHealthActivity = {
      ...activity,
      ai_analysis: aiAnalysis ? {
        activityType: aiAnalysis.activityType,
        subCategory: aiAnalysis.subCategory,
        duration: aiAnalysis.duration,
        intensity: aiAnalysis.intensity,
        calories: aiAnalysis.calories,
        insights: aiAnalysis.insights,
        nutritionalInfo: aiAnalysis.nutritionalInfo,
        confidence: aiAnalysis.confidence,
        tags: aiAnalysis.tags,
        notes: aiAnalysis.notes,
        timestamp: aiAnalysis.timestamp,
      } : null,
      calories_estimated: aiAnalysis?.calories?.estimated || null,
      confidence_score: aiAnalysis?.confidence || null,
    };

    const { data, error } = await this.supabase
      .from('health_activities')
      .insert(activityData)
      .select()
      .single();

    if (error) {
      console.error('Error creating health activity:', error);
      return null;
    }

    return data;
  }

  async getHealthActivities(
    userId: string,
    limit = 50,
    type?: string
  ): Promise<HealthActivity[]> {
    let query = this.supabase
      .from('health_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching health activities:', error);
      return [];
    }

    return data || [];
  }

  async getHealthActivitiesForPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HealthActivity[]> {
    const { data, error } = await this.supabase
      .from('health_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate)
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('Error fetching health activities for period:', error);
      return [];
    }

    return data || [];
  }

  async updateHealthActivity(
    id: string,
    updates: Partial<InsertHealthActivity>
  ): Promise<HealthActivity | null> {
    const { data, error } = await this.supabase
      .from('health_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating health activity:', error);
      return null;
    }

    return data;
  }

  async deleteHealthActivity(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('health_activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting health activity:', error);
      return false;
    }

    return true;
  }

  // Analytics and statistics
  async getDailyStats(userId: string, date: string) {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data, error } = await this.supabase
      .from('health_activities')
      .select('type, calories_estimated, ai_analysis')
      .eq('user_id', userId)
      .gte('activity_date', startOfDay)
      .lte('activity_date', endOfDay);

    if (error) {
      console.error('Error fetching daily stats:', error);
      return {
        totalCalories: 0,
        totalActivities: 0,
        typeBreakdown: {},
      };
    }

    const stats = {
      totalCalories: 0,
      totalActivities: data.length,
      typeBreakdown: {} as Record<string, number>,
    };

    data.forEach((activity) => {
      // Count calories
      if (activity.calories_estimated) {
        stats.totalCalories += activity.calories_estimated;
      }

      // Count activity types
      stats.typeBreakdown[activity.type] = (stats.typeBreakdown[activity.type] || 0) + 1;
    });

    return stats;
  }

  async getWeeklyStats(userId: string, startDate: string) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const { data, error } = await this.supabase
      .from('health_activities')
      .select('type, calories_estimated, activity_date, ai_analysis')
      .eq('user_id', userId)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate.toISOString())
      .order('activity_date', { ascending: true });

    if (error) {
      console.error('Error fetching weekly stats:', error);
      return {
        totalCalories: 0,
        totalActivities: 0,
        dailyBreakdown: {},
        typeBreakdown: {},
      };
    }

    const stats = {
      totalCalories: 0,
      totalActivities: data.length,
      dailyBreakdown: {} as Record<string, number>,
      typeBreakdown: {} as Record<string, number>,
    };

    data.forEach((activity) => {
      const day = activity.activity_date.split('T')[0];
      
      // Count calories
      if (activity.calories_estimated) {
        stats.totalCalories += activity.calories_estimated;
      }

      // Daily breakdown
      stats.dailyBreakdown[day] = (stats.dailyBreakdown[day] || 0) + 1;

      // Type breakdown
      stats.typeBreakdown[activity.type] = (stats.typeBreakdown[activity.type] || 0) + 1;
    });

    return stats;
  }

  // AI analysis cache operations
  async getCachedAnalysis(contentHash: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('ai_analysis_cache')
      .select('analysis_result')
      .eq('content_hash', contentHash)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data.analysis_result;
  }

  async cacheAnalysis(
    contentHash: string,
    analysisType: string,
    analysisResult: any,
    confidenceScore?: number,
    expirationHours = 24
  ): Promise<boolean> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const { error } = await this.supabase
      .from('ai_analysis_cache')
      .upsert({
        content_hash: contentHash,
        analysis_type: analysisType,
        analysis_result: analysisResult,
        confidence_score: confidenceScore,
        model_version: 'gemini-2.0-flash',
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'content_hash' });

    if (error) {
      console.error('Error caching analysis:', error);
      return false;
    }

    return true;
  }

  // User preferences
  async getUserPreference(userId: string, key: string): Promise<any | null> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .select('preference_value')
      .eq('user_id', userId)
      .eq('preference_key', key)
      .single();

    if (error || !data) {
      return null;
    }

    return data.preference_value;
  }

  async setUserPreference(
    userId: string,
    key: string,
    value: any
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preference_key: key,
        preference_value: value,
      }, { onConflict: 'user_id,preference_key' });

    if (error) {
      console.error('Error setting user preference:', error);
      return false;
    }

    return true;
  }

  // Utility functions
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  generateContentHash(content: string): string {
    // Simple hash function for content-based caching
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Helper to format AI analysis for database storage
  formatAIAnalysisForDB(aiAnalysis: AIHealthActivity): Record<string, any> {
    return {
      activityType: aiAnalysis.activityType,
      subCategory: aiAnalysis.subCategory,
      duration: aiAnalysis.duration,
      intensity: aiAnalysis.intensity,
      calories: aiAnalysis.calories,
      insights: aiAnalysis.insights,
      nutritionalInfo: aiAnalysis.nutritionalInfo,
      confidence: aiAnalysis.confidence,
      tags: aiAnalysis.tags,
      notes: aiAnalysis.notes,
      timestamp: aiAnalysis.timestamp,
      processed_at: new Date().toISOString(),
    };
  }

  // Helper to determine activity type from AI analysis
  determineActivityType(aiAnalysis: AIHealthActivity): 'meal' | 'workout' | 'body_measurement' | 'sleep' | 'water_intake' {
    const activityType = aiAnalysis.activityType.toLowerCase();

    if (['nutrition', 'meal', 'snack'].includes(activityType)) {
      return 'meal';
    } else if ([
      'cardio', 'strength_training', 'yoga', 'pilates', 
      'walking', 'running', 'cycling', 'swimming', 
      'sports', 'stretching'
    ].includes(activityType)) {
      return 'workout';
    } else if (activityType === 'sleep' || activityType === 'rest') {
      return 'sleep';
    } else if (activityType === 'hydration') {
      return 'water_intake';
    } else {
      return 'body_measurement'; // Default fallback
    }
  }
}

// Export singleton instances
export const dbService = new DatabaseService(); 