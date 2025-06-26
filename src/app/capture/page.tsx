"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Mic, Type, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import CameraComponent from "@/components/ui/camera/camera";
import { CameraProvider } from "@/components/ui/camera/camera-provider";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dbService } from "@/lib/supabase/database";
import { createBrowserClient } from "@supabase/ssr";

type InputMode = "camera" | "voice" | "text" | "image";

interface CapturedData {
  type: InputMode;
  data: string | File | null;
  timestamp: Date;
  additionalContext?: string;
}

// Import the types from genkit config
import { type HealthActivity, type FoodItem, type ExerciseSet } from "@/lib/ai/genkit-config";
import { EditableFoodList, EditableExerciseList } from "@/components/ui/editable-activity-list";

interface AIAnalysisResult extends HealthActivity {}

export default function CapturePage() {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<InputMode | null>(null);
  const [capturedData, setCapturedData] = useState<CapturedData | null>(null);
  const [textInput, setTextInput] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
    };
    checkAuth();
  }, [router]);

  const handleCameraCapture = (images: string[]) => {
    if (images.length > 0) {
      setCapturedData({
        type: "camera",
        data: images[0],
        timestamp: new Date()
      });
    }
  };

  const handleVoiceStart = () => {
    setVoiceRecording(true);
  };

  const handleVoiceStop = (duration: number) => {
    setVoiceRecording(false);
    if (duration > 0) {
      setCapturedData({
        type: "voice", 
        data: `Voice recording (${duration}s)`,
        timestamp: new Date()
      });
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      setCapturedData({
        type: "text",
        data: textInput,
        timestamp: new Date()
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCapturedData({
        type: "image",
        data: file,
        timestamp: new Date()
      });
    }
  };

  const processWithAI = async () => {
    if (!capturedData || !user) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Prepare data for AI analysis
      let analysisPayload: any = {
        type: 'full',
        input: {
          context: {
            userId: user.id,
            timestamp: capturedData.timestamp.toISOString(),
            userGoals: [], // This would come from user profile
            userPreferences: {
              fitnessLevel: 'intermediate', // This would come from user profile
            }
          }
        }
      };

      // Handle different input types
      if (capturedData.type === 'text') {
        analysisPayload.input.textInput = capturedData.data as string;
        analysisPayload.type = 'quick';
      } else if (capturedData.type === 'camera' || capturedData.type === 'image') {
        // Convert image to base64 for analysis
        let base64Data: string;
        if (capturedData.type === 'camera') {
          base64Data = (capturedData.data as string).split(',')[1]; // Remove data:image/jpeg;base64, prefix
        } else {
          // Handle file upload
          const file = capturedData.data as File;
          base64Data = await fileToBase64(file);
        }
        
        analysisPayload.input.imageData = {
          base64: base64Data,
          mimeType: capturedData.type === 'camera' ? 'image/jpeg' : (capturedData.data as File).type,
        };
        analysisPayload.type = 'image';
      }

      // Add additional context if provided
      if (additionalContext.trim()) {
        analysisPayload.input.textInput = (analysisPayload.input.textInput || '') + '\n\nAdditional context: ' + additionalContext;
      }

      // Call AI analysis API
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'AI analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.data);

    } catch (error) {
      console.error('AI processing error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process with AI');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveActivity = async () => {
    if (!analysisResult || !capturedData || !user) return;

    setIsProcessing(true);
    try {
      // Determine activity type for database
      const dbActivityType = dbService.determineActivityType(analysisResult);
      
      // Generate title based on AI analysis
      const title = generateActivityTitle(analysisResult);
      
      // Prepare activity data
      const activityData = {
        user_id: user.id,
        type: dbActivityType,
        title,
        description: analysisResult.notes || `${analysisResult.activityType} activity captured via ${capturedData.type}`,
        activity_data: {
          captureMethod: capturedData.type,
          originalData: capturedData.type === 'text' ? capturedData.data : 'Media file',
          additionalContext: additionalContext || undefined,
        },
        activity_date: capturedData.timestamp.toISOString(),
      };

      // Save to database
      const savedActivity = await dbService.createHealthActivity(activityData, analysisResult);
      
      if (savedActivity) {
        // Success! Navigate to home or show success message
        router.push('/?activity=' + savedActivity.id);
      } else {
        throw new Error('Failed to save activity to database');
      }

    } catch (error) {
      console.error('Save activity error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save activity');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = () => {
    setCapturedData(null);
    setCurrentMode(null);
    setTextInput("");
    setAdditionalContext("");
    setVoiceRecording(false);
    setAnalysisResult(null);
    setError(null);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to generate activity title
  const generateActivityTitle = (analysis: AIAnalysisResult): string => {
    const activityType = analysis.activityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (analysis.subCategory) {
      return `${activityType}: ${analysis.subCategory}`;
    }
    
    if (analysis.duration) {
      return `${activityType} (${analysis.duration.value} ${analysis.duration.unit})`;
    }
    
    return activityType;
  };

  // Show analysis results and save option
  if (analysisResult) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={resetCapture}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">AI Analysis Results</h1>
          </div>

          {/* Success indicator */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Analysis Complete!</span>
            <span className="text-green-600 text-sm ml-auto">{Math.round(analysisResult.confidence * 100)}% confident</span>
          </div>

          {/* Analysis Results */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{generateActivityTitle(analysisResult)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Activity Details */}
              <div>
                <h4 className="font-medium mb-2">Activity Details</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Type:</span> {analysisResult.activityType.replace(/_/g, ' ')}</p>
                  {analysisResult.subCategory && (
                    <p><span className="font-medium">Category:</span> {analysisResult.subCategory}</p>
                  )}
                  {analysisResult.duration && (
                    <p><span className="font-medium">Duration:</span> {analysisResult.duration.value} {analysisResult.duration.unit}</p>
                  )}
                  {analysisResult.intensity && (
                    <p><span className="font-medium">Intensity:</span> {analysisResult.intensity}</p>
                  )}
                  {analysisResult.calories && (
                    <p><span className="font-medium">Calories:</span> ~{analysisResult.calories.estimated}</p>
                  )}
                </div>
              </div>

              {/* Insights */}
              {analysisResult.insights && Object.keys(analysisResult.insights).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Insights</h4>
                  <div className="text-sm space-y-1">
                    {analysisResult.insights.primaryMuscleGroups && (
                      <p><span className="font-medium">Muscle Groups:</span> {analysisResult.insights.primaryMuscleGroups.join(', ')}</p>
                    )}
                    {analysisResult.insights.equipmentUsed && analysisResult.insights.equipmentUsed.length > 0 && (
                      <p><span className="font-medium">Equipment:</span> {analysisResult.insights.equipmentUsed.join(', ')}</p>
                    )}
                    {analysisResult.insights.technique && (
                      <p><span className="font-medium">Technique:</span> {analysisResult.insights.technique}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Nutritional Info */}
              {analysisResult.nutritionalInfo && (
                <div>
                  <h4 className="font-medium mb-2">Nutrition</h4>
                  <div className="text-sm space-y-1">
                    {analysisResult.nutritionalInfo.macros && (
                      <div className="flex gap-4">
                        {analysisResult.nutritionalInfo.macros.protein && (
                          <span>Protein: {analysisResult.nutritionalInfo.macros.protein}g</span>
                        )}
                        {analysisResult.nutritionalInfo.macros.carbs && (
                          <span>Carbs: {analysisResult.nutritionalInfo.macros.carbs}g</span>
                        )}
                        {analysisResult.nutritionalInfo.macros.fat && (
                          <span>Fat: {analysisResult.nutritionalInfo.macros.fat}g</span>
                        )}
                      </div>
                    )}
                    {analysisResult.nutritionalInfo.healthScore && (
                      <p><span className="font-medium">Health Score:</span> {analysisResult.nutritionalInfo.healthScore}/10</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {analysisResult.tags && analysisResult.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {analysisResult.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Editable Food Items */}
          {analysisResult.foodItems && analysisResult.foodItems.length > 0 && (
            <div className="mb-6">
              <EditableFoodList
                title="Food Items Detected"
                foodItems={analysisResult.foodItems}
                onUpdate={(updatedItems) => {
                  setAnalysisResult(prev => prev ? {
                    ...prev,
                    foodItems: updatedItems
                  } : null);
                }}
              />
            </div>
          )}

          {/* Editable Exercises */}
          {analysisResult.exercises && analysisResult.exercises.length > 0 && (
            <div className="mb-6">
              <EditableExerciseList
                title="Exercises Detected"
                exercises={analysisResult.exercises}
                onUpdate={(updatedExercises) => {
                  setAnalysisResult(prev => prev ? {
                    ...prev,
                    exercises: updatedExercises
                  } : null);
                }}
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={saveActivity}
              className="w-full h-12 text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? "Saving..." : "Save Activity"}
            </Button>
            <Button
              variant="outline"
              onClick={resetCapture}
              className="w-full"
            >
              Capture Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show captured data review
  if (capturedData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={resetCapture}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Review & Confirm</h1>
          </div>

          {/* Preview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Captured Data</CardTitle>
            </CardHeader>
            <CardContent>
              {capturedData.type === "camera" && (
                <img 
                  src={capturedData.data as string} 
                  alt="Captured" 
                  className="w-full rounded-lg"
                />
              )}
              {capturedData.type === "voice" && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Mic className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Voice Recording</p>
                    <p className="text-sm text-muted-foreground">
                      Captured at {capturedData.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
              {capturedData.type === "text" && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Text Input:</p>
                  <p className="text-sm">{capturedData.data as string}</p>
                </div>
              )}
              {capturedData.type === "image" && (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <ImageIcon className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-medium">Image Upload</p>
                    <p className="text-sm text-muted-foreground">
                      {(capturedData.data as File).name}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Context */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Add Context (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional details about this activity..."
                className="min-h-[100px]"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={processWithAI}
              className="w-full h-12 text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing with AI..." : "Analyze with AI"}
            </Button>
            <Button
              variant="outline"
              onClick={resetCapture}
              className="w-full"
            >
              Capture Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show input mode selection or specific input interface
  if (currentMode) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMode(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {currentMode === "camera" && "Take Photo"}
              {currentMode === "voice" && "Voice Recording"}
              {currentMode === "text" && "Text Entry"}
              {currentMode === "image" && "Upload Image"}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {currentMode === "camera" && (
            <CameraProvider>
              <CameraComponent 
              onClosed={() => setCurrentMode(null)}
              onCapturedImages={handleCameraCapture}
            />
            </CameraProvider>
          )}

          {currentMode === "voice" && (
            <div className="max-w-md mx-auto">
                            <AIVoiceInput
                onStart={handleVoiceStart}
                onStop={handleVoiceStop}
              />
            </div>
          )}

          {currentMode === "text" && (
            <div className="max-w-md mx-auto space-y-4">
              <Textarea
                placeholder="Describe your activity... (e.g., 'Had a chicken salad for lunch' or 'Did 30 minutes of cardio')"
                className="min-h-[200px]"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <Button 
                onClick={handleTextSubmit}
                className="w-full"
                disabled={!textInput.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {currentMode === "image" && (
            <div className="max-w-md mx-auto">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main capture mode selection
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Capture Activity</h1>
        </div>

        {/* Quick intro */}
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            Choose how you'd like to log your health activity. Our AI will analyze and categorize it automatically.
          </p>
        </div>

        {/* Capture options */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-32 flex-col gap-3"
            onClick={() => setCurrentMode("camera")}
          >
            <Camera className="w-8 h-8" />
            <span>Camera</span>
          </Button>

          <Button
            variant="outline"
            className="h-32 flex-col gap-3"
            onClick={() => setCurrentMode("voice")}
          >
            <Mic className="w-8 h-8" />
            <span>Voice</span>
          </Button>

          <Button
            variant="outline"
            className="h-32 flex-col gap-3"
            onClick={() => setCurrentMode("text")}
          >
            <Type className="w-8 h-8" />
            <span>Text</span>
          </Button>

          <Button
            variant="outline"
            className="h-32 flex-col gap-3"
            onClick={() => setCurrentMode("image")}
          >
            <ImageIcon className="w-8 h-8" />
            <span>Upload</span>
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Tips:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Take clear photos of meals or exercise equipment</li>
            <li>• Speak naturally when describing activities</li>
            <li>• Be specific with text descriptions</li>
            <li>• Upload photos from your gallery if needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 