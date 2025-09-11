import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ClientFolder } from './useClients';

export const useFolders = () => {
  const [folders, setFolders] = useState<ClientFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFolders = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('client_folders')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "Failed to load folders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string, description?: string, color: string = '#6366f1') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('client_folders')
        .insert({
          user_id: user.user.id,
          name: name.trim(),
          description: description?.trim() || null,
          color
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      
      toast({
        title: "Success",
        description: "Folder created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error", 
        description: "Failed to create folder",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateFolder = async (id: string, updates: Partial<Pick<ClientFolder, 'name' | 'description' | 'color'>>) => {
    try {
      const { data, error } = await supabase
        .from('client_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => prev.map(folder => 
        folder.id === id ? { ...folder, ...data } : folder
      ));

      toast({
        title: "Success",
        description: "Folder updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      // First, remove all client assignments from this folder
      const { error: assignmentError } = await supabase
        .from('client_folder_assignments')
        .delete()
        .eq('folder_id', id);

      if (assignmentError) throw assignmentError;

      // Then delete the folder
      const { error } = await supabase
        .from('client_folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders(prev => prev.filter(folder => folder.id !== id));

      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
      throw error;
    }
  };

  const assignClientToFolder = async (clientEmail: string, folderId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      // Remove existing assignment if any
      await supabase
        .from('client_folder_assignments')
        .delete()
        .eq('client_email', clientEmail);

      // Create new assignment
      const { error } = await supabase
        .from('client_folder_assignments')
        .insert({
          client_email: clientEmail,
          folder_id: folderId,
          assigned_by: user.user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client assigned to folder successfully",
      });
    } catch (error) {
      console.error('Error assigning client to folder:', error);
      toast({
        title: "Error",
        description: "Failed to assign client to folder",
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeClientFromFolder = async (clientEmail: string) => {
    try {
      const { error } = await supabase
        .from('client_folder_assignments')
        .delete()
        .eq('client_email', clientEmail);

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Client removed from folder successfully",
      });
    } catch (error) {
      console.error('Error removing client from folder:', error);
      toast({
        title: "Error",
        description: "Failed to remove client from folder",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchFolders();

    // Set up real-time subscription for folder changes
    const subscription = supabase
      .channel('folders-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'client_folders' },
        () => fetchFolders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    assignClientToFolder,
    removeClientFromFolder,
    refetch: fetchFolders
  };
};