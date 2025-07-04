'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, MessageSquare, TestTube2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pushNotificationManager } from '@/lib/notifications/push-manager';
import { 
  MealReminderPreferences, 
  DEFAULT_MEAL_REMINDERS, 
  NotificationPermissionState 
} from '@/types/notifications';

interface MealReminderSettingsProps {
  className?: string;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' }
];

const REMINDER_INTERVALS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' }
];

export function MealReminderSettings({ className }: MealReminderSettingsProps) {
  const [preferences, setPreferences] = useState<MealReminderPreferences>(DEFAULT_MEAL_REMINDERS);
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    supported: false,
    permission: 'default',
    subscription: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    breakfast: true,
    lunch: false,
    dinner: false,
    snacks: false
  });
  const [testResults, setTestResults] = useState<{ success: boolean; message: string } | null>(null);

  // Load initial data
  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      await Promise.all([
        loadPreferences(),
        checkPermissionState()
      ]);
      setIsInitializing(false);
    };
    
    initialize();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const savedPreferences = await pushNotificationManager.getMealReminderPreferences();
      setPreferences(savedPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissionState = async () => {
    console.log('Component: Checking permission state...');
    const state = await pushNotificationManager.getPermissionState();
    console.log('Component: Got permission state:', state);
    setPermissionState(state);
    console.log('Component: State updated, supported:', state.supported);
  };

  const handlePermissionRequest = async () => {
    setIsLoading(true);
    try {
      const result = await pushNotificationManager.requestPermissionAndSubscribe();
      if (result.success) {
        await checkPermissionState();
        // Automatically save preferences after successful subscription
        await savePreferences();
      } else {
        setTestResults({
          success: false,
          message: result.error || 'Failed to enable notifications'
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setTestResults({
        success: false,
        message: 'Permission request failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const result = await pushNotificationManager.setupMealReminders(preferences);
      if (result.success) {
        setTestResults({
          success: true,
          message: 'Meal reminders updated successfully!'
        });
      } else {
        setTestResults({
          success: false,
          message: result.error || 'Failed to save preferences'
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setTestResults({
        success: false,
        message: 'Failed to save preferences'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      const result = await pushNotificationManager.sendTestNotification();
      setTestResults({
        success: result.success,
        message: result.success 
          ? 'Test notification sent! Check your device.'
          : result.error || 'Failed to send test notification'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestResults({
        success: false,
        message: 'Test notification failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateMealPreference = (mealType: keyof MealReminderPreferences, field: string, value: any) => {
    if (mealType === 'timezone' || mealType === 'reminderMinutes' || mealType === 'weekdays') {
      setPreferences(prev => ({
        ...prev,
        [mealType]: value
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [mealType]: {
          ...prev[mealType],
          [field]: value
        }
      }));
    }
  };

  const updateWeekday = (dayIndex: number, enabled: boolean) => {
    const newWeekdays = [...preferences.weekdays];
    newWeekdays[dayIndex] = enabled;
    setPreferences(prev => ({
      ...prev,
      weekdays: newWeekdays
    }));
  };

  const updateSnackTime = (index: number, time: string) => {
    const newTimes = [...(preferences.snacks.times || [])];
    newTimes[index] = time;
    updateMealPreference('snacks', 'times', newTimes);
  };

  const addSnackTime = () => {
    const currentTimes = preferences.snacks.times || [];
    updateMealPreference('snacks', 'times', [...currentTimes, '15:00']);
  };

  const removeSnackTime = (index: number) => {
    const newTimes = (preferences.snacks.times || []).filter((_, i) => i !== index);
    updateMealPreference('snacks', 'times', newTimes);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Clear test results after 5 seconds
  useEffect(() => {
    if (testResults) {
      const timer = setTimeout(() => {
        setTestResults(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [testResults]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Meal Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Checking notification support...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show not supported message only after checking
  console.log('Component render: isInitializing:', isInitializing, 'supported:', permissionState.supported, 'permission:', permissionState.permission);
  
  if (!permissionState.supported) {
    console.log('Component: Rendering not supported message');
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Meal Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Push notifications are not supported in this browser. 
              Try using Chrome, Firefox, Safari, or Edge for the best experience.
            </p>
            {permissionState.error && (
              <p className="text-sm text-red-600 mt-2">
                Error: {permissionState.error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('Component: Rendering main settings UI');
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Meal Reminders
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Set up smart notifications to remind you about meals throughout the day
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Permission Status */}
        {permissionState.permission !== 'granted' && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Allow notifications to receive meal reminders
                </p>
              </div>
              <Button 
                onClick={handlePermissionRequest}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </Button>
            </div>
          </div>
        )}

        {/* Subscription Status - when permission is granted but no subscription */}
        {permissionState.permission === 'granted' && !permissionState.subscription && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Set up Push Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Complete setup to receive meal reminder notifications
                </p>
              </div>
              <Button 
                onClick={handlePermissionRequest}
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? 'Setting up...' : 'Set up'}
              </Button>
            </div>
          </div>
        )}

        {/* Active Status - when fully set up */}
        {permissionState.permission === 'granted' && permissionState.subscription && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">✅ Notifications Active</h4>
                <p className="text-sm text-muted-foreground">
                  Meal reminders are ready! Test or save your settings below.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={sendTestNotification}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? 'Testing...' : 'Test'}
                </Button>
                <Button 
                  onClick={savePreferences}
                  disabled={isSaving}
                  size="sm"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <div className={`rounded-lg border p-4 ${
            testResults.success 
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          }`}>
            <p className={`text-sm font-medium ${
              testResults.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {testResults.message}
            </p>
          </div>
        )}

        {/* Global Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">General Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-interval">Reminder Timing</Label>
              <Select 
                value={preferences.reminderMinutes.toString()}
                onValueChange={(value) => setPreferences(prev => ({ 
                  ...prev, 
                  reminderMinutes: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_INTERVALS.map(interval => (
                    <SelectItem key={interval.value} value={interval.value.toString()}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={preferences.timezone}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  timezone: e.target.value 
                }))}
                placeholder="America/New_York"
              />
            </div>
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label>Active Days</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS_OF_WEEK.map((day, index) => (
                <button
                  key={day.key}
                  onClick={() => updateWeekday(index, !preferences.weekdays[index])}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    preferences.weekdays[index]
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meal-Specific Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Meal Settings</h3>

          {/* Breakfast */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between w-full">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleSection('breakfast')}
              >
                <span className="text-2xl">🌅</span>
                <div className="text-left">
                  <h4 className="font-medium">Breakfast</h4>
                  <p className="text-sm text-muted-foreground">
                    {preferences.breakfast.enabled ? `${preferences.breakfast.time}` : 'Disabled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={preferences.breakfast.enabled}
                  onCheckedChange={(checked) => updateMealPreference('breakfast', 'enabled', checked)}
                />
                <button
                  onClick={() => toggleSection('breakfast')}
                  className="p-1 hover:bg-muted rounded-sm"
                >
                  {expandedSections.breakfast ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expandedSections.breakfast && preferences.breakfast.enabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breakfast-time">Time</Label>
                    <Input
                      id="breakfast-time"
                      type="time"
                      value={preferences.breakfast.time}
                      onChange={(e) => updateMealPreference('breakfast', 'time', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakfast-message">Custom Message</Label>
                  <Textarea
                    id="breakfast-message"
                    value={preferences.breakfast.message}
                    onChange={(e) => updateMealPreference('breakfast', 'message', e.target.value)}
                    placeholder="Good morning! Time for a healthy breakfast..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lunch */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between w-full">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleSection('lunch')}
              >
                <span className="text-2xl">🥗</span>
                <div className="text-left">
                  <h4 className="font-medium">Lunch</h4>
                  <p className="text-sm text-muted-foreground">
                    {preferences.lunch.enabled ? `${preferences.lunch.time}` : 'Disabled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={preferences.lunch.enabled}
                  onCheckedChange={(checked) => updateMealPreference('lunch', 'enabled', checked)}
                />
                <button
                  onClick={() => toggleSection('lunch')}
                  className="p-1 hover:bg-muted rounded-sm"
                >
                  {expandedSections.lunch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expandedSections.lunch && preferences.lunch.enabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lunch-time">Time</Label>
                    <Input
                      id="lunch-time"
                      type="time"
                      value={preferences.lunch.time}
                      onChange={(e) => updateMealPreference('lunch', 'time', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lunch-message">Custom Message</Label>
                  <Textarea
                    id="lunch-message"
                    value={preferences.lunch.message}
                    onChange={(e) => updateMealPreference('lunch', 'message', e.target.value)}
                    placeholder="Lunch time! Don't forget to log your meal..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dinner */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between w-full">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleSection('dinner')}
              >
                <span className="text-2xl">🍽️</span>
                <div className="text-left">
                  <h4 className="font-medium">Dinner</h4>
                  <p className="text-sm text-muted-foreground">
                    {preferences.dinner.enabled ? `${preferences.dinner.time}` : 'Disabled'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={preferences.dinner.enabled}
                  onCheckedChange={(checked) => updateMealPreference('dinner', 'enabled', checked)}
                />
                <button
                  onClick={() => toggleSection('dinner')}
                  className="p-1 hover:bg-muted rounded-sm"
                >
                  {expandedSections.dinner ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expandedSections.dinner && preferences.dinner.enabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dinner-time">Time</Label>
                    <Input
                      id="dinner-time"
                      type="time"
                      value={preferences.dinner.time}
                      onChange={(e) => updateMealPreference('dinner', 'time', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dinner-message">Custom Message</Label>
                  <Textarea
                    id="dinner-message"
                    value={preferences.dinner.message}
                    onChange={(e) => updateMealPreference('dinner', 'message', e.target.value)}
                    placeholder="Dinner time! Cap off your day with a balanced meal..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Snacks */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between w-full">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleSection('snacks')}
              >
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <h4 className="font-medium">Snacks</h4>
                  <p className="text-sm text-muted-foreground">
                    {preferences.snacks.enabled 
                      ? `${(preferences.snacks.times || []).length} times set` 
                      : 'Disabled'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={preferences.snacks.enabled}
                  onCheckedChange={(checked) => updateMealPreference('snacks', 'enabled', checked)}
                />
                <button
                  onClick={() => toggleSection('snacks')}
                  className="p-1 hover:bg-muted rounded-sm"
                >
                  {expandedSections.snacks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expandedSections.snacks && preferences.snacks.enabled && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Snack Times</Label>
                  <div className="space-y-2">
                    {(preferences.snacks.times || []).map((time, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => updateSnackTime(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSnackTime(index)}
                          disabled={(preferences.snacks.times || []).length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSnackTime}
                      disabled={(preferences.snacks.times || []).length >= 5}
                    >
                      Add Snack Time
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snacks-message">Custom Message</Label>
                  <Textarea
                    id="snacks-message"
                    value={preferences.snacks.message}
                    onChange={(e) => updateMealPreference('snacks', 'message', e.target.value)}
                    placeholder="Snack time! How about something healthy?"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {permissionState.permission === 'granted' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={savePreferences}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            <Button 
              variant="outline"
              onClick={sendTestNotification}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <TestTube2 className="w-4 h-4" />
              {isLoading ? 'Sending...' : 'Test'}
            </Button>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>• Reminders will only be sent on selected days</p>
          <p>• Custom messages support emojis for better engagement</p>
          <p>• Test notifications help verify your setup is working</p>
          <p>• Notifications work even when the app is closed</p>
        </div>
      </CardContent>
    </Card>
  );
} 