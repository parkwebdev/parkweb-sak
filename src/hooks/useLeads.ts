import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Tables } from '@/integrations/supabase/types';

type Lead = Tables<'leads'> & {
  conversations?: { id: string; created_at: string };
};

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentOrg } = useOrganization();

  const fetchLeads = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*, conversations(id, created_at)')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching leads',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: Partial<Tables<'leads'>>) => {
    if (!currentOrg) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, org_id: currentOrg.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Lead created',
        description: 'Lead has been created successfully',
      });

      fetchLeads();
      return data;
    } catch (error: any) {
      toast({
        title: 'Error creating lead',
        description: error.message,
        variant: 'destructive',
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

      toast({
        title: 'Lead updated',
        description: 'Lead has been updated successfully',
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Error updating lead',
        description: error.message,
        variant: 'destructive',
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

      toast({
        title: 'Lead deleted',
        description: 'Lead has been deleted successfully',
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: 'Error deleting lead',
        description: error.message,
        variant: 'destructive',
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
          filter: `org_id=eq.${currentOrg?.id}`,
        },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg?.id]);

  return {
    leads,
    loading,
    createLead,
    updateLead,
    deleteLead,
    refetch: fetchLeads,
  };
};
