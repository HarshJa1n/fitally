"use client";

import { useState } from "react";
import { ArrowLeft, Camera, Mic, Type, Image as ImageIcon } from "lucide-react";
import CameraComponent from "@/components/ui/camera/camera";
import { CameraProvider } from "@/components/ui/camera/camera-provider";
import { AIVoiceInput } from "@/components/ui/ai-voice-input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InputMode = "camera" | "voice" | "text" | "image";

interface CapturedData {
  type: InputMode;
  data: string | File | null;
  timestamp: Date;
}

export default function CapturePage() {
  const [currentMode, setCurrentMode] = useState<InputMode | null>(null);
  const [capturedData, setCapturedData] = useState<CapturedData | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);

  const handleCameraCapture = (images: string[]) => {
    if (images.length > 0) {
      setCapturedData({
        type: "camera",
        data: images[0], // Use the first captured image
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
    if (!capturedData) return;
    
    setIsProcessing(true);
    // TODO: Integrate with AI flow
    setTimeout(() => {
      setIsProcessing(false);
      // Navigate to results or show analysis
    }, 2000);
  };

  const resetCapture = () => {
    setCapturedData(null);
    setCurrentMode(null);
    setTextInput("");
    setVoiceRecording(false);
  };

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
              />
            </CardContent>
          </Card>

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
              {currentMode === "text" && "Text Input"}
              {currentMode === "image" && "Upload Image"}
            </h1>
          </div>
        </div>

        <div className="p-4">
          {currentMode === "camera" && (
            <CameraProvider>
              <div className="max-w-md mx-auto h-[500px] rounded-xl overflow-hidden">
                <CameraComponent
                  onClosed={() => setCurrentMode(null)}
                  onCapturedImages={handleCameraCapture}
                  onOcrProcess={async (images: string[], prompt?: string) => {
                    // Handle OCR processing if needed
                    handleCameraCapture(images);
                  }}
                />
              </div>
            </CameraProvider>
          )}

          {currentMode === "voice" && (
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Record Your Activity</h2>
                <p className="text-muted-foreground">
                  Describe what you ate, drank, or your exercise
                </p>
              </div>
              <AIVoiceInput
                onStart={handleVoiceStart}
                onStop={handleVoiceStop}
                className="bg-card rounded-xl p-8"
              />
              {voiceRecording && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-blue-700 font-medium">Recording...</p>
                  <p className="text-blue-600 text-sm">Speak clearly about your activity</p>
                </div>
              )}
            </div>
          )}

          {currentMode === "text" && (
            <div className="max-w-md mx-auto space-y-4">
              <Textarea
                value={textInput}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextInput(e.target.value)}
                placeholder="Describe your activity... (e.g., 'Had a protein shake with banana' or 'Went for a 30-minute run')"
                className="min-h-[200px] text-lg"
              />
              <Button
                onClick={handleTextSubmit}
                className="w-full h-12 text-lg"
                disabled={!textInput.trim()}
              >
                Continue
              </Button>
            </div>
          )}

          {currentMode === "image" && (
            <div className="max-w-md mx-auto">
              <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block space-y-4"
                  >
                    <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Upload an Image</p>
                      <p className="text-sm text-muted-foreground">
                        Tap to select from your photo library
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main capture mode selection
  return (
    <div className="min-h-screen bg-background">
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
          <h1 className="text-xl font-semibold">Add Activity</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">How would you like to log?</h2>
            <p className="text-muted-foreground">
              Choose your preferred input method
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Camera Capture */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentMode("camera")}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Camera</h3>
                  <p className="text-sm text-muted-foreground">Take a photo</p>
                </div>
              </CardContent>
            </Card>

            {/* Voice Recording */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentMode("voice")}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Mic className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Voice</h3>
                  <p className="text-sm text-muted-foreground">Record audio</p>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentMode("text")}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Type className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Text</h3>
                  <p className="text-sm text-muted-foreground">Type details</p>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentMode("image")}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Gallery</h3>
                  <p className="text-sm text-muted-foreground">Upload image</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              🤖 AI will analyze your input and suggest activity details
            </p>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
            <div className="flex justify-center p-4">
              <button 
                onClick={() => window.location.href = "/"}
                className="px-6 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 