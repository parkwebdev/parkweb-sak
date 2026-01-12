/**
 * Hook for logging admin actions
 * 
 * @module hooks/admin/useAuditAction
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AuditAction, AuditTargetType } from '@/types/admin';
import type { Database } from '@/integrations/supabase/types';

type AuditLogInsert = Database['public']['Tables']['admin_audit_log']['Insert'];

interface AuditActionParams {
  action: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
}

interface UseAuditActionResult {
  logAction: (params: AuditActionParams) => Promise<void>;
  isLogging: boolean;
}

export function useAuditAction(): UseAuditActionResult {
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (params: AuditActionParams) => {
      if (!user) throw new Error('Not authenticated');

      const insertData: AuditLogInsert = {
        admin_user_id: user.id,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        target_email: params.targetEmail,
        details: (params.details || {}) as AuditLogInsert['details'],
      };

      const { error } = await supabase.from('admin_audit_log').insert(insertData);

      if (error) throw error;
    },
  });

  return {
    logAction: mutation.mutateAsync,
    isLogging: mutation.isPending,
  };
}
