/**
 * Hook for fetching audit logs
 * 
 * @module hooks/admin/useAdminAuditLog
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import type { AuditLogEntry, AuditLogFilters, AuditAction, AuditTargetType } from '@/types/admin';

interface UseAdminAuditLogOptions extends Partial<AuditLogFilters> {
  page?: number;
  pageSize?: number;
}

interface UseAdminAuditLogResult {
  entries: AuditLogEntry[];
  totalCount: number;
  loading: boolean;
  error: Error | null;
}

export function useAdminAuditLog(options: UseAdminAuditLogOptions = {}): UseAdminAuditLogResult {
  const {
    action,
    adminUserId,
    targetType,
    dateRange,
    search = '',
    page = 1,
    pageSize = 50,
  } = options;

  const filters: Partial<AuditLogFilters> = { action, adminUserId, targetType, search };

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.audit.list(filters, page, pageSize),
    queryFn: async () => {
      let query = supabase
        .from('admin_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (action) {
        query = query.eq('action', action);
      }
      if (adminUserId) {
        query = query.eq('admin_user_id', adminUserId);
      }
      if (targetType) {
        query = query.eq('target_type', targetType);
      }
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }
      if (search) {
        query = query.or(`target_email.ilike.%${search}%,target_id.ilike.%${search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: logs, error: logsError, count } = await query;

      if (logsError) throw logsError;

      // Get admin user details
      const adminUserIds = [...new Set((logs || []).map((l) => l.admin_user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', adminUserIds);

      const entries: AuditLogEntry[] = (logs || []).map((log) => {
        const adminProfile = profiles?.find((p) => p.user_id === log.admin_user_id);
        return {
          id: log.id,
          admin_user_id: log.admin_user_id,
          admin_email: adminProfile?.email || '',
          admin_name: adminProfile?.display_name ?? null,
          action: log.action as AuditAction,
          target_type: log.target_type as AuditTargetType | null,
          target_id: log.target_id,
          target_email: log.target_email,
          details: (log.details as Record<string, unknown>) || {},
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: log.created_at || '',
        };
      });

      return {
        entries,
        totalCount: count || 0,
      };
    },
    staleTime: 30000,
  });

  return {
    entries: data?.entries || [],
    totalCount: data?.totalCount || 0,
    loading: isLoading,
    error: error as Error | null,
  };
}
