import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'> & {
  conversations?: { id: string; created_at: string };
};

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLeads = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*, conversations(id, created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error('Error fetching leads', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: Partial<Tables<'leads'>>) => {
    if (!user?.id) return;

    try {
      const { data, error} = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Lead created', {
        description: 'Lead has been created successfully',
      });

      fetchLeads();
      return data;
    } catch (error: any) {
      toast.error('Error creating lead', {
        description: error.message,
      });
      throw error;
    }
  };

  const updateLead = async (id: string, updates: Partial<Tables<'leads'>>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback for status changes)
      fetchLeads();
    } catch (error: any) {
      toast.error('Error updating lead', {
        description: error.message,
      });
      throw error;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Lead deleted', {
        description: 'Lead has been deleted successfully',
      });

      fetchLeads();
    } catch (error: any) {
      toast.error('Error deleting lead', {
        description: error.message,
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchLeads();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    leads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    refetch: fetchLeads,
  };
};
