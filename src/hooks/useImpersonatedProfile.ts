/**
 * Impersonated Profile Hook
 * 
 * Provides profile data that respects impersonation state.
 * When an admin is impersonating a user, this hook returns the
 * impersonated user's profile instead of the admin's own profile.
 * 
 * Use this hook in any UI component that needs to display profile
 * data (avatar, name, email) and should reflect the impersonated
 * user during an active impersonation session.
 * 
 * @module hooks/useImpersonatedProfile
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useImpersonationTarget } from '@/hooks/admin/useImpersonation';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/utils/logger';

export interface ImpersonatedProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  company_name: string | null;
  company_address: string | null;
  company_phone: string | null;
}

/**
 * Hook that returns profile data with impersonation awareness.
 * 
 * @returns {Object} Profile state
 * @returns {ImpersonatedProfile | null} profile - The profile data (impersonated user's when active)
 * @returns {boolean} loading - Loading state
 * @returns {boolean} isImpersonating - Whether admin is currently impersonating
 * @returns {string | null} effectiveUserId - The user ID whose profile is being shown
 * @returns {string | null} adminUserId - The actual admin's user ID (for operations that should always use admin)
 * @returns {Function} refetch - Function to refetch profile data
 */
export function useImpersonatedProfile() {
  const { user } = useAuth();
  const { isImpersonating } = useAccountOwnerId();
  const targetUserId = useImpersonationTarget();

  // Determine whose profile to fetch
  // When impersonating, show the target user's profile
  // Otherwise, show the current user's profile
  const effectiveUserId = isImpersonating && targetUserId ? targetUserId : user?.id ?? null;

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: effectiveUserId ? queryKeys.profile.detail(effectiveUserId) : ['profile', 'detail', 'none'],
    queryFn: async (): Promise<ImpersonatedProfile | null> => {
      if (!effectiveUserId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url, company_name, company_address, company_phone')
        .eq('user_id', effectiveUserId)
        .single();

      if (error) {
        logger.error('Error fetching impersonated profile:', error);
        return null;
      }

      return data;
    },
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 1, // 1 minute - needs faster refresh during impersonation
  });

  return {
    profile,
    loading: isLoading,
    isImpersonating,
    effectiveUserId,
    adminUserId: user?.id ?? null,
    refetch,
  };
}
