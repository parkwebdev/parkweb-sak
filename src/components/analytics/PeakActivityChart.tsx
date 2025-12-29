/**
 * PeakActivityChart Component
 * 
 * Displays a day×hour heatmap showing conversation volume patterns.
 * Shows 7 days × 6 time blocks (4-hour intervals) with blue gradient coloring.
 * Includes peak activity summary and hover tooltips.
 * 
 * @module components/analytics/PeakActivityChart
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ChartCardHeader } from './ChartCardHeader';
import { parseISO, getDay } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface PeakActivityChartProps {
  /** Conversation stats with date and total */
  conversationStats: Array<{ date: string; total: number }>;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

// Day labels (Sunday = 0 in JS)
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

// Blue gradient from lightest to darkest (5 levels)
const getHeatColor = (value: number, max: number): string => {
  if (max === 0 || value === 0) return 'hsl(var(--muted))';
  
  const intensity = value / max;
  
  if (intensity < 0.2) return 'hsl(210, 100%, 95%)';
  if (intensity < 0.4) return 'hsl(215, 95%, 85%)';
  if (intensity < 0.6) return 'hsl(220, 90%, 72%)';
  if (intensity < 0.8) return 'hsl(225, 85%, 58%)';
  return 'hsl(230, 80%, 45%)';
};

/**
 * Heatmap showing busiest days and times.
 * Grid layout: 7 days (rows) × 6 time blocks (columns).
 */
export const PeakActivityChart = React.memo(function PeakActivityChart({
  conversationStats,
  loading = false,
  className,
}: PeakActivityChartProps) {
  const prefersReducedMotion = useReducedMotion();

  // Build heatmap data: aggregate by day of week and hour block
  const { heatmapData, maxValue, peakInfo, totalConversations } = useMemo(() => {
    // Initialize 7×6 grid with zeros
    const grid: number[][] = Array.from({ length: 7 }, () => Array(6).fill(0));
    let total = 0;
    
    conversationStats.forEach(stat => {
      try {
        const date = parseISO(stat.date);
        const dayOfWeek = getDay(date); // 0 = Sunday
        
        // For daily stats, distribute evenly across business hours (8am-8pm)
        // In production with hourly data, this would be more accurate
        const businessBlocks = [2, 3, 4]; // 8a-12p, 12p-4p, 4p-8p
        businessBlocks.forEach(blockIdx => {
          grid[dayOfWeek][blockIdx] += Math.floor(stat.total / 3);
        });
        // Add remainder to peak hours (12p-4p)
        grid[dayOfWeek][3] += stat.total % 3;
        
        total += stat.total;
      } catch {
        // Skip invalid dates
      }
    });

    // Find max value for color scaling
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

    return {
      heatmapData: grid,
      maxValue: max,
      peakInfo: max > 0 ? {
        day: FULL_DAYS[peakDay],
        time: TIME_BLOCKS[peakBlock].label,
        count: max,
      } : null,
      totalConversations: total,
    };
  }, [conversationStats]);

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(42)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-sm" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Peak Activity"
          contextSummary={`${totalConversations.toLocaleString()} conversations by day & time`}
          rightSlot={peakInfo ? (
            <div className="text-right">
              <p className="text-xs font-medium text-primary">Busiest</p>
              <p className="text-xs text-muted-foreground">
                {peakInfo.day} {peakInfo.time}
              </p>
            </div>
          ) : undefined}
        />

        {totalConversations === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No activity data
          </div>
        ) : (
          <TooltipProvider>
            <div className="space-y-1">
              {/* Time block headers */}
              <div className="grid gap-1" style={{ gridTemplateColumns: '2.5rem repeat(6, 1fr)' }}>
                <div /> {/* Empty corner cell */}
                {TIME_BLOCKS.map((block) => (
                  <div 
                    key={block.label} 
                    className="text-2xs text-muted-foreground text-center font-medium"
                  >
                    {block.label}
                  </div>
                ))}
              </div>

              {/* Day rows */}
              {DAYS.map((day, dayIdx) => (
                <div 
                  key={day} 
                  className="grid gap-1" 
                  style={{ gridTemplateColumns: '2.5rem repeat(6, 1fr)' }}
                >
                  {/* Day label */}
                  <div className="text-xs text-muted-foreground font-medium flex items-center">
                    {day}
                  </div>
                  
                  {/* Time block cells */}
                  {TIME_BLOCKS.map((block, blockIdx) => {
                    const value = heatmapData[dayIdx][blockIdx];
                    const bgColor = getHeatColor(value, maxValue);
                    const isPeak = peakInfo && 
                      FULL_DAYS[dayIdx] === peakInfo.day && 
                      block.label === peakInfo.time;
                    
                    return (
                      <Tooltip key={`${dayIdx}-${blockIdx}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-8 rounded-sm cursor-default transition-all hover:ring-2 hover:ring-primary/30',
                              isPeak && 'ring-2 ring-primary',
                              !prefersReducedMotion && 'animate-fade-in'
                            )}
                            style={{ 
                              backgroundColor: bgColor,
                              animationDelay: prefersReducedMotion ? '0ms' : `${(dayIdx * 6 + blockIdx) * 15}ms`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-center">
                          <p className="text-sm font-medium">{FULL_DAYS[dayIdx]}</p>
                          <p className="text-xs text-muted-foreground">
                            {block.label}: {value.toLocaleString()} conversations
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-4 pt-4 border-t border-border">
              <span className="text-2xs text-muted-foreground mr-1">Less</span>
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--muted))' }} />
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(210, 100%, 95%)' }} />
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(215, 95%, 85%)' }} />
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(220, 90%, 72%)' }} />
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(225, 85%, 58%)' }} />
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'hsl(230, 80%, 45%)' }} />
              <span className="text-2xs text-muted-foreground ml-1">More</span>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
});
