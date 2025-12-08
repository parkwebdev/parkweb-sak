import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { deleteAnnouncementImage } from '@/lib/announcement-image-upload';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Announcement = Tables<'announcements'>;
export type AnnouncementInsert = TablesInsert<'announcements'>;
export type AnnouncementUpdate = TablesUpdate<'announcements'>;

export const useAnnouncements = (agentId: string) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('agent_id', agentId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      logger.error('Error fetching announcements', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchAnnouncements();
    }
  }, [agentId]);

  const addAnnouncement = async (announcement: AnnouncementInsert) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert(announcement)
        .select()
        .single();

      if (error) throw error;
      
      setAnnouncements(prev => [...prev, data]);
      toast.success('Announcement created');
      return data;
    } catch (error) {
      logger.error('Error adding announcement', error);
      toast.error('Failed to create announcement');
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
      
      setAnnouncements(prev => prev.map(a => a.id === id ? data : a));
      toast.success('Announcement updated');
      return data;
    } catch (error) {
      logger.error('Error updating announcement', error);
      toast.error('Failed to update announcement');
      throw error;
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      // Find the announcement to get its image_url for cleanup
      const announcement = announcements.find(a => a.id === id);
      
      // Delete image from storage if exists
      if (announcement?.image_url) {
        await deleteAnnouncementImage(announcement.image_url);
      }
      
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch (error) {
      logger.error('Error deleting announcement', error);
      toast.error('Failed to delete announcement');
      throw error;
    }
  };

  const reorderAnnouncements = async (reorderedAnnouncements: Announcement[]) => {
    try {
      const updates = reorderedAnnouncements.map((announcement, index) => ({
        id: announcement.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from('announcements')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      setAnnouncements(reorderedAnnouncements);
      // Success - no toast needed (SavedIndicator shows feedback)
    } catch (error) {
      logger.error('Error reordering announcements', error);
      toast.error('Failed to update order');
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
    refetch: fetchAnnouncements,
  };
};
