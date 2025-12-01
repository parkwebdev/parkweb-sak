import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';

interface SecurityLogParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  success?: boolean;
  details?: Record<string, any>;
}

export const useSecurityLog = () => {
  const { user } = useAuth();

  const logSecurityEvent = async (params: SecurityLogParams) => {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: user?.id || null,
        p_action: params.action,
        p_resource_type: params.resourceType,
        p_resource_id: params.resourceId || null,
        p_success: params.success ?? true,
        p_details: params.details || {}
      });

      if (error) {
        console.error('Failed to log security event:', error);
        // Don't show error to user as this is background logging
      }
    } catch (error) {
      console.error('Security logging error:', error);
    }
  };

  const logAuthEvent = (action: 'login' | 'logout' | 'signup' | 'password_change', success: boolean, details?: Record<string, any>) => {
    logSecurityEvent({
      action,
      resourceType: 'auth',
      success,
      details
    });
  };

  const logDataAccess = (resourceType: string, resourceId: string, action: 'read' | 'create' | 'update' | 'delete', success: boolean = true) => {
    logSecurityEvent({
      action: `data_${action}`,
      resourceType,
      resourceId,
      success
    });
  };

  const logRoleChange = (targetUserId: string, oldRole: string, newRole: string, success: boolean = true) => {
    logSecurityEvent({
      action: 'role_change',
      resourceType: 'user_role',
      resourceId: targetUserId,
      success,
      details: { oldRole, newRole }
    });
  };

  const logSuspiciousActivity = (action: string, details: Record<string, any>) => {
    logSecurityEvent({
      action: `suspicious_${action}`,
      resourceType: 'security',
      success: false,
      details
    });
  };

  return {
    logSecurityEvent,
    logAuthEvent,
    logDataAccess,
    logRoleChange,
    logSuspiciousActivity
  };
};