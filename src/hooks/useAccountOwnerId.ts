/**
 * Account Owner ID Hook
 * 
 * Resolves the account owner ID for team-based data scoping.
 * - If user is an account owner (has subscription), returns their own ID
 * - If user is a team member, returns their team owner's ID
 * 
 * This enables team members to see the same data as the account owner.
 * 
 * @module hooks/useAccountOwnerId
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/query-keys';

/**
 * Hook that returns the account owner ID for data scoping.
 * Uses the database function `get_account_owner_id()` which returns:
 * - The current user's ID if they have a subscription (they're the owner)
 * - The team owner's ID if they're a team member
 * 
 * @returns {Object} Account owner state
 * @returns {string | null} accountOwnerId - The account owner's user ID for data queries
 * @returns {boolean} isTeamMember - Whether the current user is a team member (not the owner)
 * @returns {boolean} loading - Loading state
 */
export const useAccountOwnerId = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.account.ownerId(user?.id),
    queryFn: async (): Promise<string | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.rpc('get_account_owner_id');

      if (error) {
        // If RPC fails, fall back to user's own ID
        console.error('Error fetching account owner ID:', error);
        return user.id;
      }

      // RPC returns the owner ID or null
      return data || user.id;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes (owner doesn't change often)
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  const accountOwnerId = data ?? user?.id ?? null;
  const isTeamMember = !!user?.id && !!accountOwnerId && user.id !== accountOwnerId;

  return {
    accountOwnerId,
    isTeamMember,
    loading: isLoading,
  };
};
