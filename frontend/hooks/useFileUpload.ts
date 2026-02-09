import { useState, useCallback } from 'react';
import { analyzePhoto } from '@/lib/api';
import { Session, AnalyzePhotoResponse } from '@/types';

interface UseFileUploadReturn {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadFile: (file: File) => Promise<AnalyzePhotoResponse>;
  reset: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<AnalyzePhotoResponse> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress for the upload
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Perform the actual upload
      const result = await analyzePhoto(file);

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => setProgress(0), 500);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadFile,
    reset
  };
};