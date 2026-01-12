/**
 * Hook for fetching revenue analytics
 * 
 * @module hooks/admin/useRevenueAnalytics
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { RevenueData } from '@/types/admin';

interface DateRange {
  from: Date;
  to: Date;
}

interface UseRevenueAnalyticsResult {
  data: RevenueData | null;
  mrr: number;
  churnRate: number;
  loading: boolean;
  error: Error | null;
}

export function useRevenueAnalytics(dateRange?: DateRange): UseRevenueAnalyticsResult {
  // Memoize default date range to prevent new Date objects on every render
  const defaultRange = useMemo(() => ({
    from: new Date(new Date().setMonth(new Date().getMonth() - 12)),
    to: new Date(),
  }), []);

  const range = dateRange || defaultRange;

  // Serialize dates for stable query key
  const serializedRange = useMemo(() => ({
    from: range.from.toISOString(),
    to: range.to.toISOString(),
  }), [range.from, range.to]);

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.revenue.analytics(serializedRange),
    queryFn: async (): Promise<RevenueData> => {
      // TODO: Implement actual revenue analytics from Stripe/subscriptions
      // For now, return placeholder data
      return {
        mrr: 0,
        arr: 0,
        churnRate: 0,
        arpu: 0,
        ltv: 0,
        trialConversion: 0,
        netRevenueRetention: 100,
        activeSubscriptions: 0,
        trialSubscriptions: 0,
        mrrHistory: [],
        churnHistory: [],
        funnel: {
          trials: 0,
          active: 0,
          churned: 0,
          conversionRate: 0,
        },
        byPlan: [],
        topAccounts: [],
        // MRR Movement
        newMRR: 0,
        expansionMRR: 0,
        contractionMRR: 0,
        churnedMRR: 0,
        quickRatio: 0,
        mrrMovementHistory: [],
        // Churn analysis
        churnByPlan: [],
        // Account concentration
        accountConcentration: {
          top10Percent: 0,
          top25Percent: 0,
        },
      };
    },
    staleTime: 300000, // 5 minutes
  });

  return {
    data: data || null,
    mrr: data?.mrr || 0,
    churnRate: data?.churnRate || 0,
    loading: isLoading,
    error: error as Error | null,
  };
}
