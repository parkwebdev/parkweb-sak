import { logger, performanceTimer } from '@/utils/logger';

/**
 * Performance monitoring utility for critical user flows
 * Provides instrumentation without changing user experience
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing a performance-critical operation
   */
  startTiming(operationName: string, context?: Record<string, any>) {
    const timer = performanceTimer(`Performance: ${operationName}`);
    const startTime = performance.now();

    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordMetric({
          name: operationName,
          duration,
          timestamp: Date.now(),
          context
        });

        timer.end();
        
        // Log slow operations (>2 seconds)
        if (duration > 2000) {
          logger.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`, context);
        }

        return duration;
      }
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get performance insights
   */
  getInsights() {
    if (this.metrics.length === 0) return null;

    const byOperation = new Map<string, number[]>();
    
    this.metrics.forEach(metric => {
      if (!byOperation.has(metric.name)) {
        byOperation.set(metric.name, []);
      }
      byOperation.get(metric.name)!.push(metric.duration);
    });

    const insights = Array.from(byOperation.entries()).map(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      
      return {
        operation: name,
        count: durations.length,
        avgDuration: Math.round(avg * 100) / 100,
        maxDuration: Math.round(max * 100) / 100,
        minDuration: Math.round(min * 100) / 100
      };
    });

    return insights.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear() {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Hook for performance monitoring in React components
 */
export const usePerformanceMonitor = () => {
  return {
    startTiming: (operationName: string, context?: Record<string, any>) => 
      performanceMonitor.startTiming(operationName, context),
    getInsights: () => performanceMonitor.getInsights()
  };
};
