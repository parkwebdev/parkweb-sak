import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ScheduledReport = Tables<'scheduled_reports'>;
type ScheduledReportInsert = TablesInsert<'scheduled_reports'>;

/**
 * Hook for managing scheduled analytics reports.
 * Uses React Query for caching and real-time updates.
 * Reports are automatically emailed to recipients on a schedule.
 * 
 * @returns {Object} Scheduled report management methods and state
 */
export const useScheduledReports = () => {
  const { user } = useAuth();
  const { accountOwnerId, loading: ownerLoading } = useAccountOwnerId();
  const queryClient = useQueryClient();

  // Fetch reports with React Query (scoped to account owner)
  const { data: reports = [], isLoading: loading, refetch } = useSupabaseQuery<ScheduledReport[]>({
    queryKey: queryKeys.scheduledReports.list(accountOwnerId || ''),
    queryFn: async () => {
      if (!accountOwnerId) return [];
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', accountOwnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    realtime: {
      table: 'scheduled_reports',
      filter: accountOwnerId ? `user_id=eq.${accountOwnerId}` : undefined,
    },
    enabled: !!accountOwnerId && !ownerLoading,
    staleTime: 60000, // 1 minute
  });

  const invalidateReports = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.scheduledReports.all });
  }, [queryClient]);

  const createReport = useCallback(async (
    report: Omit<ScheduledReportInsert, 'created_by' | 'user_id'>
  ) => {
    if (!user || !accountOwnerId) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          ...report,
          user_id: accountOwnerId, // Scope to account owner
          created_by: user.id, // Track who actually created it
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Report scheduled', {
        description: 'Your scheduled report has been created successfully.',
      });

      await invalidateReports();
      return data;
    } catch (error: unknown) {
      logger.error('Error creating scheduled report:', error);
      toast.error('Error creating report', {
        description: getErrorMessage(error),
      });
    }
  }, [user, accountOwnerId, invalidateReports]);

  const updateReport = useCallback(async (
    id: string, 
    updates: Partial<Omit<ScheduledReportInsert, 'created_by'>>
  ) => {
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

      await invalidateReports();
      return data;
    } catch (error: unknown) {
      logger.error('Error updating scheduled report:', error);
      toast.error('Error updating report', {
        description: getErrorMessage(error),
      });
    }
  }, [invalidateReports]);

  const deleteReport = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Report deleted', {
        description: 'Your scheduled report has been deleted successfully.',
      });

      await invalidateReports();
    } catch (error: unknown) {
      logger.error('Error deleting scheduled report:', error);
      toast.error('Error deleting report', {
        description: getErrorMessage(error),
      });
    }
  }, [invalidateReports]);

  const toggleReportStatus = useCallback(async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ active })
        .eq('id', id);

      if (error) throw error;

      // Success - no toast needed (SavedIndicator shows feedback per row)
      await invalidateReports();
    } catch (error: unknown) {
      logger.error('Error toggling report status:', error);
      toast.error('Error updating status', {
        description: getErrorMessage(error),
      });
    }
  }, [invalidateReports]);

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    toggleReportStatus,
    refetch,
  };
};
