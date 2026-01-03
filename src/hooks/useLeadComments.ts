/**
 * Hook for managing lead comments with real-time subscriptions.
 * 
 * @module hooks/useLeadComments
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type LeadComment = Tables<'lead_comments'> & {
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
};

export function useLeadComments(leadId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['lead-comments', leadId];

  // Fetch comments with user profiles
  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for comments
      if (data.length === 0) return [];

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null,
      })) as LeadComment[];
    },
    enabled: !!leadId,
    staleTime: 30_000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!leadId) return;

    const channel = supabase
      .channel(`lead-comments-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_comments',
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          // Refetch on any change
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, queryClient, queryKey]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!leadId || !user) throw new Error('Missing lead or user');

      const { data, error } = await supabase
        .from('lead_comments')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate activities since a comment adds an activity
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('lead_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('lead_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    isAdding: addCommentMutation.isPending,
    isUpdating: updateCommentMutation.isPending,
    isDeleting: deleteCommentMutation.isPending,
  };
}
