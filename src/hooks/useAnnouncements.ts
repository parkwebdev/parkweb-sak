/**
 * useAnnouncements Hook
 * 
 * Hook for managing widget announcement banners.
 * Announcements appear as cards in the widget home view.
 * 
 * Now uses React Query for caching and real-time updates via useSupabaseQuery.
 * 
 * @module hooks/useAnnouncements
 */

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { deleteAnnouncementImage } from '@/lib/announcement-image-upload';
import { useSupabaseQuery } from './useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Announcement = Tables<'announcements'>;
export type AnnouncementInsert = TablesInsert<'announcements'>;
export type AnnouncementUpdate = TablesUpdate<'announcements'>;

/**
 * Hook for managing widget announcement banners.
 * 
 * @param {string} agentId - Agent ID to scope announcements
 * @returns {Object} Announcement management methods and state
 */
export const useAnnouncements = (agentId: string) => {
  const queryClient = useQueryClient();

  // Fetch announcements using React Query with real-time subscription
  const { data: announcements = [], isLoading: loading, refetch } = useSupabaseQuery<Announcement[]>({
    queryKey: queryKeys.announcements.list(agentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    realtime: {
      table: 'announcements',
      filter: `agent_id=eq.${agentId}`,
    },
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Helper to optimistically update announcements
  const optimisticUpdate = (updater: (prev: Announcement[]) => Announcement[]) => {
    queryClient.setQueryData<Announcement[]>(
      queryKeys.announcements.list(agentId),
      (prev) => updater(prev || [])
    );
  };

  const addAnnouncement = async (announcement: AnnouncementInsert) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcement)
        .select()
        .single();

      if (error) throw error;
      
      optimisticUpdate((prev) => [...prev, data]);
      toast.success('Announcement created');
      return data;
    } catch (error) {
      logger.error('Error adding announcement', error);
      toast.error('Failed to create announcement', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const updateAnnouncement = async (id: string, updates: AnnouncementUpdate) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      optimisticUpdate((prev) => prev.map(a => a.id === id ? data : a));
      toast.success('Announcement updated');
      return data;
    } catch (error) {
      logger.error('Error updating announcement', error);
      toast.error('Failed to update announcement', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const announcement = announcements.find(a => a.id === id);
      
      if (announcement?.image_url) {
        await deleteAnnouncementImage(announcement.image_url);
      }
      
      optimisticUpdate((prev) => prev.filter(a => a.id !== id));
      
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        await refetch();
        throw error;
      }
      
      toast.success('Announcement deleted');
    } catch (error) {
      logger.error('Error deleting announcement', error);
      toast.error('Failed to delete announcement', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  const reorderAnnouncements = async (reorderedAnnouncements: Announcement[]) => {
    try {
      // Optimistic update first
      optimisticUpdate(() => reorderedAnnouncements);

      // Batch update using Promise.all instead of sequential
      const updates = reorderedAnnouncements.map((announcement, index) =>
        supabase
          .from('announcements')
          .update({ order_index: index })
          .eq('id', announcement.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        await refetch();
        throw errors[0].error;
      }
      // Success - no toast needed (SavedIndicator shows feedback)
    } catch (error) {
      logger.error('Error reordering announcements', error);
      toast.error('Failed to update order', {
        description: getErrorMessage(error),
      });
      throw error;
    }
  };

  return {
    announcements,
    loading,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    reorderAnnouncements,
    refetch,
  };
};
