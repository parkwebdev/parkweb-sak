/**
 * ChartCardHeader Component
 * 
 * Reusable header for analytics chart cards that displays:
 * - Title and what the card shows
 * - Trend indicator (up/down by X%)
 * - Context summary (what's being displayed)
 * 
 * @module components/analytics/ChartCardHeader
 */

import React from 'react';
import { TrendUp01, TrendDown01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

export interface ChartCardHeaderProps {
  /** Card title */
  title: string;
  /** Trend percentage value (positive = up, negative = down) */
  trendValue?: number;
  /** Period for trend comparison (e.g., "this month", "this week") */
  trendPeriod?: string;
  /** Context summary describing what's shown (e.g., "Showing 4,371 visitors across 6 pages") */
  contextSummary?: string;
  /** Optional slot for controls like dropdowns/filters on the right side */
  rightSlot?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Consistent header component for analytics chart cards.
 * Provides trend indicator and context summary.
 */
export function ChartCardHeader({
  title,
  trendValue = 0,
  trendPeriod = 'this month',
  contextSummary,
  rightSlot,
  className,
}: ChartCardHeaderProps) {
  const isPositive = trendValue >= 0;
  const TrendIcon = isPositive ? TrendUp01 : TrendDown01;
  const trendColor = isPositive ? 'text-success' : 'text-destructive';

  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">
            Trending {isPositive ? 'up' : 'down'} by {Math.abs(trendValue).toFixed(1)}% {trendPeriod}
          </span>
          <TrendIcon size={14} className={trendColor} />
        </div>
        {contextSummary && (
          <p className="text-sm text-muted-foreground">{contextSummary}</p>
        )}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
