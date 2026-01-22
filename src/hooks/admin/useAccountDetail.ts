/**
 * Hook for fetching a single account's details
 * 
 * @module hooks/admin/useAccountDetail
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { AdminAccountDetail } from '@/types/admin';

interface AccountUsage {
  conversations: number;
  leads: number;
  knowledgeSources: number;
  locations: number;
}

interface UseAccountDetailResult {
  account: AdminAccountDetail | null;
  usage: AccountUsage | null;
  loading: boolean;
  error: Error | null;
}

export function useAccountDetail(userId: string | undefined): UseAccountDetailResult {
  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.accounts.detail(userId || ''),
    queryFn: async (): Promise<{ account: AdminAccountDetail; usage: AccountUsage }> => {
      if (!userId) throw new Error('User ID is required');

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, last_login_at, status')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch role and permissions
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('user_id', userId)
        .maybeSingle();

      // Check if this user is a team member (get owner's company info)
      const { data: teamMemberData } = await supabase
        .from('team_members')
        .select('owner_id')
        .eq('member_id', userId)
        .maybeSingle();

      let effectiveCompanyName = profile.company_name;
      let effectiveCompanyAddress = profile.company_address;
      let effectiveCompanyPhone = profile.company_phone;

      if (teamMemberData?.owner_id) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('company_name, company_address, company_phone')
          .eq('user_id', teamMemberData.owner_id)
          .maybeSingle();
        
        effectiveCompanyName = ownerProfile?.company_name || profile.company_name;
        effectiveCompanyAddress = ownerProfile?.company_address || profile.company_address;
        effectiveCompanyPhone = ownerProfile?.company_phone || profile.company_phone;
      }

      // Fetch counts (without agents)
      const [conversationResult, leadResult, knowledgeResult, locationResult] = await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('knowledge_sources').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('locations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      const account: AdminAccountDetail = {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email || '',
        display_name: profile.display_name,
        company_name: effectiveCompanyName,
        company_address: effectiveCompanyAddress,
        company_phone: effectiveCompanyPhone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: roleData?.role || 'user',
        status: (profile.status || 'active') as 'active' | 'inactive' | 'suspended',
        plan_name: null,
        subscription_status: null,
        mrr: 0,
        lead_count: leadResult.count || 0,
        knowledge_source_count: knowledgeResult.count || 0,
        location_count: locationResult.count || 0,
        last_login_at: profile.last_login_at || null,
        permissions: (roleData?.permissions as string[]) || [],
      };

      const usage: AccountUsage = {
        conversations: conversationResult.count || 0,
        leads: leadResult.count || 0,
        knowledgeSources: knowledgeResult.count || 0,
        locations: locationResult.count || 0,
      };

      return { account, usage };
    },
    enabled: !!userId,
    staleTime: 30000,
  });

  return {
    account: data?.account || null,
    usage: data?.usage || null,
    loading: isLoading,
    error: error as Error | null,
  };
}
