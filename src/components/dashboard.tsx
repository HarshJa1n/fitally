"use client";

import { useState, useEffect } from "react";
import { Calendar, Home, Plus, BarChart3, User } from "lucide-react";
import { Dock } from "@/components/ui/dock-two";
import { ActivityCard } from "@/components/ui/activity-card";
import { Timeline } from "@/components/ui/timeline";
import { Card } from "@/components/ui/card";
import { dbService } from "@/lib/supabase/database";
import { createBrowserClient } from "@supabase/ssr";
import type { Database, HealthActivity, Profile } from "@/types/database";

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
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {trend && (
          <p className="text-xs text-green-600 font-medium">{trend}</p>
        )}
      </div>
    </Card>
  );
}

// AI Suggestion Component
function AISuggestion({ type, title, description, priority }: {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}) {
  const getIcon = () => {
    switch (type) {
      case 'workout': return '🏃‍♂️';
      case 'meal': return '🥗';
      case 'hydration': return '💧';
      case 'rest': return '😴';
      case 'supplement': return '💊';
      default: return '💡';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${getPriorityColor()}`}>
      <span className="text-lg">{getIcon()}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
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
          // Redirect to login page
          window.location.href = '/login';
          return;
        }

        setUser(user);

        // Load user profile
        const userProfile = await dbService.getUserProfile(user.id);
        
        // If no profile exists or user hasn't completed onboarding, redirect
        if (!userProfile || !userProfile.full_name) {
          window.location.href = '/onboarding';
          return;
        }
        
        setProfile(userProfile);

        // Load recent activities
        const recentActivities = await dbService.getHealthActivities(user.id, 10);
        setActivities(recentActivities);

        // Load daily stats
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

  // Compute activity metrics from real data
  const activityMetrics = [
    { 
      label: "Move", 
      value: dailyStats?.totalCalories?.toString() || "0", 
      trend: Math.round((dailyStats?.totalCalories || 0) / 20), // Rough percentage
      unit: "cal" as const 
    },
    { 
      label: "Exercise", 
      value: activities.filter(a => a.type === 'workout').length.toString(), 
      trend: 75, // TODO: Calculate based on goals
      unit: "min" as const 
    },
    { 
      label: "Stand", 
      value: dailyStats?.totalActivities?.toString() || "0", 
      trend: 80, // TODO: Calculate based on goals
      unit: "hrs" as const 
    },
  ];

  // Generate timeline data from activities
  const timelineData = activities.slice(0, 5).map(activity => ({
    title: new Date(activity.activity_date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }),
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
  }));

  const dailyGoals = [
    { id: "1", title: "Log 3 meals", isCompleted: activities.filter(a => a.type === 'meal').length >= 3 },
    { id: "2", title: "Record workout", isCompleted: activities.some(a => a.type === 'workout') },
    { id: "3", title: "Track hydration", isCompleted: activities.some(a => a.type === 'water_intake') },
  ];

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
          <p className="text-red-600 mb-4">Error: {error}</p>
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
          <h1 className="text-2xl font-bold mb-4">Welcome to Fitally</h1>
          <p className="text-gray-600 mb-4">Please sign in to view your dashboard</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Sign In
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">F</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-primary">fitally</h1>
              <p className="text-xs text-muted-foreground">
                Welcome, {profile?.full_name || user.email}
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-muted rounded-full">
            <span className="text-lg">🔔</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Today Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Today</h2>
          <button className="text-blue-500 text-sm font-medium">Edit</button>
        </div>

        {/* Activity Card - Using real data */}
        <ActivityCard
          category="Daily Activity"
          title="Today's Progress"
          metrics={activityMetrics}
          dailyGoals={dailyGoals}
          onAddGoal={() => console.log("Add goal")}
          onToggleGoal={(goalId) => console.log("Toggle goal:", goalId)}
          onViewDetails={() => console.log("View details")}
          className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"
        />

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <SimpleCard
            title="Calories Today"
            value={dailyStats?.totalCalories?.toString() || "0"}
            subtitle="Tracked activities"
            trend={`${activities.length} logged`}
          />
          <SimpleCard
            title="Activities"
            value={dailyStats?.totalActivities?.toString() || "0"}
            subtitle="Total logged today"
            trend={Object.keys(dailyStats?.typeBreakdown || {}).length > 0 ? 
              `${Object.keys(dailyStats.typeBreakdown).length} types` : "Start logging!"}
          />
        </div>

        {/* AI Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">💡 AI Recommendations</h3>
            <div className="space-y-3">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <AISuggestion
                  key={index}
                  type={suggestion.type}
                  title={suggestion.title}
                  description={suggestion.description}
                  priority={suggestion.priority}
                />
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline - Real data */}
        {timelineData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {timelineData.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 py-2 border-l-2 border-primary/20 pl-4">
                  <span className="text-xs text-muted-foreground font-medium min-w-[60px]">
                    {activity.title}
                  </span>
                  <div className="flex-1">
                    {activity.content}
                  </div>
                </div>
              ))}
            </div>
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
              className="h-20"
            />
            <SimpleCard
              title="Types Logged"
              value={Object.keys(dailyStats?.typeBreakdown || {}).length.toString()}
              subtitle="Activity variety"
              trend="Diversify more!"
              className="h-20"
            />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <Dock items={dockItems} />
      </div>
    </div>
  );
} 