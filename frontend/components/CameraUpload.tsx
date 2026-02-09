'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Camera, CameraOff, RotateCcw, Upload, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface CameraUploadProps {
  onCapture: (file: File) => void;
  onCancel?: () => void; // Callback when camera is cancelled/closed
  className?: string;
  disabled?: boolean;
}

const CameraUpload: React.FC<CameraUploadProps> = ({
  onCapture,
  onCancel,
  className,
  disabled = false
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera
  useEffect(() => {
    if (hasPermission === null) {
      initializeCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera not supported by your browser.');
      setHasPermission(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer rear camera on mobile
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
      setHasPermission(false);
    }
  };

  const startCamera = async () => {
    if (hasPermission === false) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        setStream(mediaStream);
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        setError('Could not access camera. Please check permissions.');
      }
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setIsCapturing(false);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create File object
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        setCapturedImage(URL.createObjectURL(blob));
        onCapture(file);
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.85); // 85% quality to balance size and quality
  };

  const retakeImage = () => {
    setCapturedImage(null);
  };

  const cancelCapture = () => {
    // Stop all tracks in the stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setCapturedImage(null);

    // Reset to initial state to ask for camera permission again
    setHasPermission(null);

    // Notify parent component that camera was cancelled
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {hasPermission === null || (hasPermission && !capturedImage) ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {isCapturing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              )}

              {hasPermission && !isCapturing && (
                <Button
                  onClick={captureImage}
                  size="icon"
                  className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-white hover:bg-gray-200 border-4 border-black"
                  aria-label="Capture photo"
                  disabled={disabled}
                >
                  <Camera className="h-8 w-8 text-black" />
                </Button>
              )}

              {/* Close camera button - appears when camera is active */}
              {hasPermission && !capturedImage && (
                <Button
                  onClick={cancelCapture}
                  size="icon"
                  variant="destructive"
                  className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black"
                  aria-label="Close camera"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : capturedImage ? (
            <>
              <img
                src={capturedImage}
                alt="Captured from camera"
                className="w-full h-full object-contain"
              />

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Button
                  onClick={retakeImage}
                  size="icon"
                  variant="secondary"
                  className="bg-white/80 hover:bg-white text-black"
                  aria-label="Retake photo"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={cancelCapture}
                  size="icon"
                  variant="secondary"
                  className="bg-white/80 hover:bg-white text-black"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Close camera button - appears when viewing captured image */}
              <Button
                onClick={cancelCapture}
                size="icon"
                variant="destructive"
                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black"
                aria-label="Close camera"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : null}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive">
            {error}
            <Button
              onClick={startCamera}
              variant="outline"
              size="sm"
              className="mt-2 ml-2"
            >
              <Camera className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {hasPermission === false && !error && (
          <div className="p-4 bg-destructive/10 text-destructive flex items-center justify-between">
            <div>Camera access denied. Please allow camera access to use this feature.</div>
            <Button
              onClick={startCamera}
              variant="outline"
              size="sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Enable Camera
            </Button>
          </div>
        )}

        {hasPermission === null && (
          <div className="p-4 flex items-center justify-center">
            <Spinner size="sm" className="mr-2" />
            <span>Initializing camera...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CameraUpload;