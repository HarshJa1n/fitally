import React from 'react';

export interface CameraContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  capturedImages: string[];
  setCapturedImages: (images: string[]) => void;
  isCapturing: boolean;
  setIsCapturing: (capturing: boolean) => void;
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;
  videoRef: { current: HTMLVideoElement | null } | null;
  canvasRef: { current: HTMLCanvasElement | null } | null;
  error: string | null;
  setError: (error: string | null) => void;
}

export interface CameraProps {
  onClosed?: () => void;
  onCapturedImages?: (images: string[]) => void;
  maxImages?: number;
  quality?: number;
  numberOfCamerasCallback?(numberOfCameras: number): void;
  videoSourceDeviceId?: string | undefined;
  errorMessages?: {
    noCameraAccessible?: string;
    permissionDenied?: string;
    switchCamera?: string;
    canvas?: string;
  };
  videoReadyCallback?(): void;
}

export interface CameraViewProps {
  onCapture: () => void;
  onClose: () => void;
  onRetake: () => void;
  onConfirm: () => void;
  capturedImages: string[];
  isCapturing: boolean;
  error: string | null;
  videoRef: { current: HTMLVideoElement | null };
  canvasRef: { current: HTMLCanvasElement | null };
  stream: MediaStream | null;
}

export type FacingMode = 'user' | 'environment';
export type Stream = MediaStream | null;
export type SetStream = React.Dispatch<React.SetStateAction<Stream>>;
export type SetNumberOfCameras = React.Dispatch<React.SetStateAction<number>>;
export type SetNotSupported = React.Dispatch<React.SetStateAction<boolean>>;
export type SetPermissionDenied = React.Dispatch<React.SetStateAction<boolean>>;

export type CameraType = React.ForwardRefExoticComponent<CameraProps & React.RefAttributes<unknown>> & {
  takePhoto(): string;
  stopCamera(): void;
};

export interface Navigator {
  webkitGetUserMedia?: (constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (error: Error) => void) => void;
  mozGetUserMedia?: (constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (error: Error) => void) => void;
  msGetUserMedia?: (constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (error: Error) => void) => void;
}

export interface ErrorMessages {
  noCameraAccessible?: string;
  permissionDenied?: string;
  switchCamera?: string;
  canvas?: string;
}

export const defaultErrorMessages: ErrorMessages = {
  noCameraAccessible: "No camera device accessible. Please connect your camera or try a different browser.",
  permissionDenied: "Permission denied. Please refresh and give camera permission.",
  switchCamera: "It is not possible to switch camera to different one because there is only one video device accessible.",
  canvas: "Canvas is not supported.",
}; 