"use client";

import { useState, useEffect } from "react";
import { Calendar, Home, Plus, BarChart3, User, TrendingUp, Target, Award } from "lucide-react";
import { Dock } from "@/components/ui/dock-two";
import { AnimatedRadialChart } from "@/components/ui/animated-radial-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dbService } from "@/lib/supabase/database";
import { createBrowserClient } from "@supabase/ssr";
import type { Database, HealthActivity } from "@/types/database";

const dockItems = [
  { icon: Home, label: "Dashboard", onClick: () => window.location.href = "/" },
  { icon: BarChart3, label: "Analytics", onClick: () => {} },
  { icon: Plus, label: "Add Activity", onClick: () => window.location.href = "/capture" },
  { icon: Calendar, label: "Plan", onClick: () => {} },
  { icon: User, label: "Profile", onClick: () => window.location.href = "/profile" },
];

export default function AnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<HealthActivity[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Check authentication
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.log('No user found');
          setLoading(false);
          return;
        }

        setUser(user);

        // Load recent activities for analytics
        const recentActivities = await dbService.getHealthActivities(user.id, 50);
        setActivities(recentActivities);

        // Load weekly stats
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const stats = await dbService.getWeeklyStats(user.id, weekStart.toISOString());
        setWeeklyStats(stats);

      } catch (err) {
        console.error('Analytics initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    initializeAnalytics();
  }, []);

  // Calculate progress data from real activities
  const calculateWeeklyProgress = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayString = date.toISOString().split('T')[0];
      
      const dayActivities = activities.filter(activity => 
        activity.activity_date.startsWith(dayString)
      );
      
      const dayCalories = dayActivities.reduce((sum, activity) => 
        sum + (activity.calories_estimated || 0), 0
      );

      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: dayCalories,
        goal: 2000, // This should come from user preferences
        activities: dayActivities.length
      });
    }

    return days;
  };

  // Calculate macro breakdown from nutrition activities
  const calculateMacros = () => {
    const nutritionActivities = activities.filter(activity => 
      activity.type === 'meal' && activity.ai_analysis?.nutritionalInfo?.macros
    );

    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalCals = 0;

    nutritionActivities.forEach(activity => {
      const macros = activity.ai_analysis?.nutritionalInfo?.macros;
      if (macros) {
        totalProtein += macros.protein || 0;
        totalCarbs += macros.carbs || 0;
        totalFat += macros.fat || 0;
      }
      totalCals += activity.calories_estimated || 0;
    });

    // Calculate percentages based on calories
    const proteinCals = totalProtein * 4;
    const carbsCals = totalCarbs * 4;
    const fatCals = totalFat * 9;
    const totalMacroCals = proteinCals + carbsCals + fatCals;

    return {
      protein: totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0,
      carbs: totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0,
      fat: totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0,
    };
  };

  // Calculate monthly stats
  const calculateMonthlyStats = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyActivities = activities.filter(activity => 
      new Date(activity.activity_date) >= thirtyDaysAgo
    );

    const avgCalories = monthlyActivities.length > 0 
      ? Math.round(monthlyActivities.reduce((sum, activity) => 
          sum + (activity.calories_estimated || 0), 0) / 30)
      : 0;

    const workoutsCompleted = monthlyActivities.filter(activity => 
      activity.type === 'workout'
    ).length;

    // Calculate streak (consecutive days with activities)
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      const dayString = checkDate.toISOString().split('T')[0];
      
      const hasActivity = activities.some(activity => 
        activity.activity_date.startsWith(dayString)
      );
      
      if (hasActivity) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      avgCalories,
      workoutsCompleted,
      streakDays,
      weightChange: 0, // This would need to come from body measurement activities
    };
  };

  const weeklyProgress = calculateWeeklyProgress();
  const macros = calculateMacros();
  const monthlyStats = calculateMonthlyStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
          <h1 className="text-2xl font-bold mb-4">Analytics</h1>
          <p className="text-gray-600 mb-4">Please sign in to view your analytics</p>
          <button 
            onClick={() => window.location.href = '/auth/login'} 
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
          <div>
            <h1 className="text-xl font-semibold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Your progress insights</p>
          </div>
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium">Avg Calories</span>
              </div>
              <p className="text-2xl font-bold">{monthlyStats.avgCalories}</p>
              <p className="text-xs text-muted-foreground">per day this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Workouts</span>
              </div>
              <p className="text-2xl font-bold">{monthlyStats.workoutsCompleted}</p>
              <p className="text-xs text-muted-foreground">completed this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Streak</span>
              </div>
              <p className="text-2xl font-bold">{monthlyStats.streakDays}</p>
              <p className="text-xs text-muted-foreground">days logging</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-xs text-muted-foreground">activities logged</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyProgress.map((day) => (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-8">{day.day}</span>
                  <div className="flex-1 bg-muted rounded-full h-3 relative overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        day.calories >= day.goal ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${Math.min((day.calories / day.goal) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground w-20 text-right">
                    <div>{day.calories} cal</div>
                    <div className="text-xs">{day.activities} items</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Goal: 2000 calories/day • Avg: {Math.round(weeklyProgress.reduce((sum, day) => sum + day.calories, 0) / weeklyProgress.length)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Macro Breakdown */}
        {(macros.protein > 0 || macros.carbs > 0 || macros.fat > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Macro Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium mb-3">Carbs</p>
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <AnimatedRadialChart
                      value={macros.carbs}
                      size={80}
                      strokeWidth={8}
                      showLabels={false}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{macros.carbs}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">45-65% target</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-purple-600 font-medium mb-3">Fat</p>
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <AnimatedRadialChart
                      value={macros.fat}
                      size={80}
                      strokeWidth={8}
                      showLabels={false}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{macros.fat}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">20-35% target</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-orange-600 font-medium mb-3">Protein</p>
                  <div className="relative w-20 h-20 mx-auto mb-3">
                    <AnimatedRadialChart
                      value={macros.protein}
                      size={80}
                      strokeWidth={8}
                      showLabels={false}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{macros.protein}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">10-35% target</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(weeklyStats?.typeBreakdown || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {type.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((count as number / activities.length) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Empty state */}
        {activities.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start logging activities to see your analytics here!
              </p>
              <Button onClick={() => window.location.href = '/capture'}>
                Log Your First Activity
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <Dock items={dockItems} />
      </div>
    </div>
  );
} 