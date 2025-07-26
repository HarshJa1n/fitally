"use client";

import { useState, useEffect } from "react";
import { Calendar, Home, Plus, BarChart3, User } from "lucide-react";
import { Dock } from "@/components/ui/dock-two";
import { ActivityCard } from "@/components/ui/activity-card";
import { Timeline } from "@/components/ui/timeline";
import { Card } from "@/components/ui/card";
import { CalorieMeter } from "@/components/ui/calorie-meter";
import { dbService } from "@/lib/supabase/database";
import { createBrowserClient } from "@supabase/ssr";
import type { Database, HealthActivity, Profile } from "@/types/database";
import { HealthDataProcessor } from "@/lib/processors/health-data-processor";

const dockItems = [
  { icon: Home, label: "Dashboard", onClick: () => {} },
  { icon: BarChart3, label: "Analytics", onClick: () => window.location.href = "/analytics" },
  { icon: Plus, label: "Add Activity", onClick: () => window.location.href = "/capture" },
  { icon: Calendar, label: "Plan", onClick: () => {} },
  { icon: User, label: "Profile", onClick: () => window.location.href = "/profile" },
];

// Simple Card Component
function SimpleCard({ title, value, subtitle, trend, className }: {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {trend && (
          <p className="text-xs text-green-600 font-medium mt-2">{trend}</p>
        )}
      </div>
    </Card>
  );
}



// Helper function for time-based greeting
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good Morning";
  } else if (hour < 17) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<HealthActivity[]>([]);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check authentication
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.log('No user found, redirect to login');
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Load user profile
        const userProfile = await dbService.getUserProfile(user.id);
        if (userProfile) {
          setProfile(userProfile);
        }

        // Load recent activities
        const recentActivities = await dbService.getHealthActivities(user.id, 20);
        setActivities(recentActivities);

        // Get today's date for daily stats
        const today = new Date().toISOString().split('T')[0];
        const stats = await dbService.getDailyStats(user.id, today);
        setDailyStats(stats);

        // Load AI suggestions
        try {
          const suggestionsResponse = await fetch('/api/ai/suggestions');
          if (suggestionsResponse.ok) {
            const suggestionsData = await suggestionsResponse.json();
            setSuggestions(suggestionsData.data?.suggestions || []);
          }
        } catch (suggestError) {
          console.error('Failed to load suggestions:', suggestError);
        }

      } catch (err) {
        console.error('Dashboard initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Generate AI insights when data is ready
  useEffect(() => {
    const generateInsights = async () => {
      if (activities.length > 0 && profile) {
        try {
          const processor = new HealthDataProcessor(profile, activities);
          const todayData = processor.processToday();
          
          // Try AI insights first
          try {
            const response = await fetch('/api/ai/insights', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                processedData: todayData,
                profile: profile 
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data?.insights) {
                setInsights(result.data.insights.map((insight: any) => insight.message));
                return;
              }
            }
          } catch (aiError) {
            console.warn('AI insights failed, using fallback:', aiError);
          }

          // Fallback to static insights
          const staticInsights = processor.generateInsights(todayData);
          setInsights(staticInsights);
          
        } catch (error) {
          console.error('Failed to generate any insights:', error);
          setInsights([
            "Keep up the great work with your health tracking!",
            "Every small step towards your goals counts."
          ]);
        }
      }
    };

    generateInsights();
  }, [activities, profile]);

  // Filter today's activities
  const today = new Date().toISOString().split('T')[0];
  const todaysActivities = activities.filter(activity => 
    activity.activity_date.startsWith(today)
  );

  // Process today's health data using HealthDataProcessor
  const processor = new HealthDataProcessor(profile, activities);
  const todayData = processor.processToday();
  
  // Calculate new metrics using processed data
  const calculateNewMetrics = () => {
    const { metrics } = todayData;

    // Safety check for calories data
    if (!metrics?.calories) {
      return [
        { label: "Calorie Intake", value: "0/0", trend: 0, unit: "cal" as const },
        { label: "Protein", value: "0/60", trend: 0, unit: "g" as const },
        { label: "Steps", value: "0", trend: 0, unit: "steps" as const },
        { label: "Exercise", value: "0", trend: 0, unit: "min" as const }
      ];
    }

    return [
      { 
        label: "Calorie Intake", 
        value: `${metrics.calories.foodCaloriesConsumed || 0}/${metrics.calories.budget || 0}`, 
        trend: Math.round(((metrics.calories.foodCaloriesConsumed || 0) / (metrics.calories.budget || 1)) * 100),
        unit: "cal" as const 
      },
      { 
        label: "Protein", 
        value: `${metrics.protein.consumed}/${metrics.protein.goal}`, 
        trend: Math.round((metrics.protein.percentage || 0) * 100) / 100, 
        unit: "g" as const 
      },
      { 
        label: "Steps", 
        value: metrics.steps.count > 0 ? metrics.steps.count.toString() : "0", 
        trend: Math.round((metrics.steps.percentage || 0) * 100) / 100, 
        unit: "steps" as const 
      },
      { 
        label: "Exercise", 
        value: metrics.exercise.duration.toString(), 
        trend: Math.round((metrics.exercise.percentage || 0) * 100) / 100, 
        unit: "min" as const 
      },
    ];
  };

  const activityMetrics = calculateNewMetrics();

  // Generate timeline data from activities with date info
  const timelineData = activities.slice(0, 5).map(activity => {
    const activityDate = new Date(activity.activity_date);
    const isToday = activityDate.toDateString() === new Date().toDateString();
    const isYesterday = activityDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
    
    let dayLabel = '';
    if (isToday) {
      dayLabel = 'Today';
    } else if (isYesterday) {
      dayLabel = 'Yesterday';  
    } else {
      dayLabel = activityDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    const timeLabel = activityDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    return {
      title: `${dayLabel} ${timeLabel}`,
      content: (
        <div className="flex items-center gap-3 py-2">
          <span className="text-2xl">
            {activity.type === 'meal' ? '🍽️' : 
             activity.type === 'workout' ? '🏃‍♀️' : 
             activity.type === 'water_intake' ? '💧' : '📝'}
          </span>
          <div>
            <h4 className="font-medium">{activity.title}</h4>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            {activity.calories_estimated && (
              <p className="text-xs text-orange-600 font-medium">{activity.calories_estimated} cal</p>
            )}
          </div>
        </div>
      )
    };
  });

  // Use processed data for daily goals - Focus on app engagement
  const dailyGoals = [
    { id: "1", title: "Log 3 meals", isCompleted: todayData.goals.mealsLogged },
  ];

  // State for AI insights
  const [insights, setInsights] = useState<string[]>([]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view your dashboard</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-semibold">{getTimeBasedGreeting()}</h1>
            <p className="text-sm text-muted-foreground">Your health progress today</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">

        {/* Activity Card - Using new metrics */}
        <ActivityCard
          category="Daily Progress"
          title="Health Metrics"
          metrics={activityMetrics}
          dailyGoals={dailyGoals}
          onAddGoal={() => console.log("Add goal")}
          onToggleGoal={(goalId) => console.log("Toggle goal:", goalId)}
          onViewDetails={() => console.log("View details")}
          className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"
        />

        {/* Quick Stats Grid */}
        {/* Calorie Meter */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <CalorieMeter
            netBalance={todayData.metrics.calories?.netBalance || 0}
            goal={todayData.metrics.calories?.goal || 0}
            budget={todayData.metrics.calories?.budget || 0}
            foodCalories={todayData.metrics.calories?.foodCaloriesConsumed || 0}
            workoutCalories={todayData.metrics.calories?.workoutCaloriesBurned || 0}
            bmr={todayData.metrics.calories?.bmr || 0}
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => window.location.href = '/capture?type=meal'}
            className="flex-1 max-w-[120px] h-12 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            title="Add Food"
          >
            <span className="text-2xl">🍽️</span>
            <span className="text-xl ml-1">+</span>
          </button>
          <button
            onClick={() => window.location.href = '/capture?type=workout'}
            className="flex-1 max-w-[120px] h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
            title="Add Workout"
          >
            <span className="text-2xl">🏃‍♀️</span>
            <span className="text-xl ml-1">+</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <SimpleCard
            title="BMR Today"
            value={(todayData.metrics.calories?.bmr || 0).toString()}
            subtitle="Base metabolic rate"
            trend={`Budget: ${todayData.metrics.calories?.budget || 0} cal`}
          />
          <SimpleCard
            title="Protein Sources"
            value={(todayData.metrics.protein?.sources?.length || 0).toString()}
            subtitle="Variety tracked"
            trend={(todayData.metrics.protein?.sources?.length || 0) > 0 ? 
              (todayData.metrics.protein?.sources?.slice(0, 2).join(', ') || 'None') : 'No sources yet'}
          />
        </div>

        {/* AI Smart Insights */}
        {(insights.length > 0 || suggestions.length > 0) && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
            <div className="space-y-3">
              {/* Show generated insights first */}
              {insights.slice(0, 2).map((insight, index) => (
                <div key={`insight-${index}`} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-sm font-medium">Health Insight</p>
                    <p className="text-xs text-muted-foreground">{insight}</p>
                  </div>
                </div>
              ))}
              {/* Show AI suggestions if available */}
              {suggestions.slice(0, Math.max(0, 3 - insights.length)).map((suggestion, index) => (
                <div key={`suggestion-${index}`} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="text-lg">💡</span>
                  <div>
                    <p className="text-sm font-medium">{suggestion.title || 'AI Suggestion'}</p>
                    <p className="text-xs text-muted-foreground">{suggestion.description || suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Timeline */}
        {timelineData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <Timeline data={timelineData} />
          </div>
        )}

        {/* Empty state if no activities */}
        {activities.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Start Your Journey</h3>
            <p className="text-muted-foreground mb-4">
              No activities logged yet. Tap the + button to capture your first health activity!
            </p>
            <button 
              onClick={() => window.location.href = '/capture'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Log Activity
            </button>
          </div>
        )}

        {/* Weekly Overview - Based on real data */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">This Week</h3>
          <div className="grid grid-cols-2 gap-4">
            <SimpleCard
              title="Total Activities"
              value={activities.length.toString()}
              subtitle="This session"
              trend="Keep it up!"
              className="min-h-[100px] flex flex-col justify-between"
            />
            <SimpleCard
              title="Types Logged"
              value={Object.keys(dailyStats?.typeBreakdown || {}).length.toString()}
              subtitle="Activity variety"
              trend="Diversify more!"
              className="min-h-[100px] flex flex-col justify-between"
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <Dock items={dockItems} />
      </div>
    </div>
  );
} 