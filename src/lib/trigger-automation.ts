/**
 * Utility for triggering manual automations directly
 * 
 * Avoids race conditions by calling the edge function directly
 * instead of relying on React state updates.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';

interface TriggerAutomationOptions {
  automationId: string;
  leadId?: string;
  conversationId?: string;
  triggerData?: Record<string, unknown>;
  testMode?: boolean;
}

interface TriggerAutomationResult {
  success: boolean;
  executionId?: string;
  error?: string;
}

export async function triggerAutomation(
  options: TriggerAutomationOptions
): Promise<TriggerAutomationResult> {
  const { automationId, leadId, conversationId, triggerData = {}, testMode = false } = options;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast.error('Not authenticated');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-automation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          source: 'manual',
          automationId,
          triggerData,
          testMode,
          leadId,
          conversationId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      toast.error('Execution failed', { description: result.error });
      return { success: false, error: result.error };
    }

    toast.success('Automation triggered');
    return { 
      success: true, 
      executionId: result.executions?.[0]?.executionId 
    };
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    toast.error('Failed to trigger automation', { description: message });
    return { success: false, error: message };
  }
}
