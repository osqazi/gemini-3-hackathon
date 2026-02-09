import { useState, useEffect } from 'react';

// Performance monitoring utilities
export interface PerformanceMetrics {
  responseTime: number;
  successRate: number;
  errorCount: number;
  startTime: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    responseTime: 0,
    successRate: 100,
    errorCount: 0,
    startTime: Date.now()
  };

  private readonly MAX_RESPONSE_TIME = 4000; // 4 seconds for recipe refinements
  private readonly MAX_UI_TIME = 1000;       // 1 second for UI interactions

  measure<T>(fn: () => Promise<T>, context: string = 'operation'): Promise<T> {
    const startTime = performance.now();

    return fn().then(result => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.metrics.responseTime = duration;

      if (duration > this.getMaxAllowedTime(context)) {
        console.warn(`${context} took too long: ${duration}ms`);
      }

      return result;
    }).catch(error => {
      this.metrics.errorCount++;
      this.updateSuccessRate();
      throw error;
    });
  }

  private getMaxAllowedTime(context: string): number {
    if (context.includes('recipe') || context.includes('refinement')) {
      return this.MAX_RESPONSE_TIME;
    } else if (context.includes('ui') || context.includes('interaction')) {
      return this.MAX_UI_TIME;
    }
    return this.MAX_RESPONSE_TIME; // Default
  }

  private updateSuccessRate(): void {
    // Calculate success rate based on error count vs total operations
    // This is a simplified calculation - in practice, you'd track total operations
    const totalOps = 100; // This would need to be tracked properly
    this.metrics.successRate = Math.max(0, 100 - (this.metrics.errorCount / totalOps) * 100);
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      responseTime: 0,
      successRate: 100,
      errorCount: 0,
      startTime: Date.now()
    };
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = (context: string = 'operation') => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    successRate: 100,
    errorCount: 0,
    startTime: Date.now()
  });

  const monitor = new PerformanceMonitor();

  const measureOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      setMetrics(prev => ({
        ...prev,
        responseTime: duration
      }));

      return result;
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
      throw error;
    }
  };

  return { metrics, measureOperation };
};

// Utility for loading states
export const useLoadingState = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoading = () => {
    setLoading(true);
    setProgress(0);
  };

  const updateProgress = (value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  };

  const finishLoading = () => {
    setProgress(100);
    setTimeout(() => setLoading(false), 200); // Small delay for visual completion
  };

  return { loading, progress, startLoading, updateProgress, finishLoading };
};