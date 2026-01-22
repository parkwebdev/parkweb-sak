/**
 * Hook for fetching admin accounts with pagination and filtering
 * Optimized with batch queries to avoid N+1 problem
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
          created_at,
          last_login_at,
          status
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

      const profileUserIds = (profiles || []).map(p => p.user_id);

      if (profileUserIds.length === 0) {
        return {
          data: [],
          totalCount: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }

      // Batch fetch all roles, team memberships, and counts in parallel
      const [rolesResult, teamMembersResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', profileUserIds),
        supabase
          .from('team_members')
          .select('member_id, owner_id')
          .in('member_id', profileUserIds),
      ]);

      // Get unique owner IDs and fetch their profiles
      const ownerIds = [...new Set(teamMembersResult.data?.map(tm => tm.owner_id) || [])];
      const ownerProfilesResult = ownerIds.length > 0
        ? await supabase
            .from('profiles')
            .select('user_id, company_name')
            .in('user_id', ownerIds)
        : { data: [] };

      // Create lookup maps for O(1) access
      const roleMap = new Map(rolesResult.data?.map(r => [r.user_id, r.role]) || []);
      const teamMemberMap = new Map(teamMembersResult.data?.map(tm => [tm.member_id, tm.owner_id]) || []);
      const ownerProfileMap = new Map(ownerProfilesResult.data?.map(p => [p.user_id, p.company_name]) || []);

      // Filter out Pilot team users - they belong on the Pilot Team page, not Accounts
      const pilotTeamUserIds = new Set(
        rolesResult.data
          ?.filter(r => r.role === 'super_admin' || r.role === 'pilot_support')
          .map(r => r.user_id) || []
      );
      const filteredProfiles = (profiles || []).filter(
        profile => !pilotTeamUserIds.has(profile.user_id)
      );

      // Map profiles to accounts synchronously (no more N+1)
      const accounts: AdminAccount[] = filteredProfiles.map(profile => {
        const ownerId = teamMemberMap.get(profile.user_id);
        const effectiveCompanyName = ownerId
          ? ownerProfileMap.get(ownerId) || profile.company_name
          : profile.company_name;

        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || '',
          display_name: profile.display_name,
          company_name: effectiveCompanyName,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          last_login_at: profile.last_login_at,
          role: roleMap.get(profile.user_id) || 'user',
          status: (profile.status || 'active') as 'active' | 'inactive' | 'suspended',
          plan_name: null,
          subscription_status: null,
          mrr: 0,
          lead_count: 0,
        };
      });

      // Filter by status if needed
      let filteredAccounts = accounts;
      if (status !== 'all') {
        filteredAccounts = accounts.filter((a) => a.status === status);
      }

      // Adjust total count to exclude Pilot team members
      const adjustedTotalCount = Math.max(0, (count || 0) - pilotTeamUserIds.size);

      return {
        data: filteredAccounts,
        totalCount: adjustedTotalCount,
        page,
        pageSize,
        totalPages: Math.ceil(adjustedTotalCount / pageSize),
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
