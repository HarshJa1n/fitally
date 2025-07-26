"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Target, 
  Activity, 
  Heart, 
  Scale, 
  Clock, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { dbService } from "@/lib/supabase/database";
import type { Database } from "@/types/database";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    fitness_level: "beginner",
    health_goals: [] as string[],
    dietary_preferences: [] as string[],
    medical_conditions: "",
    emergency_contact: "",
    privacy_settings: {
      share_progress: true,
      public_profile: false,
      data_analytics: true,
    }
  });

  const router = useRouter();
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Pre-fill some data if available
      if (user.user_metadata?.full_name) {
        setProfileData(prev => ({
          ...prev,
          full_name: user.user_metadata.full_name
        }));
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  const handleHealthGoalsChange = (goal: string) => {
    setProfileData(prev => ({
      ...prev,
      health_goals: prev.health_goals.includes(goal)
        ? prev.health_goals.filter(g => g !== goal)
        : [...prev.health_goals, goal]
    }));
  };

  const handleDietaryPreferencesChange = (pref: string) => {
    setProfileData(prev => ({
      ...prev,
      dietary_preferences: prev.dietary_preferences.includes(pref)
        ? prev.dietary_preferences.filter(p => p !== pref)
        : [...prev.dietary_preferences, pref]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return profileData.full_name.trim() !== '' && 
               profileData.age !== '' && 
               profileData.gender !== '';
      case 2:
        return profileData.height_cm !== '' && 
               profileData.weight_kg !== '' && 
               profileData.fitness_level !== '';
      case 3:
        return profileData.health_goals.length > 0;
      case 4:
        return true; // Optional step
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      setError(null);
    } else {
      setError('Please fill in all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Calculate date of birth from age
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(profileData.age);
      const dateOfBirth = `${birthYear}-01-01`; // Use January 1st as default

      // Create user profile with all collected data
      await dbService.createOrUpdateProfile({
        id: user.id,
        email: user.email || '',
        full_name: profileData.full_name,
        date_of_birth: dateOfBirth,
        height_cm: profileData.height_cm ? parseInt(profileData.height_cm) : null,
        weight_kg: profileData.weight_kg ? parseInt(profileData.weight_kg) : null,
        activity_level: profileData.fitness_level as any, // Use fitness_level as activity_level
        fitness_goals: profileData.health_goals.length > 0 ? profileData.health_goals : ['general_fitness'],
        dietary_preferences: profileData.dietary_preferences,
        onboarding_completed: true, // Mark onboarding as complete
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Redirect to dashboard
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const healthGoalOptions = [
    { id: 'weight_loss', label: 'Lose Weight', icon: '⚖️' },
    { id: 'weight_gain', label: 'Gain Weight', icon: '💪' },
    { id: 'muscle_building', label: 'Build Muscle', icon: '🏋️' },
    { id: 'cardiovascular_health', label: 'Improve Cardio', icon: '❤️' },
    { id: 'flexibility', label: 'Increase Flexibility', icon: '🤸' },
    { id: 'stress_management', label: 'Manage Stress', icon: '🧘' },
    { id: 'better_sleep', label: 'Better Sleep', icon: '😴' },
    { id: 'general_fitness', label: 'General Fitness', icon: '🏃' },
  ];

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
    { id: 'vegan', label: 'Vegan', icon: '🌱' },
    { id: 'keto', label: 'Ketogenic', icon: '🥑' },
    { id: 'paleo', label: 'Paleo', icon: '🥩' },
    { id: 'mediterranean', label: 'Mediterranean', icon: '🫒' },
    { id: 'low_carb', label: 'Low Carb', icon: '🥗' },
    { id: 'intermittent_fasting', label: 'Intermittent Fasting', icon: '⏰' },
    { id: 'no_restrictions', label: 'No Restrictions', icon: '🍽️' },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <User className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-gray-600">Let's start with some basic details about you</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                    placeholder="25"
                    min="13"
                    max="120"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    value={profileData.gender}
                    onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Scale className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="text-2xl font-bold">Physical Stats</h2>
              <p className="text-gray-600">Help us understand your current fitness level</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    value={profileData.height_cm}
                    onChange={(e) => setProfileData(prev => ({ ...prev, height_cm: e.target.value }))}
                    placeholder="170"
                    min="100"
                    max="250"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={profileData.weight_kg}
                    onChange={(e) => setProfileData(prev => ({ ...prev, weight_kg: e.target.value }))}
                    placeholder="70"
                    min="30"
                    max="300"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fitness_level">Current Fitness Level *</Label>
                <select
                  id="fitness_level"
                  value={profileData.fitness_level}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fitness_level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select fitness level</option>
                  <option value="sedentary">Sedentary - Little/no exercise</option>
                  <option value="lightly_active">Lightly Active - Light exercise 1-3 days/week</option>
                  <option value="moderately_active">Moderately Active - Moderate exercise 3-5 days/week</option>
                  <option value="very_active">Very Active - Hard exercise 6-7 days/week</option>
                  <option value="extra_active">Extra Active - Very hard exercise, physical job</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="text-2xl font-bold">Health Goals</h2>
              <p className="text-gray-600">What are you looking to achieve? (Select all that apply)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {healthGoalOptions.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleHealthGoalsChange(goal.id)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    profileData.health_goals.includes(goal.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center space-y-1">
                    <div className="text-2xl">{goal.icon}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="mx-auto h-12 w-12 text-blue-600" />
              <h2 className="text-2xl font-bold">Dietary & Health Info</h2>
              <p className="text-gray-600">Optional information to personalize your experience</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Dietary Preferences (Optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {dietaryOptions.map((pref) => (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => handleDietaryPreferencesChange(pref.id)}
                      className={`p-3 rounded-lg border text-sm transition-colors ${
                        profileData.dietary_preferences.includes(pref.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{pref.icon}</span>
                        <span>{pref.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="medical_conditions">Medical Conditions (Optional)</Label>
                <Textarea
                  id="medical_conditions"
                  value={profileData.medical_conditions}
                  onChange={(e) => setProfileData(prev => ({ ...prev, medical_conditions: e.target.value }))}
                  placeholder="Any medical conditions, allergies, or medications we should know about..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact">Emergency Contact (Optional)</Label>
                <Input
                  id="emergency_contact"
                  value={profileData.emergency_contact}
                  onChange={(e) => setProfileData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  placeholder="Name and phone number"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h2 className="text-2xl font-bold">Privacy Settings</h2>
              <p className="text-gray-600">Control how your data is used and shared</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Share Progress</h3>
                  <p className="text-sm text-gray-600">Allow others to see your fitness progress</p>
                </div>
                <Switch
                  checked={profileData.privacy_settings.share_progress}
                  onCheckedChange={(checked) => 
                    setProfileData(prev => ({
                      ...prev,
                      privacy_settings: { ...prev.privacy_settings, share_progress: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Public Profile</h3>
                  <p className="text-sm text-gray-600">Make your profile visible to other users</p>
                </div>
                <Switch
                  checked={profileData.privacy_settings.public_profile}
                  onCheckedChange={(checked) => 
                    setProfileData(prev => ({
                      ...prev,
                      privacy_settings: { ...prev.privacy_settings, public_profile: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Data Analytics</h3>
                  <p className="text-sm text-gray-600">Help improve our AI with anonymous data</p>
                </div>
                <Switch
                  checked={profileData.privacy_settings.data_analytics}
                  onCheckedChange={(checked) => 
                    setProfileData(prev => ({
                      ...prev,
                      privacy_settings: { ...prev.privacy_settings, data_analytics: checked }
                    }))
                  }
                />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">You're All Set! 🎉</h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Your profile is ready. Click "Complete Setup" to start your health journey with Fitally!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of 5</span>
            <span>{Math.round((currentStep / 5) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="flex items-center"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
} 