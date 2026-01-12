/**
 * Hook for fetching email delivery logs
 * 
 * @module hooks/admin/useEmailDeliveryLogs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { EmailDeliveryLog, EmailDeliveryStats } from '@/types/admin';

interface UseEmailDeliveryLogsOptions {
  status?: string;
  page?: number;
  pageSize?: number;
}

interface UseEmailDeliveryLogsResult {
  logs: EmailDeliveryLog[];
  stats: EmailDeliveryStats;
  totalCount: number;
  loading: boolean;
  error: Error | null;
}

export function useEmailDeliveryLogs(
  options: UseEmailDeliveryLogsOptions = {}
): UseEmailDeliveryLogsResult {
  const { status, page = 1, pageSize = 50 } = options;

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.emails.deliveryLogs({ status, page, pageSize }),
    queryFn: async () => {
      // Fetch logs
      let query = supabase
        .from('email_delivery_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: logs, error: logsError, count } = await query;

      if (logsError) throw logsError;

      // Fetch stats
      const statsPromises = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'].map(
        async (s) => {
          const { count } = await supabase
            .from('email_delivery_logs')
            .select('id', { count: 'exact', head: true })
            .eq('status', s);
          return { status: s, count: count || 0 };
        }
      );

      const statResults = await Promise.all(statsPromises);
      
      const stats: EmailDeliveryStats = {
        total: count || 0,
        sent: statResults.find((s) => s.status === 'sent')?.count || 0,
        delivered: statResults.find((s) => s.status === 'delivered')?.count || 0,
        opened: statResults.find((s) => s.status === 'opened')?.count || 0,
        clicked: statResults.find((s) => s.status === 'clicked')?.count || 0,
        bounced: statResults.find((s) => s.status === 'bounced')?.count || 0,
        failed: statResults.find((s) => s.status === 'failed')?.count || 0,
      };

      return {
        logs: logs || [],
        stats,
        totalCount: count || 0,
      };
    },
    staleTime: 30000,
  });

  return {
    logs: data?.logs || [],
    stats: data?.stats || {
      total: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
    },
    totalCount: data?.totalCount || 0,
    loading: isLoading,
    error: error as Error | null,
  };
}
