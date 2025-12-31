/**
 * CSATDistributionCard Component
 * 
 * Horizontal bar chart showing rating distribution from 5 stars to 1 star.
 * Color-coded from green (5★) to red (1★) with percentages and counts.
 * 
 * @module components/analytics/CSATDistributionCard
 */

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Star01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { RatingDistribution } from '@/types/analytics';
import { ChartCardHeader } from './ChartCardHeader';

interface CSATDistributionCardProps {
  distribution: RatingDistribution[];
  averageRating: number;
  totalRatings: number;
  loading?: boolean;
  className?: string;
}

// Color palette for ratings (5★ = green, 1★ = red)
const RATING_COLORS: Record<number, string> = {
  5: 'hsl(142, 76%, 36%)',  // Green
  4: 'hsl(84, 60%, 45%)',   // Light green
  3: 'hsl(45, 90%, 50%)',   // Yellow
  2: 'hsl(25, 90%, 55%)',   // Orange
  1: 'hsl(0, 72%, 51%)',    // Red
};

export const CSATDistributionCard = React.memo(function CSATDistributionCard({
  distribution,
  averageRating,
  totalRatings,
  loading = false,
  className,
}: CSATDistributionCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Sort by rating descending (5★ first)
  const sortedDistribution = useMemo(() => {
    return [...distribution].sort((a, b) => b.rating - a.rating);
  }, [distribution]);

  // Find max count for bar scaling
  const maxCount = useMemo(() => {
    return Math.max(...distribution.map(d => d.count), 1);
  }, [distribution]);

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalRatings === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <ChartCardHeader
            title="CSAT Distribution"
            contextSummary="No ratings yet"
          />
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Star01 size={24} className="text-muted-foreground mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Rating distribution will appear once customers submit feedback.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="CSAT Distribution"
          contextSummary={`${totalRatings.toLocaleString()} total rating${totalRatings !== 1 ? 's' : ''}`}
          rightSlot={
            <div className="flex items-center gap-1.5">
              <Star01 size={16} className="text-rating fill-rating" aria-hidden="true" />
              <span className="text-lg font-semibold text-foreground tabular-nums">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">avg</span>
            </div>
          }
        />

        {/* Rating bars */}
        <div className="space-y-3">
          {sortedDistribution.map((item, index) => {
            const widthPercentage = (item.count / maxCount) * 100;
            const barColor = RATING_COLORS[item.rating] || 'hsl(var(--muted))';
            const animationDelay = prefersReducedMotion ? 0 : index * 50;

            return (
              <div
                key={item.rating}
                className="flex items-center gap-3 group animate-fade-in"
                style={{ animationDelay: `${animationDelay}ms` }}
              >
                {/* Rating label */}
                <div className="flex items-center gap-1 w-10 shrink-0">
                  <span className="text-sm font-medium text-foreground">{item.rating}</span>
                  <Star01 size={12} className="text-muted-foreground" />
                </div>

                {/* Bar with tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 h-6 relative overflow-hidden bg-muted/50 rounded-md">
                      <div
                        className="h-full rounded-md transition-all duration-300"
                        style={{
                          width: `${Math.max(widthPercentage, item.count > 0 ? 4 : 0)}%`,
                          backgroundColor: barColor,
                          animation: prefersReducedMotion ? 'none' : `growWidth 600ms ease-out ${animationDelay}ms both`,
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-1">
                      <p className="font-medium text-xs">{item.rating} Star Rating</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{item.count.toLocaleString()}</span> ratings ({item.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </TooltipContent>
              </Tooltip>

                {/* Percentage */}
                <span className="text-sm text-muted-foreground w-14 text-right tabular-nums shrink-0 group-hover:text-foreground transition-colors">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
});
