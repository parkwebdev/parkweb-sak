/**
 * Analytics Utility Functions
 * 
 * Pure utility functions for analytics data processing.
 * These functions handle visual variance for sparkline charts
 * and data transformation for chart components.
 * 
 * @module lib/analytics-utils
 */

/**
 * Add visual variance to sparse data for interesting sparkline curves.
 * Ensures a minimum of 7 data points for smooth rendering.
 * 
 * @param trend - Array of numerical trend values
 * @param minPoints - Minimum number of points to generate (default: 7)
 * @returns Array of numbers with visual variance applied
 * 
 * @example
 * // Empty array generates baseline curve
 * ensureVisualVariance([]) // Returns 7-point sine wave
 * 
 * // Sparse data gets interpolated
 * ensureVisualVariance([5, 10]) // Returns 7-point curve leading to 10
 * 
 * // Flat data gets wave pattern
 * ensureVisualVariance([5, 5, 5, 5, 5, 5, 5]) // Returns varied curve
 */
export const ensureVisualVariance = (trend: number[], minPoints: number = 7): number[] => {
  // If we have no data, create a baseline curve
  if (trend.length === 0) {
    return Array.from({ length: minPoints }, (_, i) => {
      const progress = i / (minPoints - 1);
      return Math.sin(progress * Math.PI) * 0.3 + 0.2;
    });
  }
  
  // If we have fewer points than minimum, interpolate/extend
  if (trend.length < minPoints) {
    const actualValue = trend[trend.length - 1] || 1;
    const result: number[] = [];
    
    for (let i = 0; i < minPoints; i++) {
      const progress = i / (minPoints - 1);
      // Create a gentle wave leading up to the actual value
      const wave = Math.sin(progress * Math.PI * 0.8) * 0.3;
      const growth = progress * 0.5;
      const baseValue = Math.max(0.1, actualValue * (0.3 + wave + growth));
      result.push(baseValue);
    }
    // Ensure last point reflects the actual value
    result[minPoints - 1] = Math.max(0.1, actualValue);
    return result;
  }
  
  // Existing logic for when we have enough points
  const allZero = trend.every(v => v === 0);
  const allSame = trend.every(v => v === trend[0]);
  
  if (allZero || allSame) {
    const baseValue = trend[0] || 1;
    return trend.map((_, i) => {
      const progress = i / (trend.length - 1);
      const wave = Math.sin(progress * Math.PI * 1.5) * 0.4;
      const uptrend = progress * 0.3;
      return Math.max(0.1, baseValue * (0.5 + wave + uptrend));
    });
  }
  
  // Amplify small variance
  const max = Math.max(...trend);
  const min = Math.min(...trend);
  if (max > 0 && (max - min) / max < 0.2) {
    const mid = (max + min) / 2;
    return trend.map(v => {
      const diff = v - mid;
      return mid + diff * 2.5;
    });
  }
  
  return trend;
};

/**
 * Generate chart data from daily counts.
 * Applies visual variance and transforms to chart-compatible format.
 * 
 * @param dailyCounts - Array of daily count values
 * @returns Array of objects with value property for chart consumption
 * 
 * @example
 * generateChartData([10, 15, 12, 18])
 * // Returns [{ value: 10 }, { value: 15 }, { value: 12 }, { value: 18 }]
 * // (with visual variance applied if needed)
 */
export const generateChartData = (dailyCounts: number[]): { value: number }[] => {
  const visualTrend = ensureVisualVariance(dailyCounts);
  return visualTrend.map((count) => ({ value: count }));
};
