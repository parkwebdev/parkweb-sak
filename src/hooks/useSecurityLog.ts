import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';

interface SecurityLogParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  success?: boolean;
  details?: Record<string, any>;
}

/**
 * Hook for logging security events.
 * Uses database RPC function to securely record actions.
 * Provides type-specific logging helpers for common operations.
 * 
 * @returns {Object} Security logging methods
 * @returns {Function} logSecurityEvent - Generic security event logger
 * @returns {Function} logAgentEvent - Log agent-related events
 * @returns {Function} logConversationEvent - Log conversation-related events
 * @returns {Function} logLeadEvent - Log lead-related events
 * @returns {Function} logTeamEvent - Log team-related events
 * @returns {Function} logSettingsEvent - Log settings-related events
 */
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
        logger.error('Failed to log security event:', error);
        // Don't show error to user as this is background logging
      }
    } catch (error) {
      logger.error('Security logging error:', error);
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