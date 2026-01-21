/**
 * Account Owner ID Hook
 * 
 * Resolves the account owner ID for team-based data scoping.
 * - If admin is impersonating, returns the impersonated user's ID
 * - If user is an account owner (has subscription), returns their own ID
 * - If user is a team member, returns their team owner's ID
 * 
 * This enables team members to see the same data as the account owner,
 * and admins to view user data when impersonating.
 * 
 * @module hooks/useAccountOwnerId
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-keys';
import { logger } from '@/utils/logger';
import { useImpersonationTarget } from '@/hooks/admin/useImpersonation';

/**
 * Hook that returns the account owner ID for data scoping.
 * Uses the database function `get_account_owner_id()` which returns:
 * - The impersonated user's ID if admin is impersonating
 * - The current user's ID if they have a subscription (they're the owner)
 * - The team owner's ID if they're a team member
 * 
 * @returns {Object} Account owner state
 * @returns {string | null} accountOwnerId - The account owner's user ID for data queries
 * @returns {boolean} isTeamMember - Whether the current user is a team member (not the owner)
 * @returns {boolean} isImpersonating - Whether admin is currently impersonating
 * @returns {boolean} loading - Loading state
 */
export const useAccountOwnerId = () => {
  const { user } = useAuth();
  const targetUserId = useImpersonationTarget();

  const { data, isLoading } = useQuery({
    // Include targetUserId so key changes when impersonation starts/ends
    queryKey: queryKeys.account.ownerId(user?.id, targetUserId),
    queryFn: async (): Promise<string | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_account_owner_id');

      if (error) {
        // If RPC fails, fall back to user's own ID
        logger.error('Error fetching account owner ID:', error);
        return user.id;
      }

      // RPC returns the owner ID or null
      return data || user.id;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // Cache for 1 minute (needs faster refresh during impersonation)
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  const accountOwnerId = data ?? user?.id ?? null;
  const isImpersonating = !!targetUserId;
  const isTeamMember = !!user?.id && !!accountOwnerId && user.id !== accountOwnerId && !isImpersonating;

  return {
    accountOwnerId,
    isTeamMember,
    isImpersonating,
    loading: isLoading,
  };
};
