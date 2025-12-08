import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ScheduledReport = Tables<'scheduled_reports'>;
type ScheduledReportInsert = TablesInsert<'scheduled_reports'>;

/**
 * Hook for managing scheduled analytics reports.
 * Reports are automatically emailed to recipients on a schedule.
 * 
 * @returns {Object} Scheduled report management methods and state
 * @returns {ScheduledReport[]} reports - List of scheduled reports
 * @returns {boolean} loading - Loading state
 * @returns {Function} createReport - Create a new scheduled report
 * @returns {Function} updateReport - Update an existing report
 * @returns {Function} deleteReport - Delete a report
 * @returns {Function} toggleReportStatus - Toggle report active status
 * @returns {Function} refetch - Manually refresh reports list
 */
export const useScheduledReports = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: unknown) {
      logger.error('Error fetching scheduled reports:', error);
      toast.error('Error fetching reports', {
        description: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const createReport = async (report: Omit<ScheduledReportInsert, 'created_by' | 'user_id'>) => {
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

      toast.success('Report scheduled', {
        description: 'Your scheduled report has been created successfully.',
      });

      await fetchReports();
      return data;
    } catch (error: unknown) {
      logger.error('Error creating scheduled report:', error);
      toast.error('Error creating report', {
        description: getErrorMessage(error),
      });
    }
  };

  const updateReport = async (id: string, updates: Partial<Omit<ScheduledReportInsert, 'created_by'>>) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Report updated', {
        description: 'Your scheduled report has been updated successfully.',
      });

      await fetchReports();
      return data;
    } catch (error: unknown) {
      logger.error('Error updating scheduled report:', error);
      toast.error('Error updating report', {
        description: getErrorMessage(error),
      });
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Report deleted', {
        description: 'Your scheduled report has been deleted successfully.',
      });

      await fetchReports();
    } catch (error: unknown) {
      logger.error('Error deleting scheduled report:', error);
      toast.error('Error deleting report', {
        description: getErrorMessage(error),
      });
    }
  };

  const toggleReportStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback per row)

      await fetchReports();
    } catch (error: unknown) {
      logger.error('Error toggling report status:', error);
      toast.error('Error updating status', {
        description: getErrorMessage(error),
      });
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('scheduled_reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_reports',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    toggleReportStatus,
    refetch: fetchReports,
  };
};
