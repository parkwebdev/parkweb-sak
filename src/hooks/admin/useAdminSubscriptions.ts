/**
 * Hook for fetching all subscriptions (placeholder)
 * 
 * @module hooks/admin/useAdminSubscriptions
 */

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { AdminSubscription } from '@/types/admin';

interface UseAdminSubscriptionsOptions {
  status?: 'active' | 'trialing' | 'canceled' | 'all';
  page?: number;
  pageSize?: number;
}

interface UseAdminSubscriptionsResult {
  subscriptions: AdminSubscription[];
  activeSubscriptions: number;
  totalCount: number;
  loading: boolean;
  error: Error | null;
}

export function useAdminSubscriptions(
  options: UseAdminSubscriptionsOptions = {}
): UseAdminSubscriptionsResult {
  const { status = 'all', page = 1, pageSize = 25 } = options;

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.subscriptions.list({ status, page, pageSize }),
    queryFn: async () => {
      // TODO: Implement when subscriptions table exists or integrate with Stripe
      // For now, return placeholder data
      return {
        subscriptions: [] as AdminSubscription[],
        activeSubscriptions: 0,
        totalCount: 0,
      };
    },
    staleTime: 60000,
  });

  return {
    subscriptions: data?.subscriptions || [],
    activeSubscriptions: data?.activeSubscriptions || 0,
    totalCount: data?.totalCount || 0,
    loading: isLoading,
    error: error as Error | null,
  };
}
