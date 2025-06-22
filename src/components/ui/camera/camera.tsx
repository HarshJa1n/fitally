"use client";

import { ArrowLeftRight, Check, GalleryVerticalEnd, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraView } from "./camera-view";
import { FC, useRef, useEffect, useState } from "react";
import { CameraType } from "@/components/ui/camera/camera-types";
import { useCamera } from "@/components/ui/camera/camera-provider";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CameraProps {
  onClosed: () => void;
  onCapturedImages: (images: string[]) => void;
  onOcrProcess?: (images: string[], prompt?: string) => void;
}

const Camera: FC<CameraProps> = ({ onClosed, onCapturedImages, onOcrProcess }) => {
  const camera = useRef<CameraType>(null);
  const { images, addImage, numberOfCameras, resetImages, stopStream } =
    useCamera();
  const [ocrPrompt, setOcrPrompt] = useState('');
  const [showOcrInput, setShowOcrInput] = useState(false);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  // Ensure camera stream stops when component unmounts
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const handleCapture = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (camera.current) {
      const imageData = camera.current.takePhoto();
      if (imageData) {
        addImage(imageData);
      }
    }
  };

  const handleOnClosed = () => {
    stopStream();
    onClosed();
  };
  
  const handleOnCapturedImages = async (usePrompt: boolean = false) => {
    if (!onOcrProcess) {
      // Fallback to direct image processing if no OCR handler
      onCapturedImages(images);
      resetImages();
      handleOnClosed();
      return;
    }

    setIsProcessingOcr(true);
    
    try {
      // Always process with OCR, use prompt only if specified
      const prompt = usePrompt ? (ocrPrompt || undefined) : undefined;
      await onOcrProcess(images, prompt);
      
      resetImages();
      setOcrPrompt('');
      setShowOcrInput(false);
      handleOnClosed();
    } catch (error) {
      console.error('OCR processing failed in camera:', error);
      // Still close on error
      resetImages();
      setOcrPrompt('');
      setShowOcrInput(false);
      handleOnClosed();
    } finally {
      setIsProcessingOcr(false);
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      {/* Camera View */}
      <CameraView ref={camera} />
      
      {/* OCR Processing Overlay */}
      {isProcessingOcr && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing with AI</h3>
            <p className="text-gray-600">Extracting text from your image...</p>
          </div>
        </div>
      )}
      
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
        {/* Close Button */}
        <Button
          size="icon"
          variant={images.length > 0 ? "destructive" : "secondary"}
          className="rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
          onClick={handleOnClosed}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Confirm Button with OCR Options (when images captured) */}
        {images.length > 0 && (
          <div className="flex items-center gap-2">
            {/* OCR Prompt Input */}
            <Popover open={showOcrInput} onOpenChange={setShowOcrInput}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full bg-yellow-600 hover:bg-yellow-700 text-white border-0"
                  title="Add OCR Instructions"
                  disabled={isProcessingOcr}
                >
                  {isProcessingOcr ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="bottom" align="end">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="ocr-prompt" className="text-sm font-medium">
                      OCR Instructions (Optional)
                    </Label>
                    <Input
                      id="ocr-prompt"
                      placeholder="e.g., 'Extract only highlighted text'"
                      value={ocrPrompt}
                      onChange={(e) => setOcrPrompt(e.target.value)}
                      className="text-sm"
                      disabled={isProcessingOcr}
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty for default text extraction
                    </p>
                  </div>
                  {isProcessingOcr && (
                    <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-blue-700 text-sm">Processing with AI...</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOnCapturedImages(true)}
                      size="sm"
                      className="flex-1"
                      disabled={isProcessingOcr}
                    >
                      {isProcessingOcr ? 'Processing...' : 'Extract Text'}
                    </Button>
                    <Button
                      onClick={() => setShowOcrInput(false)}
                      variant="outline"
                      size="sm"
                      disabled={isProcessingOcr}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick OCR Button (no prompt) */}
            <Button
              size="icon"
              variant="default"
              className="rounded-full bg-green-600 hover:bg-green-700 text-white border-0"
              onClick={() => handleOnCapturedImages(false)}
              title="Extract Text (Quick)"
              disabled={isProcessingOcr}
            >
              {isProcessingOcr ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Check className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-20">
        {/* Gallery Button */}
        {images.length > 0 && (
          <Gallery />
        )}

        {/* Capture Button */}
        <Button
          size="lg"
          className="rounded-full w-16 h-16 bg-white hover:bg-gray-200 text-black border-4 border-black/20"
          onClick={handleCapture}
        >
          <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300"></div>
        </Button>

        {/* Camera Switch Button */}
        {numberOfCameras > 1 && (
          <SwitchCamera />
        )}
      </div>
    </div>
  );
};

function SwitchCamera() {
  const { devices, setActiveDeviceId, switchCamera } = useCamera();

  if (devices.length === 2) {
    return (
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
        onClick={switchCamera}
      >
        <ArrowLeftRight className="h-5 w-5" />
      </Button>
    );
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Switch Camera</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <Select
            onValueChange={(value) => {
              setActiveDeviceId(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose Camera" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

function Gallery() {
  const { images, removeImage } = useCamera();
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full bg-black/50 hover:bg-black/70 text-white border-0"
        >
          <GalleryVerticalEnd className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{images.length} Photos</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img 
                  src={image} 
                  alt="captured" 
                  className="w-full h-auto rounded border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2 rounded-full h-8 w-8 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default Camera; 