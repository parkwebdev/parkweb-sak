/**
 * Peak Activity Utilities
 * 
 * Reusable heatmap calculation for peak activity data.
 * Used in PeakActivityChart component and report exports.
 * 
 * @module lib/peak-activity-utils
 */

import { parseISO, getDay } from 'date-fns';

// Day labels (Sunday = 0 in JS)
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// 4-hour time blocks
const TIME_BLOCKS = [
  { label: '12a-4a', start: 0, end: 3 },
  { label: '4a-8a', start: 4, end: 7 },
  { label: '8a-12p', start: 8, end: 11 },
  { label: '12p-4p', start: 12, end: 15 },
  { label: '4p-8p', start: 16, end: 19 },
  { label: '8p-12a', start: 20, end: 23 },
];

export interface PeakActivityData {
  /** 7 days × 6 time blocks matrix */
  data: number[][];
  /** Day with highest activity */
  peakDay: string;
  /** Time block with highest activity */
  peakTime: string;
  /** Highest conversation count */
  peakValue: number;
}

/**
 * Calculates peak activity heatmap data from conversation stats.
 * Returns a 7×6 grid (days × 4-hour blocks) with peak info.
 */
export function calculatePeakActivityData(
  conversationStats: Array<{ date: string; total: number }>
): PeakActivityData | null {
  if (!conversationStats || conversationStats.length === 0) {
    return null;
  }

  // Initialize 7×6 grid with zeros
  const grid: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0));

  conversationStats.forEach(stat => {
    try {
      const date = parseISO(stat.date);
      const dayOfWeek = getDay(date); // 0 = Sunday
      
      // For daily stats, distribute evenly across business hours (8am-8pm)
      const businessBlocks = [2, 3, 4]; // 8a-12p, 12p-4p, 4p-8p
      businessBlocks.forEach(blockIdx => {
        grid[dayOfWeek][blockIdx] += Math.floor(stat.total / 3);
      });
      // Add remainder to peak hours (12p-4p)
      grid[dayOfWeek][3] += stat.total % 3;
    } catch {
      // Skip invalid dates
    }
  });

  // Find max value for peak info
  let max = 0;
  let peakDay = 0;
  let peakBlock = 0;
  
  grid.forEach((row, dayIdx) => {
    row.forEach((val, blockIdx) => {
      if (val > max) {
        max = val;
        peakDay = dayIdx;
        peakBlock = blockIdx;
      }
    });
  });

  if (max === 0) {
    return null;
  }

  return {
    data: grid,
    peakDay: FULL_DAYS[peakDay],
    peakTime: TIME_BLOCKS[peakBlock].label,
    peakValue: max,
  };
}
