/**
 * Hook for fetching related audit activity for a target
 * 
 * @module hooks/admin/useRelatedAuditActivity
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { VIEW_ONLY_ACTIONS } from '@/lib/admin/audit-actions';
import type { AuditLogEntry } from '@/types/admin';

interface UseRelatedAuditActivityOptions {
  /** The target ID to find related activity for */
  targetId: string | null;
  /** The target type (account, plan, etc.) */
  targetType: string | null;
  /** The entry ID to exclude from results */
  excludeEntryId: string;
}

interface UseRelatedAuditActivityResult {
  /** Related audit entries */
  entries: AuditLogEntry[];
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
}

/**
 * Fetches related audit log entries for the same target,
 * excluding view-only actions and the current entry.
 */
export function useRelatedAuditActivity({
  targetId,
  targetType,
  excludeEntryId,
}: UseRelatedAuditActivityOptions): UseRelatedAuditActivityResult {
  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.audit.relatedActivity(targetId ?? '', targetType),
    queryFn: async () => {
      if (!targetId) return [];

      // Build query for related entries
      let query = supabase
        .from('admin_audit_log')
        .select('id, admin_user_id, action, target_type, target_id, target_email, details, ip_address, user_agent, created_at')
        .eq('target_id', targetId)
        .neq('id', excludeEntryId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Filter by target type if present
      if (targetType) {
        query = query.eq('target_type', targetType);
      }

      // Exclude view-only actions
      if (VIEW_ONLY_ACTIONS.length > 0) {
        query = query.not('action', 'in', `(${VIEW_ONLY_ACTIONS.join(',')})`);
      }

      const { data: logs, error: logsError } = await query;

      if (logsError) throw logsError;
      if (!logs || logs.length === 0) return [];

      // Get unique admin user IDs
      const adminUserIds = [...new Set(logs.map(log => log.admin_user_id))];

      // Fetch admin profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', adminUserIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, p]) ?? []
      );

      // Transform to AuditLogEntry format
      return logs.map(log => {
        const profile = profileMap.get(log.admin_user_id);
        return {
          id: log.id,
          action: log.action,
          admin_user_id: log.admin_user_id,
          admin_name: profile?.display_name ?? null,
          admin_email: profile?.email ?? log.admin_user_id,
          target_id: log.target_id,
          target_type: log.target_type,
          target_email: log.target_email,
          details: log.details ?? {},
          ip_address: log.ip_address,
          user_agent: log.user_agent,
          created_at: log.created_at ?? new Date().toISOString(),
        } as AuditLogEntry;
      });
    },
    enabled: !!targetId,
    staleTime: 30_000, // 30 seconds
  });

  return {
    entries: data ?? [],
    loading: isLoading,
    error: error as Error | null,
  };
}
