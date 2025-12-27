/**
 * Calendar Sync Utilities
 * 
 * Shared utility functions for calendar synchronization error handling,
 * status management, and webhook operations.
 * 
 * Part of Phase 6: Testing & Error Handling
 * 
 * @module lib/calendar-sync-utils
 * @verified Phase 6 Complete - December 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

/**
 * Calendar sync error types for consistent handling
 */
export type CalendarSyncErrorType = 
  | 'token_expired'
  | 'token_refresh_failed'
  | 'webhook_creation_failed'
  | 'webhook_expired'
  | 'api_error'
  | 'rate_limited'
  | 'network_error'
  | 'unknown';

/**
 * Parsed error information
 */
export interface CalendarSyncError {
  type: CalendarSyncErrorType;
  message: string;
  retryable: boolean;
  userAction?: string;
}

/**
 * Parses a sync error string into structured error info
 */
export function parseCalendarSyncError(errorString: string | null): CalendarSyncError | null {
  if (!errorString) return null;
  
  const lowerError = errorString.toLowerCase();
  
  if (lowerError.includes('token') && lowerError.includes('expired')) {
    return {
      type: 'token_expired',
      message: 'Calendar access token has expired',
      retryable: true,
      userAction: 'Try reconnecting your calendar',
    };
  }
  
  if (lowerError.includes('refresh') && lowerError.includes('failed')) {
    return {
      type: 'token_refresh_failed',
      message: 'Failed to refresh access token',
      retryable: false,
      userAction: 'Disconnect and reconnect your calendar',
    };
  }
  
  if (lowerError.includes('webhook') && lowerError.includes('failed')) {
    return {
      type: 'webhook_creation_failed',
      message: 'Failed to set up real-time sync',
      retryable: true,
      userAction: 'Click "Sync now" to retry',
    };
  }
  
  if (lowerError.includes('429') || lowerError.includes('rate limit')) {
    return {
      type: 'rate_limited',
      message: 'Too many requests - please wait',
      retryable: true,
      userAction: 'Wait a few minutes before retrying',
    };
  }
  
  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return {
      type: 'network_error',
      message: 'Network error occurred',
      retryable: true,
      userAction: 'Check your connection and retry',
    };
  }
  
  return {
    type: 'unknown',
    message: errorString,
    retryable: true,
    userAction: 'Try again or contact support',
  };
}

/**
 * Triggers a manual calendar sync for a connected account
 */
export async function triggerManualSync(accountId: string, provider: 'google_calendar' | 'outlook_calendar'): Promise<boolean> {
  try {
    const functionName = provider === 'google_calendar' 
      ? 'google-calendar-auth' 
      : 'outlook-calendar-auth';
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        action: 'sync',
        accountId,
      },
    });
    
    if (error) throw error;
    
    if (data?.success) {
      toast.success('Calendar synced successfully', {
        description: data.eventsUpdated 
          ? `${data.eventsUpdated} events updated`
          : undefined,
      });
      return true;
    }
    
    throw new Error(data?.error || 'Sync failed');
  } catch (error: unknown) {
    logger.error('Manual calendar sync failed:', error);
    toast.error('Sync failed', {
      description: getErrorMessage(error),
    });
    return false;
  }
}

/**
 * Tests webhook connectivity for a connected account
 */
export async function testWebhookConnection(
  accountId: string, 
  provider: 'google_calendar' | 'outlook_calendar'
): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  try {
    const functionName = provider === 'google_calendar'
      ? 'google-calendar-webhook'
      : 'outlook-calendar-webhook';
    
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        action: 'test',
        accountId,
      },
    });
    
    const latencyMs = Date.now() - startTime;
    
    if (error) throw error;
    
    if (data?.success) {
      toast.success('Webhook is working', {
        description: `Response time: ${latencyMs}ms`,
      });
      return { success: true, latencyMs };
    }
    
    throw new Error(data?.error || 'Test failed');
  } catch (error: unknown) {
    logger.error('Webhook test failed:', error);
    const message = getErrorMessage(error);
    toast.error('Webhook test failed', {
      description: message,
    });
    return { success: false, error: message };
  }
}

/**
 * Refreshes the webhook subscription for a connected account
 */
export async function refreshWebhookSubscription(
  accountId: string,
  provider: 'google_calendar' | 'outlook_calendar'
): Promise<boolean> {
  try {
    const functionName = provider === 'google_calendar'
      ? 'google-calendar-auth'
      : 'outlook-calendar-auth';
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        action: 'refresh-webhook',
        accountId,
      },
    });
    
    if (error) throw error;
    
    if (data?.success) {
      toast.success('Webhook renewed', {
        description: 'Real-time sync is now active',
      });
      return true;
    }
    
    throw new Error(data?.error || 'Webhook refresh failed');
  } catch (error: unknown) {
    logger.error('Webhook refresh failed:', error);
    toast.error('Failed to renew webhook', {
      description: getErrorMessage(error),
    });
    return false;
  }
}

/**
 * Clears the sync error for an account (used after successful operations)
 */
export async function clearSyncError(accountId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('connected_accounts')
      .update({ sync_error: null })
      .eq('id', accountId);
    
    if (error) throw error;
    return true;
  } catch (error: unknown) {
    logger.error('Failed to clear sync error:', error);
    return false;
  }
}

/**
 * Gets the appropriate error severity for UI display
 */
export function getErrorSeverity(error: CalendarSyncError): 'info' | 'warning' | 'error' {
  switch (error.type) {
    case 'rate_limited':
    case 'network_error':
      return 'warning';
    case 'token_refresh_failed':
    case 'api_error':
      return 'error';
    default:
      return 'warning';
  }
}

/**
 * Formats webhook expiration for display
 */
export function formatWebhookExpiration(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  
  const expires = new Date(expiresAt);
  const now = new Date();
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffMs < 0) {
    return 'Expired';
  }
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h remaining`;
  }
  
  if (diffHours > 0) {
    return `${diffHours}h remaining`;
  }
  
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffMins}m remaining`;
}
