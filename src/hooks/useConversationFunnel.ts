/**
 * useConversationFunnel Hook
 * 
 * Fetches and computes conversation funnel data showing where users
 * drop off in the conversation journey: Started → Engaged → Lead Captured → Booked → Resolved
 * 
 * @module hooks/useConversationFunnel
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropOffPercent: number;
  color: string;
}

export interface ConversationFunnelData {
  stages: FunnelStage[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const STAGE_COLORS = {
  started: 'hsl(220, 90%, 56%)',
  engaged: 'hsl(200, 85%, 50%)',
  leadCaptured: 'hsl(160, 80%, 45%)',
  booked: 'hsl(142, 76%, 36%)',
  resolved: 'hsl(84, 60%, 45%)',
};

export function useConversationFunnel(
  startDate: Date,
  endDate: Date,
  enabled: boolean = true
): ConversationFunnelData {
  const { user } = useAuth();

  const conversationsQuery = useQuery({
    queryKey: ['conversation-funnel', 'conversations', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('id, status, created_at, messages:messages(count)')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const leadsQuery = useQuery({
    queryKey: ['conversation-funnel', 'leads', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, conversation_id, created_at')
        .not('conversation_id', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const bookingsQuery = useQuery({
    queryKey: ['conversation-funnel', 'bookings', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, conversation_id, created_at')
        .not('conversation_id', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const stages = useMemo<FunnelStage[]>(() => {
    const conversations = conversationsQuery.data || [];
    const leads = leadsQuery.data || [];
    const bookings = bookingsQuery.data || [];

    if (conversations.length === 0) return [];

    const conversationIdsWithLeads = new Set(leads.map(l => l.conversation_id));
    const conversationIdsWithBookings = new Set(bookings.map(b => b.conversation_id));

    const started = conversations.length;
    const engaged = conversations.filter(c => (c.messages?.[0]?.count || 0) >= 2).length;
    const leadCaptured = conversations.filter(c => conversationIdsWithLeads.has(c.id)).length;
    const booked = conversations.filter(c => conversationIdsWithBookings.has(c.id)).length;
    const resolved = conversations.filter(c => c.status === 'closed').length;

    return [
      { name: 'Started', count: started, percentage: 100, dropOffPercent: 0, color: STAGE_COLORS.started },
      { name: 'Engaged', count: engaged, percentage: started > 0 ? (engaged / started) * 100 : 0, dropOffPercent: started > 0 ? ((started - engaged) / started) * 100 : 0, color: STAGE_COLORS.engaged },
      { name: 'Lead Captured', count: leadCaptured, percentage: started > 0 ? (leadCaptured / started) * 100 : 0, dropOffPercent: engaged > 0 ? ((engaged - leadCaptured) / engaged) * 100 : 0, color: STAGE_COLORS.leadCaptured },
      { name: 'Booked', count: booked, percentage: started > 0 ? (booked / started) * 100 : 0, dropOffPercent: leadCaptured > 0 ? ((leadCaptured - booked) / leadCaptured) * 100 : 0, color: STAGE_COLORS.booked },
      { name: 'Resolved', count: resolved, percentage: started > 0 ? (resolved / started) * 100 : 0, dropOffPercent: 0, color: STAGE_COLORS.resolved },
    ];
  }, [conversationsQuery.data, leadsQuery.data, bookingsQuery.data]);

  const refetch = async () => {
    await Promise.all([conversationsQuery.refetch(), leadsQuery.refetch(), bookingsQuery.refetch()]);
  };

  return {
    stages,
    loading: conversationsQuery.isLoading || leadsQuery.isLoading || bookingsQuery.isLoading,
    refetch,
  };
}
