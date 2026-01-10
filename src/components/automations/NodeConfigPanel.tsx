/**
 * NodeConfigPanel Component
 * 
 * Dynamic panel that shows the configuration UI for the selected node.
 * Renders different panels based on node type.
 * Includes validation error display.
 * 
 * @module components/automations/NodeConfigPanel
 */

import { useMemo } from 'react';
import { X, AlertCircle } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import { useFlowStore } from '@/stores/automationFlowStore';
import { useAutomationValidation } from '@/hooks/useAutomationValidation';
import {
  TriggerEventConfigPanel,
  TriggerScheduleConfigPanel,
  TriggerManualConfigPanel,
  TriggerAIToolConfigPanel,
  ActionHttpConfigPanel,
  ActionEmailConfigPanel,
  ActionUpdateLeadConfigPanel,
  LogicConditionConfigPanel,
  LogicDelayConfigPanel,
  LogicStopConfigPanel,
  AIGenerateConfigPanel,
  AIClassifyConfigPanel,
  AIExtractConfigPanel,
} from './panels';
import type {
  AutomationNode,
  TriggerEventNodeData,
  TriggerScheduleNodeData,
  TriggerManualNodeData,
  TriggerAIToolNodeData,
  ActionHttpNodeData,
  ActionEmailNodeData,
  ActionUpdateLeadNodeData,
  LogicConditionNodeData,
  LogicDelayNodeData,
  LogicStopNodeData,
  AIGenerateNodeData,
  AIClassifyNodeData,
  AIExtractNodeData,
} from '@/types/automations';

// Map node types to user-friendly display names
const NODE_TYPE_LABELS: Record<string, string> = {
  'trigger-ai-tool': 'Ari Action',
  'trigger-event': 'Event Trigger',
  'trigger-schedule': 'Schedule Trigger',
  'trigger-manual': 'Manual Trigger',
  'action-http': 'HTTP Request',
  'action-email': 'Send Email',
  'action-update-lead': 'Update Lead',
  'logic-condition': 'Condition',
  'logic-delay': 'Delay',
  'logic-stop': 'Stop',
  'ai-generate': 'AI Generate',
  'ai-classify': 'AI Classify',
  'ai-extract': 'AI Extract',
};

interface NodeConfigPanelProps {
  onClose: () => void;
}

export function NodeConfigPanel({ onClose }: NodeConfigPanelProps) {
  const nodes = useFlowStore((state) => state.nodes);
  const { getNodeErrors } = useAutomationValidation();

  // Find the selected node
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.selected);
  }, [nodes]) as AutomationNode | undefined;

  if (!selectedNode) {
    return null;
  }

  const errors = getNodeErrors(selectedNode.id);

  const renderConfigPanel = () => {
    switch (selectedNode.type) {
      case 'trigger-event':
        return (
          <TriggerEventConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerEventNodeData}
          />
        );
      case 'trigger-schedule':
        return (
          <TriggerScheduleConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerScheduleNodeData}
          />
        );
      case 'trigger-manual':
        return (
          <TriggerManualConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerManualNodeData}
          />
        );
      case 'trigger-ai-tool':
        return (
          <TriggerAIToolConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerAIToolNodeData}
          />
        );
      case 'action-http':
        return (
          <ActionHttpConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as ActionHttpNodeData}
          />
        );
      case 'action-email':
        return (
          <ActionEmailConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as ActionEmailNodeData}
          />
        );
      case 'action-update-lead':
        return (
          <ActionUpdateLeadConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as ActionUpdateLeadNodeData}
          />
        );
      case 'logic-condition':
        return (
          <LogicConditionConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as LogicConditionNodeData}
          />
        );
      case 'logic-delay':
        return (
          <LogicDelayConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as LogicDelayNodeData}
          />
        );
      case 'logic-stop':
        return (
          <LogicStopConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as LogicStopNodeData}
          />
        );
      case 'ai-generate':
        return (
          <AIGenerateConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as AIGenerateNodeData}
          />
        );
      case 'ai-classify':
        return (
          <AIClassifyConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as AIClassifyNodeData}
          />
        );
      case 'ai-extract':
        return (
          <AIExtractConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as AIExtractNodeData}
          />
        );
      default:
        return (
          <div className="p-4 text-sm text-muted-foreground">
            No configuration available for this node type.
          </div>
        );
    }
  };

  return (
    <div className="w-80 h-full border-l border-border bg-card flex flex-col animate-slide-in-from-right">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-medium">Node Settings</h3>
        <IconButton
          label="Close panel"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X size={16} aria-hidden="true" />
        </IconButton>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4">
          {/* Node label (readonly for now) */}
          <div className="mb-4 pb-4 border-b border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {NODE_TYPE_LABELS[selectedNode.type || ''] || selectedNode.type?.replace(/-/g, ' ')}
            </div>
            <div className="font-medium">
              {(selectedNode.data as { label?: string }).label || 'Untitled'}
            </div>
          </div>

          {/* Validation errors banner */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle size={16} aria-hidden="true" />
                Complete required fields
              </div>
              <ul className="mt-2 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-xs text-destructive">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Type-specific config */}
          {renderConfigPanel()}
        </div>
      </div>
    </div>
  );
}
