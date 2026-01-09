/**
 * useAutomationAutoSave Hook
 * 
 * Auto-save hook for automation flow changes with 3s debounce.
 * Tracks last saved time and provides save status.
 * Uses refs to avoid infinite loops from flow state dependencies.
 * Syncs trigger_type and trigger_config from flow nodes to automation metadata.
 * 
 * @module hooks/useAutomationAutoSave
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useFlowStore } from '@/stores/automationFlowStore';
import { useAutomations } from '@/hooks/useAutomations';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import type { 
  Automation, 
  AutomationNode,
  AutomationTriggerType,
  AutomationTriggerConfig,
  TriggerEventNodeData,
  TriggerScheduleNodeData,
  TriggerManualNodeData,
  TriggerAIToolNodeData,
} from '@/types/automations';

/** Auto-save debounce delay in milliseconds */
const AUTO_SAVE_DELAY_MS = 3000;

interface UseAutomationAutoSaveOptions {
  /** The automation being edited */
  automation: Automation | null;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Callback when trigger metadata changes (for syncing local state) */
  onTriggerSync?: (triggerType: AutomationTriggerType, triggerConfig: AutomationTriggerConfig) => void;
}

interface UseAutomationAutoSaveReturn {
  /** Whether a save is in progress */
  saving: boolean;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Manually trigger a save */
  saveNow: () => Promise<void>;
  /** Whether there was a save error */
  saveError: boolean;
}

/**
 * Extract trigger type from node type string.
 * e.g. 'trigger-manual' -> 'manual', 'trigger-ai-tool' -> 'ai_tool'
 */
function extractTriggerType(nodeType: string): AutomationTriggerType | null {
  const match = nodeType.match(/^trigger-(.+)$/);
  if (!match) return null;
  
  const type = match[1].replace(/-/g, '_');
  if (['event', 'schedule', 'manual', 'ai_tool'].includes(type)) {
    return type as AutomationTriggerType;
  }
  return null;
}

/**
 * Extract trigger config from a trigger node's data.
 */
function extractTriggerConfig(node: AutomationNode): AutomationTriggerConfig | null {
  if (!node.type?.startsWith('trigger-')) return null;

  switch (node.type) {
    case 'trigger-manual': {
      const data = node.data as TriggerManualNodeData;
      return {
        buttonLabel: data.buttonLabel,
        requireConfirmation: data.requireConfirmation,
      };
    }
    case 'trigger-schedule': {
      const data = node.data as TriggerScheduleNodeData;
      return {
        cronExpression: data.cronExpression,
        timezone: data.timezone,
      };
    }
    case 'trigger-event': {
      const data = node.data as TriggerEventNodeData;
      // Map node event format to trigger config format
      const eventType = data.event?.includes('.') ? data.event.split('.')[1]?.toUpperCase() : 'any';
      return {
        eventSource: data.event?.split('.')[0] as 'lead' | 'conversation' | 'booking' || 'lead',
        eventType: eventType === 'CREATED' ? 'INSERT' : eventType === 'DELETED' ? 'DELETE' : eventType === 'UPDATED' ? 'UPDATE' : 'any',
        conditions: [],
      };
    }
    case 'trigger-ai-tool': {
      const data = node.data as TriggerAIToolNodeData;
      return {
        toolName: data.toolName,
        toolDescription: data.toolDescription,
        parameters: data.parameters || [],
      };
    }
    default:
      return null;
  }
}

/**
 * Hook for auto-saving automation flow changes.
 * 
 * @example
 * ```tsx
 * const { saving, lastSavedAt, saveNow } = useAutomationAutoSave({
 *   automation,
 *   enabled: true,
 *   onTriggerSync: (type, config) => setAutomation(prev => ({ ...prev, trigger_type: type, trigger_config: config })),
 * });
 * ```
 */
export function useAutomationAutoSave({
  automation,
  enabled = true,
  onTriggerSync,
}: UseAutomationAutoSaveOptions): UseAutomationAutoSaveReturn {
  const { updateAutomation, updating } = useAutomations();
  const { nodes, edges, viewport, isDirty, markClean } = useFlowStore();
  
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingRef = useRef(false);
  
  // Use refs for flow state to avoid recreating executeSave on every change
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const viewportRef = useRef(viewport);
  
  // Keep refs updated
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    viewportRef.current = viewport;
  }, [nodes, edges, viewport]);

  // Execute save using refs (stable callback)
  const executeSave = useCallback(async () => {
    if (!automation || savingRef.current) return;
    
    savingRef.current = true;
    setSaveError(false);

    try {
      // Find trigger node and extract metadata
      const triggerNode = nodesRef.current.find(n => n.type?.startsWith('trigger-'));
      const triggerTypeFromFlow = triggerNode?.type ? extractTriggerType(triggerNode.type) : null;
      const triggerConfigFromFlow = triggerNode ? extractTriggerConfig(triggerNode) : null;

      // Build update payload
      const updatePayload: Parameters<typeof updateAutomation>[0] = {
        id: automation.id,
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: viewportRef.current,
      };

      // Sync trigger_type if it changed
      if (triggerTypeFromFlow && triggerTypeFromFlow !== automation.trigger_type) {
        updatePayload.trigger_type = triggerTypeFromFlow;
      }

      // Sync trigger_config if we have a valid one
      if (triggerConfigFromFlow) {
        updatePayload.trigger_config = triggerConfigFromFlow;
      }

      await updateAutomation(updatePayload);
      markClean();
      setLastSavedAt(new Date());

      // Notify parent of trigger metadata changes
      if (onTriggerSync && triggerTypeFromFlow && triggerConfigFromFlow) {
        onTriggerSync(triggerTypeFromFlow, triggerConfigFromFlow);
      }
    } catch (error: unknown) {
      setSaveError(true);
      toast.error('Auto-save failed', { description: getErrorMessage(error) });
    } finally {
      savingRef.current = false;
    }
  }, [automation, updateAutomation, markClean, onTriggerSync]);

  // Schedule auto-save when flow changes (track isDirty only)
  useEffect(() => {
    if (!enabled || !automation || !isDirty) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule new save
    timeoutRef.current = setTimeout(() => {
      executeSave();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, automation, isDirty, executeSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Manual save
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await executeSave();
  }, [executeSave]);

  return {
    saving: updating || savingRef.current,
    lastSavedAt,
    saveNow,
    saveError,
  };
}
