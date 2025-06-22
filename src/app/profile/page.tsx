"use client";

import { useState } from "react";
import { ArrowLeft, User, Target, Settings, Bell, Shield, Info, ChevronRight, Edit3, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dock } from "@/components/ui/dock-two";
import { Calendar, Home, Plus, BarChart3 } from "lucide-react";

const dockItems = [
  { icon: Home, label: "Dashboard", onClick: () => window.location.href = "/" },
  { icon: BarChart3, label: "Analytics", onClick: () => window.location.href = "/analytics" },
  { icon: Plus, label: "Add Activity", onClick: () => window.location.href = "/capture" },
  { icon: Calendar, label: "Plan", onClick: () => {} },
  { icon: User, label: "Profile", onClick: () => {} },
];

interface UserProfile {
  name: string;
  email: string;
  age: string;
  height: string;
  weight: string;
  activityLevel: string;
  fitnessGoals: string[];
  bio: string;
}

interface UserGoals {
  dailyCalories: string;
  dailySteps: string;
  dailyWater: string;
  weeklyWorkouts: string;
  targetWeight: string;
}

interface NotificationSettings {
  mealReminders: boolean;
  workoutReminders: boolean;
  hydrationReminders: boolean;
  weeklyReports: boolean;
  achievementAlerts: boolean;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Johnson",
    email: "alex@example.com",
    age: "28",
    height: "5'8\"",
    weight: "150 lbs",
    activityLevel: "moderate",
    fitnessGoals: ["weight-loss", "muscle-gain"],
    bio: "Fitness enthusiast looking to maintain a healthy lifestyle with the help of AI tracking."
  });

  const [goals, setGoals] = useState<UserGoals>({
    dailyCalories: "1990",
    dailySteps: "10000",
    dailyWater: "8",
    weeklyWorkouts: "4",
    targetWeight: "145"
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    mealReminders: true,
    workoutReminders: true,
    hydrationReminders: false,
    weeklyReports: true,
    achievementAlerts: true
  });

  const handleSave = () => {
    // TODO: Save to backend/Supabase
    setIsEditing(false);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {profile.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.age} years • {profile.height} • {profile.weight}
              </p>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {isEditing ? "Save" : "Edit"}
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={profile.age}
                    onChange={(e) => setProfile({...profile, age: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={profile.height}
                    onChange={(e) => setProfile({...profile, height: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={profile.weight}
                    onChange={(e) => setProfile({...profile, weight: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="activity-level">Activity Level</Label>
                <Select value={profile.activityLevel} onValueChange={(value) => setProfile({...profile, activityLevel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                    <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (very hard exercise, physical job)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell us about your fitness journey..."
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Activity Level</h3>
                <p className="text-sm text-muted-foreground capitalize">{profile.activityLevel.replace('-', ' ')}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Fitness Goals</h3>
                <div className="flex gap-2 flex-wrap">
                  {profile.fitnessGoals.map((goal) => (
                    <span key={goal} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                      {goal.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-sm text-muted-foreground">{profile.bio}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">127</div>
            <div className="text-sm text-muted-foreground">Days Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">89%</div>
            <div className="text-sm text-muted-foreground">Goal Achievement</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Daily Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="daily-calories">Daily Calories Target</Label>
            <Input
              id="daily-calories"
              value={goals.dailyCalories}
              onChange={(e) => setGoals({...goals, dailyCalories: e.target.value})}
              placeholder="1990"
            />
          </div>
          <div>
            <Label htmlFor="daily-steps">Daily Steps Target</Label>
            <Input
              id="daily-steps"
              value={goals.dailySteps}
              onChange={(e) => setGoals({...goals, dailySteps: e.target.value})}
              placeholder="10000"
            />
          </div>
          <div>
            <Label htmlFor="daily-water">Daily Water Glasses</Label>
            <Input
              id="daily-water"
              value={goals.dailyWater}
              onChange={(e) => setGoals({...goals, dailyWater: e.target.value})}
              placeholder="8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly & Long-term Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="weekly-workouts">Weekly Workouts</Label>
            <Input
              id="weekly-workouts"
              value={goals.weeklyWorkouts}
              onChange={(e) => setGoals({...goals, weeklyWorkouts: e.target.value})}
              placeholder="4"
            />
          </div>
          <div>
            <Label htmlFor="target-weight">Target Weight</Label>
            <Input
              id="target-weight"
              value={goals.targetWeight}
              onChange={(e) => setGoals({...goals, targetWeight: e.target.value})}
              placeholder="145 lbs"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Save Goals
      </Button>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="meal-reminders">Meal Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded to log your meals</p>
            </div>
            <Switch
              id="meal-reminders"
              checked={notifications.mealReminders}
              onCheckedChange={(checked) => setNotifications({...notifications, mealReminders: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="workout-reminders">Workout Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded about your workout schedule</p>
            </div>
            <Switch
              id="workout-reminders"
              checked={notifications.workoutReminders}
              onCheckedChange={(checked) => setNotifications({...notifications, workoutReminders: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="hydration-reminders">Hydration Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminded to drink water</p>
            </div>
            <Switch
              id="hydration-reminders"
              checked={notifications.hydrationReminders}
              onCheckedChange={(checked) => setNotifications({...notifications, hydrationReminders: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly progress summaries</p>
            </div>
            <Switch
              id="weekly-reports"
              checked={notifications.weeklyReports}
              onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when you reach milestones</p>
            </div>
            <Switch
              id="achievement-alerts"
              checked={notifications.achievementAlerts}
              onCheckedChange={(checked) => setNotifications({...notifications, achievementAlerts: checked})}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy & Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-between">
            Export My Data
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Delete Account
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-muted-foreground">1.0.0</span>
          </div>
          <Button variant="outline" className="w-full justify-between">
            Terms of Service
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between">
            Privacy Policy
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4 mx-auto mb-1" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'goals'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="w-4 h-4 mx-auto mb-1" />
            Goals
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-4 h-4 mx-auto mb-1" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <Dock items={dockItems} />
      </div>
    </div>
  );
} 