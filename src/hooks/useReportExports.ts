/**
 * Report Exports Hook
 * 
 * Hook for managing report export history.
 * Handles fetching, creating, and deleting export records.
 * 
 * @module hooks/useReportExports
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAgent } from '@/hooks/useAgent';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { queryKeys } from '@/lib/query-keys';
import type { ReportConfig } from '@/components/analytics/ExportReportSheet';
import type { Json } from '@/integrations/supabase/types';

export interface ReportExport {
  id: string;
  user_id: string;
  agent_id: string | null;
  name: string;
  format: 'csv' | 'pdf';
  file_path: string;
  file_size: number | null;
  date_range_start: string;
  date_range_end: string;
  report_config: Json | null;
  created_at: string;
  created_by: string;
}

interface CreateExportParams {
  name: string;
  format: 'csv' | 'pdf';
  file: Blob;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  reportConfig: ReportConfig;
}

/**
 * Hook for managing report exports
 */
export const useReportExports = () => {
  const { user } = useAuth();
  const { agentId } = useAgent();
  const queryClient = useQueryClient();

  // Fetch all exports for the user
  const {
    data: exports = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.reportExports.list(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('report_exports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching report exports:', error);
        throw error;
      }

      return (data || []) as ReportExport[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create export mutation
  const createMutation = useMutation({
    mutationFn: async ({ name, format, file, dateRangeStart, dateRangeEnd, reportConfig }: CreateExportParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = format === 'csv' ? 'csv' : 'pdf';
      const fileName = `${name.replace(/[^a-zA-Z0-9-_]/g, '_')}_${timestamp}.${extension}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('report-exports')
        .upload(filePath, file, {
          contentType: format === 'csv' ? 'text/csv' : 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        logger.error('Error uploading report file:', uploadError);
        throw uploadError;
      }

      // Create database record
      const { data, error: insertError } = await supabase
        .from('report_exports')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          name,
          format,
          file_path: filePath,
          file_size: file.size,
          date_range_start: dateRangeStart.toISOString(),
          date_range_end: dateRangeEnd.toISOString(),
          report_config: reportConfig as unknown as Json,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating export record:', insertError);
        // Try to clean up the uploaded file
        await supabase.storage.from('report-exports').remove([filePath]);
        throw insertError;
      }

      return data as ReportExport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reportExports.list(user?.id ?? '') });
    },
    onError: (error) => {
      logger.error('Error creating export:', error);
      toast.error('Failed to save export');
    },
  });

  // Delete export mutation
  const deleteMutation = useMutation({
    mutationFn: async (exportId: string) => {
      // Find the export to get file path
      const exportToDelete = exports.find(e => e.id === exportId);
      if (!exportToDelete) throw new Error('Export not found');

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('report-exports')
        .remove([exportToDelete.file_path]);

      if (storageError) {
        logger.warn('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error } = await supabase
        .from('report_exports')
        .delete()
        .eq('id', exportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reportExports.list(user?.id ?? '') });
      toast.success('Export deleted');
    },
    onError: (error) => {
      logger.error('Error deleting export:', error);
      toast.error('Failed to delete export');
    },
  });

  // Get download URL for an export
  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('report-exports')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

    if (error) {
      logger.error('Error getting download URL:', error);
      toast.error('Failed to get download link');
      return null;
    }

    return data.signedUrl;
  };

  return {
    exports,
    loading: isLoading,
    refetch,
    createExport: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteExport: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    getDownloadUrl,
  };
};
