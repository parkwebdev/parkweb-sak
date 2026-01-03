/**
 * Hook for fetching lead activities with real-time subscriptions.
 * 
 * @module hooks/useLeadActivities
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type LeadActivity = Tables<'lead_activities'> & {
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
};

export type ActionData = {
  // stage_changed
  from_stage_id?: string;
  to_stage_id?: string;
  // field_updated
  field?: string;
  from?: string | null;
  to?: string | null;
  // assignee changes
  user_id?: string;
  // comment_added
  comment_id?: string;
};

export function useLeadActivities(leadId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['lead-activities', leadId];

  // Fetch activities with user profiles
  const { data: activities = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for activities
      if (data.length === 0) return [];

      const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))] as string[];
      
      if (userIds.length === 0) return data as LeadActivity[];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(activity => ({
        ...activity,
        profile: activity.user_id ? profileMap.get(activity.user_id) || null : null,
      })) as LeadActivity[];
    },
    enabled: !!leadId,
    staleTime: 30_000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`lead-activities-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_activities',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          // Refetch on new activity
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient, queryKey]);

  return {
    activities,
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
