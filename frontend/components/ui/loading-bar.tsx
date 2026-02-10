'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mountedRef = useRef(false);
  const progressTimeout = useRef<NodeJS.Timeout | null>(null);
  const finishTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    
    // Create a global loading controller
    const loadingController = {
      start: () => {
        if (mountedRef.current) {
          // Clear any existing timeouts to prevent conflicts
          if (progressTimeout.current) {
            clearTimeout(progressTimeout.current);
          }
          if (finishTimeout.current) {
            clearTimeout(finishTimeout.current);
          }
          
          setIsLoading(true);
          setProgress(10);
          
          // Simulate quick progress to 60%
          progressTimeout.current = setTimeout(() => {
            if (mountedRef.current) {
              setProgress(60);
              
              // Then progress to 90%
              progressTimeout.current = setTimeout(() => {
                if (mountedRef.current) {
                  setProgress(90);
                  
                  // Set a timeout to ensure loading finishes if not explicitly finished
                  finishTimeout.current = setTimeout(() => {
                    if (isLoading) {
                      loadingController.finish();
                    }
                  }, 500);
                }
              }, 200);
            }
          }, 200);
        }
      },
      update: (value: number) => {
        if (mountedRef.current) {
          setProgress(value);
        }
      },
      finish: () => {
        if (mountedRef.current) {
          // Clear all timeouts
          if (progressTimeout.current) {
            clearTimeout(progressTimeout.current);
          }
          if (finishTimeout.current) {
            clearTimeout(finishTimeout.current);
          }
          
          setProgress(100);
          // Wait a moment for the animation to show 100%, then reset
          setTimeout(() => {
            if (mountedRef.current) {
              setIsLoading(false);
              setProgress(0); // Reset immediately after reaching 100%
            }
          }, 150); // Brief pause at 100% before resetting
        }
      }
    };

    // Expose the controller globally so it can be accessed from anywhere
    window.loadingBar = loadingController;

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (progressTimeout.current) {
        clearTimeout(progressTimeout.current);
      }
      if (finishTimeout.current) {
        clearTimeout(finishTimeout.current);
      }
      delete window.loadingBar;
    };
  }, []);

  // Trigger loading when route changes
  useEffect(() => {
    // Only trigger loading after the initial page load
    if (mountedRef.current) {
      window.loadingBar?.start();
      
      // Set a guaranteed finish timeout
      const guaranteedFinish = setTimeout(() => {
        if (isLoading) {
          window.loadingBar?.finish();
        }
      }, 2000); // Maximum loading time
      
      return () => clearTimeout(guaranteedFinish);
    }
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999] overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 transition-all duration-300 ease-out"
        style={{ 
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(251, 146, 60, 0.7), 0 0 20px rgba(239, 68, 68, 0.5)'
        }}
      />
    </div>
  );
}