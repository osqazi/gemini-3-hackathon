import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    loadingBar: {
      start: () => void;
      update: (value: number) => void;
      finish: () => void;
    };
  }
}

export const useLoadingBar = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    if (typeof window !== 'undefined' && window.loadingBar) {
      window.loadingBar.start();
    }
  };

  const update = (value: number) => {
    if (typeof window !== 'undefined' && window.loadingBar) {
      window.loadingBar.update(value);
    }
  };

  const finish = () => {
    if (typeof window !== 'undefined' && window.loadingBar) {
      window.loadingBar.finish();
    }
  };

  // Auto finish loading when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      finish();
    };
  }, []);

  return { start, update, finish };
};