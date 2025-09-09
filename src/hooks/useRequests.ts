import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Request {
  id: string;
  title: string;
  description: string;
  status: 'to_do' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_name: string;
  client_email: string;
  company_name: string;
  website_name?: string;
  website_url?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_avatar?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      // First get all requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Get unique assigned_to IDs to fetch profiles
      const assignedToIds = [...new Set(requestsData?.map(r => r.assigned_to).filter(Boolean) || [])];
      
      let profilesData: any[] = [];
      if (assignedToIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', assignedToIds);
          
        if (profilesError) throw profilesError;
        profilesData = profiles || [];
      }

      // Map the data to include assigned_to_name and avatar
      const requestsWithNames = (requestsData || []).map(request => {
        const profile = profilesData.find(p => p.user_id === request.assigned_to);
        return {
          ...request,
          assigned_to_name: profile?.display_name || null,
          assigned_to_avatar: profile?.avatar_url || null
        };
      });
      
      setRequests(requestsWithNames);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string, status: Request['status']) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : { completed_at: null })
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state immediately for better UX
      setRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { 
                ...request, 
                status, 
                updated_at: new Date().toISOString(),
                ...(status === 'completed' ? { completed_at: new Date().toISOString() } : { completed_at: null })
              }
            : request
        )
      );

      toast({
        title: "Status Updated",
        description: `Request status changed to ${status.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const updateRequestPriority = async (id: string, priority: Request['priority']) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state immediately for better UX
      setRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { ...request, priority, updated_at: new Date().toISOString() }
            : request
        )
      );

      toast({
        title: "Priority Updated",
        description: `Request priority changed to ${priority}`,
      });
    } catch (error) {
      console.error('Error updating request priority:', error);
      toast({
        title: "Error", 
        description: "Failed to update request priority",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRequests();

    // Set up real-time subscription for changes
    const channel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests'
        },
        () => {
          // Refetch data to ensure profile information is included
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRequests(prev => prev.filter(request => request.id !== id));
      
      toast({
        title: "Request Deleted",
        description: "Request has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    }
  };

  return {
    requests,
    loading,
    updateRequestStatus,
    updateRequestPriority,
    deleteRequest,
    refetch: fetchRequests
  };
};