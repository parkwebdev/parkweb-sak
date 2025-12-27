/**
 * SatisfactionScoreCard Component
 * 
 * Displays customer satisfaction metrics including average rating with
 * star visualization and rating distribution bars.
 * 
 * @module components/analytics/SatisfactionScoreCard
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Star01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import type { SatisfactionScoreCardProps, RatingValue } from '@/types/analytics';
import { ChartCardHeader } from './ChartCardHeader';

/**
 * Star rating display component.
 * Renders filled and empty stars based on rating value.
 */
function StarRating({ rating, size = 20 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const totalStars = 5;

  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: totalStars }).map((_, i) => {
        const isFilled = i < fullStars;
        const isHalf = i === fullStars && hasHalfStar;
        
        return (
          <Star01
            key={i}
            size={size}
            className={cn(
              "transition-colors",
              isFilled || isHalf ? "text-warning fill-warning" : "text-muted-foreground/30"
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

/**
 * Renders satisfaction score with star visualization and rating distribution.
 */
export const SatisfactionScoreCard = React.memo(function SatisfactionScoreCard({
  averageRating,
  totalRatings,
  distribution,
  trendValue = 0,
  trendPeriod = 'this month',
  loading = false,
  className,
}: SatisfactionScoreCardProps & { trendValue?: number; trendPeriod?: string }) {
  // Loading state
  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-4" role="status" aria-label="Loading satisfaction data">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-16" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (totalRatings === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardContent className="pt-6">
          <ChartCardHeader
            title="Customer Satisfaction"
            trendValue={0}
            trendPeriod={trendPeriod}
            contextSummary="No ratings submitted yet"
          />
          <EmptyState
            icon={<Star01 size={20} className="text-muted-foreground" />}
            title="No ratings yet"
            description="Customer satisfaction ratings will appear here once submitted."
          />
        </CardContent>
      </Card>
    );
  }

  // Sort distribution by rating descending (5 stars first)
  const sortedDistribution = [...distribution].sort((a, b) => b.rating - a.rating);

  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Customer Satisfaction"
          trendValue={trendValue}
          trendLabel="Rating"
          trendPeriod={trendPeriod}
        />
        <div className="space-y-6">
          {/* Average rating display */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-foreground tabular-nums">
              {averageRating.toFixed(1)}
            </span>
            <div className="space-y-1">
              <StarRating rating={averageRating} size={20} />
              <p className="text-sm text-muted-foreground">
                {totalRatings.toLocaleString()} {totalRatings === 1 ? 'rating' : 'ratings'}
              </p>
            </div>
          </div>

          {/* Rating distribution bars */}
          <div className="space-y-2">
            {sortedDistribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-4 text-right tabular-nums">
                  {item.rating}
                </span>
                <Star01 
                  size={14} 
                  className="text-warning fill-warning shrink-0" 
                  aria-hidden="true" 
                />
                <Progress 
                  value={item.percentage} 
                  className="flex-1 h-2"
                  aria-label={`${item.rating} star: ${item.percentage.toFixed(1)} percent`}
                />
                <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Context summary */}
          <p className="text-xs text-muted-foreground">
            Based on {totalRatings.toLocaleString()} customer ratings
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
