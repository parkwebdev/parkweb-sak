/**
 * PeakActivityChart Component
 * 
 * Displays a horizontal bar chart showing conversation volume by day of week.
 * Identifies busiest days for conversations.
 * 
 * @module components/analytics/PeakActivityChart
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
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

// Day order for sorting
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Gradient colors from light to dark (like TrafficSourceChart)
const BAR_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.85)',
  'hsl(var(--primary) / 0.70)',
  'hsl(var(--primary) / 0.55)',
  'hsl(var(--primary) / 0.40)',
  'hsl(var(--primary) / 0.30)',
  'hsl(var(--primary) / 0.20)',
];

/**
 * Horizontal bar chart showing busiest days of the week.
 */
export const PeakActivityChart = React.memo(function PeakActivityChart({
  conversationStats,
  loading = false,
  className,
}: PeakActivityChartProps) {
  const prefersReducedMotion = useReducedMotion();

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: springs.smooth,
    },
  }), []);

  const reducedVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
  }), []);

  // Aggregate by day of week
  const dayData = useMemo(() => {
    const totals: Record<string, number> = {};
    
    conversationStats.forEach(stat => {
      try {
        const date = parseISO(stat.date);
        const dayName = format(date, 'EEEE');
        totals[dayName] = (totals[dayName] || 0) + stat.total;
      } catch {
        // Skip invalid dates
      }
    });

    // Convert to array and sort by value (descending)
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [conversationStats]);

  const maxValue = useMemo(() => 
    Math.max(...dayData.map(d => d.value), 1),
    [dayData]
  );

  const totalConversations = useMemo(() => 
    dayData.reduce((sum, d) => sum + d.value, 0),
    [dayData]
  );

  if (loading) {
    return (
      <div className={cn('rounded-xl bg-muted/50 border border-border p-4', className)}>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-muted/50 shadow-sm border border-border',
        className
      )}
      variants={prefersReducedMotion ? reducedVariants : cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 md:px-5">
        <h3 className="text-sm font-semibold text-foreground">Busiest Days</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Conversations by day of week
        </p>
      </div>

      {/* Inner card with bars */}
      <div className="flex flex-col gap-2 rounded-t-xl bg-card px-4 py-4 shadow-sm border-t border-border md:px-5">
        {dayData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No activity data
          </div>
        ) : (
          <TooltipProvider>
            <div className="space-y-2">
              {dayData.slice(0, 5).map((day, index) => {
                const percentage = totalConversations > 0 
                  ? ((day.value / totalConversations) * 100).toFixed(0)
                  : '0';
                const barWidth = (day.value / maxValue) * 100;
                
                return (
                  <Tooltip key={day.name}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 cursor-default">
                        {/* Day name */}
                        <span className="text-xs text-muted-foreground w-10 shrink-0 truncate">
                          {day.name.slice(0, 3)}
                        </span>
                        
                        {/* Bar container */}
                        <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                          <motion.div
                            className="h-full rounded-sm"
                            style={{ backgroundColor: BAR_COLORS[index] || BAR_COLORS[BAR_COLORS.length - 1] }}
                            initial={prefersReducedMotion ? { width: `${barWidth}%` } : { width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ 
                              duration: prefersReducedMotion ? 0 : 0.6, 
                              delay: index * 0.08,
                              ease: 'easeOut'
                            }}
                          />
                        </div>
                        
                        {/* Percentage */}
                        <span className="text-xs font-medium text-foreground w-8 text-right shrink-0">
                          {percentage}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-sm font-medium">{day.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.value.toLocaleString()} conversations ({percentage}%)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
});
