import { useSecurityLog } from '@/hooks/useSecurityLog';
import { performanceMonitor } from '@/utils/performance-monitor';
import { logger } from '@/utils/logger';

/**
 * Enhanced security logging hook with performance monitoring
 * Provides comprehensive audit trails for security-sensitive operations
 */
export const useSecurityLogging = () => {
  const { 
    logSecurityEvent, 
    logAuthEvent, 
    logDataAccess, 
    logRoleChange, 
    logSuspiciousActivity 
  } = useSecurityLog();

  // Enhanced auth logging with performance monitoring
  const logAuthEventWithMetrics = (
    action: 'login' | 'logout' | 'signup' | 'password_change', 
    success: boolean, 
    details?: Record<string, any>
  ) => {
    const timer = performanceMonitor.startTiming(`auth_${action}`, { success, ...details });
    
    logAuthEvent(action, success, {
      ...details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    timer.end();
    
    if (!success) {
      logger.warn(`Failed authentication attempt: ${action}`, details);
    } else {
      logger.info(`Successful authentication: ${action}`, details);
    }
  };

  // Enhanced data access logging with context
  const logDataAccessWithContext = (
    resourceType: string, 
    resourceId: string, 
    action: 'read' | 'create' | 'update' | 'delete', 
    success: boolean = true,
    context?: Record<string, any>
  ) => {
    const timer = performanceMonitor.startTiming(`data_${action}_${resourceType}`, { 
      resourceId, 
      success, 
      ...context 
    });

    logDataAccess(resourceType, resourceId, action, success);

    timer.end();

    if (!success) {
      logger.error(`Failed data access: ${action} ${resourceType}`, { resourceId, ...context });
    }
  };

  // Log file operations with security context
  const logFileOperation = (
    operation: 'upload' | 'download' | 'delete',
    fileName: string,
    fileType: string,
    success: boolean,
    context?: Record<string, any>
  ) => {
    logSecurityEvent({
      action: `file_${operation}`,
      resourceType: 'file',
      resourceId: fileName,
      success,
      details: {
        fileName,
        fileType,
        timestamp: new Date().toISOString(),
        ...context
      }
    });

    if (!success) {
      logger.error(`File operation failed: ${operation} ${fileName}`, { fileType, ...context });
    }
  };

  // Log admin operations with enhanced details
  const logAdminOperation = (
    operation: string,
    targetResource: string,
    targetId: string,
    success: boolean,
    details?: Record<string, any>
  ) => {
    logSecurityEvent({
      action: `admin_${operation}`,
      resourceType: targetResource,
      resourceId: targetId,
      success,
      details: {
        operation,
        timestamp: new Date().toISOString(),
        ...details
      }
    });

    logger.info(`Admin operation: ${operation} on ${targetResource}`, { targetId, success, ...details });
  };

  // Log potential security threats
  const logSecurityThreat = (
    threatType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ) => {
    logSuspiciousActivity(threatType, {
      severity,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...details
    });

    logger.error(`Security threat detected: ${threatType}`, { severity, ...details });
  };

  return {
    logAuthEvent: logAuthEventWithMetrics,
    logDataAccess: logDataAccessWithContext,
    logFileOperation,
    logAdminOperation,
    logSecurityThreat,
    logRoleChange,
    // Original methods for backward compatibility
    logSecurityEvent,
    logSuspiciousActivity
  };
};