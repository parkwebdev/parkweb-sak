/**
 * useSatisfactionAnalytics Hook
 * 
 * Hook for fetching customer satisfaction analytics from conversation_ratings table.
 * Provides average rating, distribution, trend data, and recent feedback.
 * Uses React Query for caching and Supabase real-time for automatic updates.
 * 
 * @module hooks/useSatisfactionAnalytics
 * @see docs/ANALYTICS_REDESIGN_PLAN.md
 * @see src/types/analytics.ts
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { logger } from '@/utils/logger';
import { format, eachDayOfInterval } from 'date-fns';
import type {
  SatisfactionStats,
  RatingValue,
  RatingDistribution,
  SatisfactionTrendData,
  FeedbackItem,
} from '@/types/analytics';

/** Raw rating from database query */
interface RawRating {
  id: string;
  rating: number;
  feedback: string | null;
  trigger_type: string;
  created_at: string;
  conversation_id: string;
}

/** Query key for satisfaction analytics */
const SATISFACTION_ANALYTICS_KEY = ['analytics', 'satisfaction'] as const;

/**
 * Build query key for satisfaction analytics with date range
 */
const buildQueryKey = (startDate: Date, endDate: Date, userId: string | null) => [
  ...SATISFACTION_ANALYTICS_KEY,
  {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    userId,
  },
] as const;

/**
 * Hook for fetching satisfaction analytics data.
 * 
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns SatisfactionStats data, loading state, and refetch function
 * 
 * @example
 * ```tsx
 * const { stats, loading, refetch } = useSatisfactionAnalytics(startDate, endDate);
 * 
 * if (loading) return <Skeleton />;
 * 
 * return (
 *   <>
 *     <p>Average Rating: {stats?.averageRating.toFixed(1)}</p>
 *     <p>Total Ratings: {stats?.totalRatings}</p>
 *   </>
 * );
 * ```
 */
export const useSatisfactionAnalytics = (startDate: Date, endDate: Date, enabled: boolean = true) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // First get the user's conversation IDs for the date range
  const { data: conversationIds = [] } = useSupabaseQuery<string[]>({
    queryKey: ['conversations', 'ids-for-ratings', user?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        logger.error('Error fetching conversation IDs for satisfaction:', error);
        return [];
      }

      return (data || []).map((c) => c.id);
    },
    enabled: enabled && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Main satisfaction analytics query
  const {
    data: rawRatings = [],
    isLoading,
    refetch,
  } = useSupabaseQuery<RawRating[]>({
    queryKey: buildQueryKey(startDate, endDate, user?.id || null),
    queryFn: async () => {
      if (!user?.id || conversationIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('conversation_ratings')
        .select('id, rating, feedback, trigger_type, created_at, conversation_id')
        .in('conversation_id', conversationIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching satisfaction analytics:', error);
        throw error;
      }

      return (data || []) as RawRating[];
    },
    realtime: enabled && conversationIds.length > 0 ? {
      table: 'conversation_ratings',
      // Realtime will update on any rating change
    } : undefined,
    enabled: enabled && !!user?.id && conversationIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Compute derived statistics from raw ratings
  const stats: SatisfactionStats | null = useMemo(() => {
    // Return empty stats structure for consistent rendering
    const emptyDistribution: RatingDistribution[] = [
      { rating: 5 as RatingValue, count: 0, percentage: 0 },
      { rating: 4 as RatingValue, count: 0, percentage: 0 },
      { rating: 3 as RatingValue, count: 0, percentage: 0 },
      { rating: 2 as RatingValue, count: 0, percentage: 0 },
      { rating: 1 as RatingValue, count: 0, percentage: 0 },
    ];

    if (!rawRatings || rawRatings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        distribution: emptyDistribution,
        trend: [],
        recentFeedback: [],
      };
    }

    // Calculate average rating
    const totalRatings = rawRatings.length;
    const sumRatings = rawRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((sumRatings / totalRatings) * 10) / 10; // 1 decimal

    // Calculate distribution (1-5 stars)
    const distributionCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    rawRatings.forEach((r) => {
      const rating = Math.min(5, Math.max(1, Math.round(r.rating)));
      distributionCounts[rating]++;
    });

    const distribution: RatingDistribution[] = [5, 4, 3, 2, 1].map((rating) => ({
      rating: rating as RatingValue,
      count: distributionCounts[rating],
      percentage: Math.round((distributionCounts[rating] / totalRatings) * 100),
    }));

    // Calculate daily trend
    const trendMap = new Map<string, { sum: number; count: number }>();
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    allDays.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      trendMap.set(dateKey, { sum: 0, count: 0 });
    });

    rawRatings.forEach((r) => {
      const dateKey = format(new Date(r.created_at), 'yyyy-MM-dd');
      const dayData = trendMap.get(dateKey);
      if (dayData) {
        dayData.sum += r.rating;
        dayData.count++;
      }
    });

    const trend: SatisfactionTrendData[] = Array.from(trendMap.entries())
      .map(([date, { sum, count }]) => ({
        date,
        avgRating: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get recent feedback (ratings with comments, limit 10)
    const recentFeedback: FeedbackItem[] = rawRatings
      .filter((r) => r.feedback && r.feedback.trim().length > 0)
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        rating: r.rating,
        feedback: r.feedback,
        createdAt: r.created_at,
        triggerType: r.trigger_type,
      }));

    return {
      averageRating,
      totalRatings,
      distribution,
      trend,
      recentFeedback,
    };
  }, [rawRatings, startDate, endDate]);

  return {
    /** Computed satisfaction statistics */
    stats,
    /** Raw ratings for advanced usage */
    rawRatings,
    /** Whether data is currently loading */
    loading: isLoading,
    /** Manually trigger a refetch */
    refetch,
    /** Invalidate the cache (useful after mutations) */
    invalidate: () => queryClient.invalidateQueries({ queryKey: SATISFACTION_ANALYTICS_KEY }),
  };
};
