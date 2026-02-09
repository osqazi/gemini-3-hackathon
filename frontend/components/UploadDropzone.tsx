'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, UploadCloud, X, Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isValidImageType, isValidFileSize, formatFileSize } from '@/lib/utils';
import { ImageUpload } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import CameraUpload from '@/components/CameraUpload';

interface UploadDropzoneProps {
  onFileUpload: (file: File) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: ImageUpload) => void;
  onUploadError?: (error: Error) => void;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
  className?: string;
  uploading?: boolean; // Allow parent to control upload state
  showCameraOption?: boolean; // Whether to show camera option
}

const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileUpload,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  maxFileSize = 10, // 10MB default
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  className,
  uploading = false,
  showCameraOption = true // Default to showing camera option
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [usingCamera, setUsingCamera] = useState(false);

  // Use the uploading prop if provided, otherwise use internal state
  const isUploading = uploading ?? false;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Validate file type
    if (!isValidImageType(file)) {
      setError(`Invalid file type. Please upload an image (${acceptedFileTypes.join(', ').replace('image/', '')}).`);
      return;
    }

    // Validate file size
    if (!isValidFileSize(file, maxFileSize)) {
      setError(`File is too large. Maximum size is ${maxFileSize}MB.`);
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);
    setFileSize(file.size);

    // Call the upload handler
    onFileUpload(file);
  }, [onFileUpload, maxFileSize, acceptedFileTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': acceptedFileTypes },
    maxFiles: 1,
    maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onError: (error) => {
      setError(error.message);
      if (onUploadError) onUploadError(error);
    }
  });

  const removePreview = () => {
    setPreviewUrl(null);
    setFileName(null);
    setFileSize(null);
    setError(null);
  };

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardContent className="p-6">
        {usingCamera ? (
          <CameraUpload
            onCapture={(file) => {
              // Validate file type
              if (!isValidImageType(file)) {
                setError(`Invalid file type. Please capture an image (${acceptedFileTypes.join(', ').replace('image/', '')}).`);
                return;
              }

              // Validate file size
              if (!isValidFileSize(file, maxFileSize)) {
                setError(`File is too large. Maximum size is ${maxFileSize}MB.`);
                return;
              }

              // Create preview URL
              const url = URL.createObjectURL(file);
              setPreviewUrl(url);
              setFileName(file.name);
              setFileSize(file.size);

              // Call the upload handler
              onFileUpload(file);
              setUsingCamera(false);
            }}
            onCancel={() => {
              // When camera is cancelled, just go back to the initial state
              setUsingCamera(false);
            }}
            className="!mb-0"
          />
        ) : previewUrl ? (
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-contain rounded-lg border"
              />
              <Button
                onClick={removePreview}
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{fileName}</p>
              {fileSize && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(fileSize)}
                </p>
              )}
              {isUploading ? (
                <div className="flex items-center justify-center mt-2">
                  <Spinner size="sm" className="mr-2" />
                  <p className="text-xs text-transparent text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Image ready for upload
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File upload area */}
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragging || isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/50",
                error && "border-destructive"
              )}
            >
              <input {...getInputProps()} />

              <div className="flex flex-col items-center justify-center gap-4">
                <div className="p-3 rounded-full bg-muted">
                  {isDragging || isDragActive ? (
                    <UploadCloud className="h-8 w-8 text-primary" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="font-medium">
                    {isDragging || isDragActive
                      ? "Drop your image here"
                      : "Drag 'n' drop an image, or click to select"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: JPG, PNG, WEBP (Max size: {maxFileSize}MB)
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>

            {/* Or separator */}
            {showCameraOption && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            )}

            {/* Camera option */}
            {showCameraOption && (
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-3">Capture with your camera</p>
                <Button
                  onClick={() => setUsingCamera(true)}
                  size="lg"
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadDropzone;