/**
 * useSecurityLog Hook
 * 
 * Provides methods for logging security-related events.
 * Uses database RPC function to securely record actions.
 * Provides type-specific logging helpers for common operations.
 * 
 * @module hooks/useSecurityLog
 * 
 * @example
 * ```tsx
 * const { logSecurityEvent, logAuthEvent, logDataAccess } = useSecurityLog();
 * 
 * // Log a custom event
 * logSecurityEvent({
 *   action: 'api_key_created',
 *   resourceType: 'api_key',
 *   resourceId: keyId,
 *   success: true,
 *   details: { keyName: 'Production Key' }
 * });
 * ```
 */

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

/** Details for security event logging */
export interface SecurityEventDetails {
  /** Old role value (for role changes) */
  oldRole?: string;
  /** New role value (for role changes) */
  newRole?: string;
  /** IP address of the request */
  ipAddress?: string;
  /** User agent string */
  userAgent?: string;
  /** Additional context information */
  context?: string;
  /** Error message if operation failed */
  error?: string;
  /** Allow additional properties for flexibility */
  [key: string]: string | number | boolean | undefined;
}

interface SecurityLogParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  success?: boolean;
  details?: SecurityEventDetails;
}

/**
 * Hook for logging security events.
 * Uses database RPC function to securely record actions.
 * 
 * @returns {Object} Security logging methods
 * @returns {Function} logSecurityEvent - Generic security event logger
 * @returns {Function} logAuthEvent - Log authentication events
 * @returns {Function} logDataAccess - Log data access events
 * @returns {Function} logRoleChange - Log role change events
 * @returns {Function} logSuspiciousActivity - Log suspicious activity
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
    } catch (error: unknown) {
      logger.error('Security logging error:', error);
    }
  };

  const logAuthEvent = (
    action: 'login' | 'logout' | 'signup' | 'password_change',
    success: boolean,
    details?: SecurityEventDetails
  ) => {
    logSecurityEvent({
      action,
      resourceType: 'auth',
      success,
      details
    });
  };

  const logDataAccess = (
    resourceType: string,
    resourceId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    success: boolean = true
  ) => {
    logSecurityEvent({
      action: `data_${action}`,
      resourceType,
      resourceId,
      success
    });
  };

  const logRoleChange = (
    targetUserId: string,
    oldRole: string,
    newRole: string,
    success: boolean = true
  ) => {
    logSecurityEvent({
      action: 'role_change',
      resourceType: 'user_role',
      resourceId: targetUserId,
      success,
      details: { oldRole, newRole }
    });
  };

  const logSuspiciousActivity = (action: string, details: SecurityEventDetails) => {
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
