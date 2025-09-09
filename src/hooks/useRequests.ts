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
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          profiles!fk_requests_assigned_to_profiles(display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to include assigned_to_name
      const requestsWithNames = (data || []).map(request => ({
        ...request,
        assigned_to_name: request.profiles?.display_name || null
      }));
      
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
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new as Request, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev =>
              prev.map(request =>
                request.id === payload.new.id ? payload.new as Request : request
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev =>
              prev.filter(request => request.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    requests,
    loading,
    updateRequestStatus,
    updateRequestPriority,
    refetch: fetchRequests
  };
};