import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ScheduledReport = Tables<'scheduled_reports'>;
type ScheduledReportInsert = TablesInsert<'scheduled_reports'>;

export const useScheduledReports = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error('Error fetching scheduled reports:', error);
      toast({
        title: 'Error fetching reports',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (report: Omit<ScheduledReportInsert, 'created_by'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          ...report,
          user_id: user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Report scheduled',
        description: 'Your scheduled report has been created successfully.',
      });

      await fetchReports();
      return data;
    } catch (error: any) {
      console.error('Error creating scheduled report:', error);
      toast({
        title: 'Error creating report',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateReport = async (id: string, updates: Partial<ScheduledReportInsert>) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Report updated',
        description: 'Your scheduled report has been updated successfully.',
      });

      await fetchReports();
    } catch (error: any) {
      console.error('Error updating scheduled report:', error);
      toast({
        title: 'Error updating report',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Report deleted',
        description: 'Your scheduled report has been deleted successfully.',
      });

      await fetchReports();
    } catch (error: any) {
      console.error('Error deleting scheduled report:', error);
      toast({
        title: 'Error deleting report',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await updateReport(id, { active });
  };

  useEffect(() => {
    fetchReports();

    // Set up real-time subscription
    const channel = supabase
      .channel('scheduled_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_reports',
          filter: `org_id=eq.${currentOrg?.id}`,
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg?.id]);

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    toggleActive,
    refetch: fetchReports,
  };
};
