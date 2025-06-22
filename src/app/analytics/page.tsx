"use client";

import { Calendar, Home, Plus, BarChart3, User, TrendingUp, Target, Award } from "lucide-react";
import { Dock } from "@/components/ui/dock-two";
import { AnimatedRadialChart } from "@/components/ui/animated-radial-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const dockItems = [
  { icon: Home, label: "Dashboard", onClick: () => window.location.href = "/" },
  { icon: BarChart3, label: "Analytics", onClick: () => {} },
  { icon: Plus, label: "Add Activity", onClick: () => window.location.href = "/capture" },
  { icon: Calendar, label: "Plan", onClick: () => {} },
  { icon: User, label: "Profile", onClick: () => window.location.href = "/profile" },
];

// Mock data for analytics
const weeklyProgress = [
  { day: "Mon", calories: 1800, goal: 2000 },
  { day: "Tue", calories: 2100, goal: 2000 },
  { day: "Wed", calories: 1950, goal: 2000 },
  { day: "Thu", calories: 2200, goal: 2000 },
  { day: "Fri", calories: 1850, goal: 2000 },
  { day: "Sat", calories: 2400, goal: 2000 },
  { day: "Sun", calories: 1950, goal: 2000 },
];

const monthlyStats = {
  avgCalories: 2050,
  workoutsCompleted: 18,
  weightChange: -2.3,
  streakDays: 12
};

export default function AnalyticsPage() {
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
                <span className="text-lg">⚖️</span>
                <span className="text-sm font-medium">Weight</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{monthlyStats.weightChange}kg</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Calorie Intake</CardTitle>
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
                  <span className="text-sm text-muted-foreground w-16 text-right">
                    {day.calories}
                  </span>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week's Macros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium mb-3">Carbs</p>
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <AnimatedRadialChart
                    value={68}
                    size={80}
                    strokeWidth={8}
                    showLabels={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">68%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">45-65% target</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-purple-600 font-medium mb-3">Fat</p>
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <AnimatedRadialChart
                    value={25}
                    size={80}
                    strokeWidth={8}
                    showLabels={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">25%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">20-35% target</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-orange-600 font-medium mb-3">Protein</p>
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <AnimatedRadialChart
                    value={15}
                    size={80}
                    strokeWidth={8}
                    showLabels={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">15%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">10-35% target</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Goals & Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-medium">7-Day Logging Streak</p>
                    <p className="text-sm text-muted-foreground">Keep up the consistency!</p>
                  </div>
                </div>
                <span className="text-lg">🏆</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">8</span>
                  </div>
                  <div>
                    <p className="font-medium">Weekly Exercise Goal</p>
                    <p className="text-sm text-muted-foreground">8/10 workouts completed</p>
                  </div>
                </div>
                <div className="w-16 bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '80%'}}></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">💧</span>
                  </div>
                  <div>
                    <p className="font-medium">Hydration Master</p>
                    <p className="text-sm text-muted-foreground">Hit water goal 5 days in a row</p>
                  </div>
                </div>
                <span className="text-lg">🥇</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trends & Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-medium text-blue-900">Meal Timing Pattern</p>
                  <p className="text-sm text-blue-700">
                    You tend to eat 60% of your calories before 2 PM. This aligns well with optimal metabolism timing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-lg">📈</span>
                <div>
                  <p className="font-medium text-green-900">Protein Progress</p>
                  <p className="text-sm text-green-700">
                    Your protein intake increased by 15% this week. Great work on building muscle!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="font-medium text-orange-900">Weekly Recommendation</p>
                  <p className="text-sm text-orange-700">
                    Try adding 1 more strength training session to maximize your current nutrition plan.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Dock Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50">
        <div className="max-w-md mx-auto">
          <Dock items={dockItems} className="h-20 p-2" />
        </div>
      </div>
    </div>
  );
} 