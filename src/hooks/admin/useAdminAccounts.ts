/**
 * Hook for fetching admin accounts with pagination and filtering
 * 
 * @module hooks/admin/useAdminAccounts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { AdminAccount, AdminAccountFilters, PaginatedResult } from '@/types/admin';

interface UseAdminAccountsOptions extends Partial<AdminAccountFilters> {
  page?: number;
  pageSize?: number;
}

interface UseAdminAccountsResult {
  accounts: AdminAccount[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: Error | null;
}

export function useAdminAccounts(options: UseAdminAccountsOptions = {}): UseAdminAccountsResult {
  const {
    search = '',
    planId,
    status = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    pageSize = 25,
  } = options;

  const filters: AdminAccountFilters = { search, planId, status, sortBy, sortOrder };

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.accounts.list(filters, page, pageSize),
    queryFn: async (): Promise<PaginatedResult<AdminAccount>> => {
      // Build the query
      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          company_name,
          avatar_url,
          email,
          created_at
        `, { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy === 'mrr' ? 'created_at' : sortBy, { ascending });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: profiles, error: profilesError, count } = await query;

      if (profilesError) throw profilesError;

      // Get additional data for each profile
      const accounts: AdminAccount[] = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          // Get agent count
          const { count: agentCount } = await supabase
            .from('agents')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          // Get conversation count (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { count: conversationCount } = await supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          // Get lead count
          const { count: leadCount } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', profile.user_id);

          return {
            id: profile.id,
            user_id: profile.user_id,
            email: profile.email || '',
            display_name: profile.display_name,
            company_name: profile.company_name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            role: roleData?.role || 'user',
            status: 'active' as const, // TODO: Implement actual status tracking
            plan_name: null, // TODO: Integrate with subscriptions
            subscription_status: null,
            mrr: 0,
            agent_count: agentCount || 0,
            conversation_count: conversationCount || 0,
            lead_count: leadCount || 0,
          };
        })
      );

      // Filter by status if needed
      let filteredAccounts = accounts;
      if (status !== 'all') {
        filteredAccounts = accounts.filter((a) => a.status === status);
      }

      return {
        data: filteredAccounts,
        totalCount: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 30000, // 30 seconds
  });

  return {
    accounts: data?.data || [],
    totalCount: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    loading: isLoading,
    error: error as Error | null,
  };
}
