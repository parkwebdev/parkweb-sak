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

// For now, return mock data until the requests table is properly set up
  const mockRequests: Request[] = [
    {
      id: "1",
      title: "Update homepage banner",
      description: "Change the main banner image and text",
      status: "to_do",
      priority: "high",
      client_name: "Acme Corp",
      client_email: "contact@acmecorp.com",
      company_name: "Acme Corp",
      website_name: "Acme Corp Website",
      website_url: "https://acmecorp.com",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      user_id: "user-1",
      assigned_to: "John Doe"
    },
    {
      id: "2", 
      title: "Fix contact form",
      description: "Contact form not sending emails properly",
      status: "in_progress",
      priority: "urgent",
      client_name: "Tech Solutions",
      client_email: "support@techsolutions.com",
      company_name: "Tech Solutions",
      website_name: "Tech Solutions",
      website_url: "https://techsolutions.com",
      created_at: "2024-01-14T10:00:00Z",
      updated_at: "2024-01-14T10:00:00Z",
      user_id: "user-1",
      assigned_to: "John Doe"
    },
    {
      id: "3",
      title: "Add new product page",
      description: "Create a dedicated page for the new product line",
      status: "on_hold",
      priority: "medium",
      client_name: "StartupXYZ",
      client_email: "info@startupxyz.com",
      company_name: "StartupXYZ",
      website_name: "StartupXYZ",
      website_url: "https://startupxyz.com",
      created_at: "2024-01-13T10:00:00Z",
      updated_at: "2024-01-13T10:00:00Z",
      user_id: "user-1",
      assigned_to: "Jane Smith"
    },
    {
      id: "4",
      title: "Update company logo",
      description: "Replace old logo across all pages",
      status: "completed",
      priority: "low",
      client_name: "Global Inc",
      client_email: "admin@globalinc.com",
      company_name: "Global Inc",
      website_name: "Global Inc",
      website_url: "https://globalinc.com",
      created_at: "2024-01-12T10:00:00Z",
      updated_at: "2024-01-12T10:00:00Z",
      user_id: "user-1",
      assigned_to: "Mike Johnson"
    }
  ];

  const fetchRequests = async () => {
    try {
      // For now, use mock data since the requests table doesn't exist in types yet
      setRequests(mockRequests);
      /*
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      */
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
      // For now, update in memory since requests table doesn't exist in types yet
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

      /*
      const { error } = await supabase
        .from('requests')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : { completed_at: null })
        })
        .eq('id', id);

      if (error) throw error;
      */

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
      // For now, update in memory since requests table doesn't exist in types yet
      setRequests(prev => 
        prev.map(request => 
          request.id === id 
            ? { ...request, priority, updated_at: new Date().toISOString() }
            : request
        )
      );

      /*
      const { error } = await supabase
        .from('requests')
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      */

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
  }, []);

  return {
    requests,
    loading,
    updateRequestStatus,
    updateRequestPriority,
    refetch: fetchRequests
  };
};