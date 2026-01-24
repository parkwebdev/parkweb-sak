/**
 * Hook for fetching admin account count (lightweight)
 * 
 * @module hooks/admin/useAdminAccountsCount
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';

interface UseAdminAccountsCountResult {
  count: number;
  loading: boolean;
  error: Error | null;
}

/**
 * Fetch account count excluding pilot team members.
 * Lightweight alternative to useAdminAccounts when only count is needed.
 */
export async function fetchAccountsCount(): Promise<number> {
  // First get pilot team user IDs to exclude
  const { data: pilotTeamRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['super_admin', 'pilot_support']);

  const pilotUserIds = pilotTeamRoles?.map((r) => r.user_id) || [];

  // Count profiles excluding pilot team
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (pilotUserIds.length > 0) {
    query = query.not('user_id', 'in', `(${pilotUserIds.join(',')})`);
  }

  const { count, error } = await query;

  if (error) throw error;
  return count || 0;
}

export function useAdminAccountsCount(): UseAdminAccountsCountResult {
  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.accounts.count(),
    queryFn: fetchAccountsCount,
    staleTime: 60_000, // 1 minute
  });

  return {
    count: data || 0,
    loading: isLoading,
    error: error as Error | null,
  };
}
