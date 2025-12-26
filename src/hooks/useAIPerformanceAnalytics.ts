/**
 * useAIPerformanceAnalytics Hook
 * 
 * Hook for fetching AI performance analytics from conversations and conversation_takeovers tables.
 * Provides containment rate (AI vs human takeover) and resolution rate (closed conversations).
 * Uses React Query for caching and Supabase real-time for automatic updates.
 * 
 * @module hooks/useAIPerformanceAnalytics
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
  AIPerformanceStats,
  AIPerformanceTrendData,
  ConversationStatusType,
} from '@/types/analytics';

/** Raw conversation from database query */
interface RawConversation {
  id: string;
  status: ConversationStatusType;
  created_at: string;
}

/** Query key for AI performance analytics */
const AI_PERFORMANCE_KEY = ['analytics', 'ai-performance'] as const;

/**
 * Build query key for AI performance analytics with date range
 */
const buildQueryKey = (startDate: Date, endDate: Date, userId: string | null) => [
  ...AI_PERFORMANCE_KEY,
  {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
    userId,
  },
] as const;

/**
 * Hook for fetching AI performance analytics data.
 * 
 * Metrics calculated:
 * - **Containment Rate**: Percentage of conversations handled entirely by AI (no human takeover)
 *   Formula: (totalConversations - humanTakeover) / totalConversations * 100
 * - **Resolution Rate**: Percentage of conversations that reached 'closed' status
 *   Formula: closed / totalConversations * 100
 * 
 * @param startDate - Start of date range (inclusive)
 * @param endDate - End of date range (inclusive)
 * @returns AIPerformanceStats data, loading state, and refetch function
 * 
 * @example
 * ```tsx
 * const { stats, loading, refetch } = useAIPerformanceAnalytics(startDate, endDate);
 * 
 * if (loading) return <Skeleton />;
 * 
 * return (
 *   <>
 *     <p>AI Containment: {stats?.containmentRate}%</p>
 *     <p>Resolution Rate: {stats?.resolutionRate}%</p>
 *   </>
 * );
 * ```
 */
export const useAIPerformanceAnalytics = (startDate: Date, endDate: Date, enabled: boolean = true) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all conversations in the date range
  const {
    data: rawConversations = [],
    isLoading: loadingConversations,
  } = useSupabaseQuery<RawConversation[]>({
    queryKey: ['conversations', 'for-ai-analytics', user?.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        logger.error('Error fetching conversations for AI analytics:', error);
        throw error;
      }

      return (data || []) as RawConversation[];
    },
    realtime: enabled ? {
      table: 'conversations',
      filter: `user_id=eq.${user?.id}`,
    } : undefined,
    enabled: enabled && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch takeover count for these conversations
  const conversationIds = useMemo(() => rawConversations.map((c) => c.id), [rawConversations]);

  const {
    data: takeoverCount = 0,
    isLoading: loadingTakeovers,
  } = useSupabaseQuery<number>({
    queryKey: ['takeovers', 'count', conversationIds.join(',')],
    queryFn: async () => {
      if (conversationIds.length === 0) return 0;

      // Get unique conversations with takeovers
      const { data, error } = await supabase
        .from('conversation_takeovers')
        .select('conversation_id')
        .in('conversation_id', conversationIds);

      if (error) {
        logger.error('Error fetching takeover count:', error);
        return 0;
      }

      // Count unique conversations that had takeovers
      const uniqueConversations = new Set((data || []).map((t) => t.conversation_id));
      return uniqueConversations.size;
    },
    enabled: enabled && conversationIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Compute derived statistics
  const stats: AIPerformanceStats | null = useMemo(() => {
    if (!rawConversations) {
      return {
        containmentRate: 0,
        resolutionRate: 0,
        totalConversations: 0,
        aiHandled: 0,
        humanTakeover: 0,
        closed: 0,
        active: 0,
      };
    }

    const totalConversations = rawConversations.length;
    
    if (totalConversations === 0) {
      return {
        containmentRate: 0,
        resolutionRate: 0,
        totalConversations: 0,
        aiHandled: 0,
        humanTakeover: 0,
        closed: 0,
        active: 0,
      };
    }

    // Count by status
    let closedCount = 0;
    let activeCount = 0;
    let humanTakeoverStatus = 0;

    rawConversations.forEach((c) => {
      if (c.status === 'closed') closedCount++;
      if (c.status === 'active') activeCount++;
      if (c.status === 'human_takeover') humanTakeoverStatus++;
    });

    // Use the greater of: current human_takeover status OR historical takeover count
    // This handles cases where takeover ended but was recorded
    const humanTakeover = Math.max(takeoverCount, humanTakeoverStatus);
    const aiHandled = totalConversations - humanTakeover;

    // Calculate rates
    const containmentRate = Math.round((aiHandled / totalConversations) * 100);
    const resolutionRate = Math.round((closedCount / totalConversations) * 100);

    return {
      containmentRate,
      resolutionRate,
      totalConversations,
      aiHandled,
      humanTakeover,
      closed: closedCount,
      active: activeCount,
    };
  }, [rawConversations, takeoverCount]);

  // Compute trend data for sparklines
  const trend: AIPerformanceTrendData[] = useMemo(() => {
    if (!rawConversations || rawConversations.length === 0) return [];

    // Group conversations by date
    const trendMap = new Map<string, { total: number; closed: number; humanTakeover: number }>();
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    allDays.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      trendMap.set(dateKey, { total: 0, closed: 0, humanTakeover: 0 });
    });

    rawConversations.forEach((c) => {
      const dateKey = format(new Date(c.created_at), 'yyyy-MM-dd');
      const dayData = trendMap.get(dateKey);
      if (dayData) {
        dayData.total++;
        if (c.status === 'closed') dayData.closed++;
        if (c.status === 'human_takeover') dayData.humanTakeover++;
      }
    });

    return Array.from(trendMap.entries())
      .map(([date, { total, closed, humanTakeover }]) => ({
        date,
        total,
        containmentRate: total > 0 ? Math.round(((total - humanTakeover) / total) * 100) : 0,
        resolutionRate: total > 0 ? Math.round((closed / total) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [rawConversations, startDate, endDate]);

  const isLoading = loadingConversations || loadingTakeovers;

  return {
    /** Computed AI performance statistics */
    stats,
    /** Daily trend data for sparklines/charts */
    trend,
    /** Raw conversations for advanced usage */
    rawConversations,
    /** Whether data is currently loading */
    loading: isLoading,
    /** Manually trigger a refetch */
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: buildQueryKey(startDate, endDate, user?.id || null) });
    },
    /** Invalidate the cache (useful after mutations) */
    invalidate: () => queryClient.invalidateQueries({ queryKey: AI_PERFORMANCE_KEY }),
  };
};
