/**
 * Hook for fetching subscription counts (lightweight)
 * 
 * @module hooks/admin/useAdminSubscriptionsCount
 */

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';

interface SubscriptionCounts {
  activeCount: number;
  totalCount: number;
}

interface UseAdminSubscriptionsCountResult {
  data: SubscriptionCounts;
  loading: boolean;
  error: Error | null;
}

/**
 * Fetch subscription counts.
 * Lightweight alternative to useAdminSubscriptions when only counts are needed.
 */
export async function fetchSubscriptionsCount(): Promise<SubscriptionCounts> {
  // TODO: Implement actual counts from Stripe when connected
  // For now return placeholder data
  return {
    activeCount: 0,
    totalCount: 0,
  };
}

export function useAdminSubscriptionsCount(): UseAdminSubscriptionsCountResult {
  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.subscriptions.count(),
    queryFn: fetchSubscriptionsCount,
    staleTime: 60_000, // 1 minute
  });

  return {
    data: data || { activeCount: 0, totalCount: 0 },
    loading: isLoading,
    error: error as Error | null,
  };
}
