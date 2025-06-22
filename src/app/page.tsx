"use client";

import { Calendar, Home, Plus, BarChart3, User } from "lucide-react";
import { Dock } from "@/components/ui/dock-two";
import { ActivityCard } from "@/components/ui/activity-card";
import { Timeline } from "@/components/ui/timeline";
import { Card } from "@/components/ui/card";

// Mock data for timeline
const timelineData = [
  {
    title: "8:30 AM",
    content: (
      <div className="flex items-center gap-3 py-2">
        <span className="text-2xl">🥣</span>
        <div>
          <h4 className="font-medium">Breakfast</h4>
          <p className="text-sm text-muted-foreground">Oatmeal with berries</p>
          <p className="text-xs text-orange-600 font-medium">350 cal</p>
        </div>
      </div>
    )
  },
  {
    title: "7:00 AM", 
    content: (
      <div className="flex items-center gap-3 py-2">
        <span className="text-2xl">🏃‍♀️</span>
        <div>
          <h4 className="font-medium">Morning Run</h4>
          <p className="text-sm text-muted-foreground">30 minutes in the park</p>
          <p className="text-xs text-orange-600 font-medium">300 cal</p>
        </div>
      </div>
    )
  },
  {
    title: "6:30 AM",
    content: (
      <div className="flex items-center gap-3 py-2">
        <span className="text-2xl">💧</span>
        <div>
          <h4 className="font-medium">Hydration</h4>
          <p className="text-sm text-muted-foreground">2 glasses of water</p>
        </div>
      </div>
    )
  }
];

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

export default function Dashboard() {
  const activityMetrics = [
    { label: "Move", value: "650", trend: 65, unit: "cal" as const },
    { label: "Exercise", value: "30", trend: 75, unit: "min" as const },
    { label: "Stand", value: "8", trend: 50, unit: "hrs" as const },
  ];

  const dailyGoals = [
    { id: "1", title: "Log 3 meals", isCompleted: false },
    { id: "2", title: "Drink 8 glasses of water", isCompleted: true },
    { id: "3", title: "Walk 10,000 steps", isCompleted: false },
  ];

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
              <p className="text-xs text-muted-foreground">PREMIUM ✨</p>
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

        {/* Activity Card - Using proper props */}
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
            value="1,650"
            subtitle="Goal: 1,990"
            trend="340 left"
          />
          <SimpleCard
            title="Steps"
            value="6,000"
            subtitle="Goal: 15,000"
            trend="9,000 left"
          />
        </div>

        {/* Macros Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Macros Breakdown</h3>
          <div className="grid grid-cols-3 gap-3">
            <SimpleCard
              title="Carbs"
              value="66g"
              subtitle="Goal: 250g"
              trend="184g left"
              className="h-20 text-center"
            />
            <SimpleCard
              title="Fat"
              value="51g"
              subtitle="Goal: 67g"
              trend="16g left"
              className="h-20 text-center"
            />
            <SimpleCard
              title="Protein"
              value="46g"
              subtitle="Goal: 100g"
              trend="54g left"
              className="h-20 text-center"
            />
          </div>
        </div>

        {/* Exercise & Activity */}
        <div className="grid grid-cols-1 gap-4">
          <SimpleCard
            title="Today's Exercise"
            value="30 min"
            subtitle="Morning run completed"
            trend="+300 cal burned"
            className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20"
          />
        </div>

        {/* Smart Suggestions from AI */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">💡 Smart Suggestions</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-lg">🥗</span>
              <div>
                <p className="text-sm font-medium">Try a protein-rich lunch</p>
                <p className="text-xs text-muted-foreground">You're 54g away from your protein goal</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-lg">🚶‍♂️</span>
              <div>
                <p className="text-sm font-medium">Evening walk recommended</p>
                <p className="text-xs text-muted-foreground">9,000 more steps to reach your daily goal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline - Simple version for now */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Today's Activities</h3>
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

        {/* Weekly Overview */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">This Week</h3>
          <div className="grid grid-cols-2 gap-4">
            <SimpleCard
              title="Weekly Average"
              value="1,750 cal"
              subtitle="Great consistency!"
              trend="+5% vs last week"
              className="h-20"
            />
            <SimpleCard
              title="Workout Days"
              value="4/7"
              subtitle="Almost there!"
              trend="1 more to go"
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
