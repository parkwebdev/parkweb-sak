/**
 * Hook for fetching lead activities with real-time subscriptions.
 * 
 * @module hooks/useLeadActivities
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
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
  // field_updated & status_changed
  field?: string;
  from?: string | null;
  to?: string | null;
  // assignee changes
  user_id?: string;
  // tag changes
  tag?: string;
};

export type AssigneeProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function useLeadActivities(leadId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.leadActivities.list(leadId ?? '');

  // Fetch activities with user profiles
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!leadId) return { activities: [] as LeadActivity[], assigneeProfiles: new Map<string, AssigneeProfile>() };

      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          id,
          lead_id,
          action_type,
          action_data,
          user_id,
          created_at
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data.length === 0) return { activities: [] as LeadActivity[], assigneeProfiles: new Map<string, AssigneeProfile>() };

      // Collect all user IDs - both activity actors and assignee targets
      const actorUserIds = data.map(a => a.user_id).filter(Boolean) as string[];
      const assigneeUserIds = data
        .filter(a => a.action_type === 'assignee_added' || a.action_type === 'assignee_removed')
        .map(a => (a.action_data as ActionData)?.user_id)
        .filter(Boolean) as string[];
      
      const allUserIds = [...new Set([...actorUserIds, ...assigneeUserIds])];
      
      if (allUserIds.length === 0) {
        return { 
          activities: data as LeadActivity[], 
          assigneeProfiles: new Map<string, AssigneeProfile>() 
        };
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Create assignee profiles map
      const assigneeProfilesMap = new Map<string, AssigneeProfile>();
      profiles?.forEach(p => {
        assigneeProfilesMap.set(p.user_id, p);
      });

      const activitiesWithProfiles = data.map(activity => ({
        ...activity,
        profile: activity.user_id ? profileMap.get(activity.user_id) || null : null,
      })) as LeadActivity[];

      return { activities: activitiesWithProfiles, assigneeProfiles: assigneeProfilesMap };
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
    activities: data?.activities ?? [],
    assigneeProfiles: data?.assigneeProfiles ?? new Map<string, AssigneeProfile>(),
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  };
}
