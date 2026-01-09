/**
 * NodeConfigPanel Component
 * 
 * Dynamic panel that shows the configuration UI for the selected node.
 * Renders different panels based on node type.
 * 
 * @module components/automations/NodeConfigPanel
 */

import { useMemo } from 'react';
import { X } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import { useFlowStore } from '@/stores/automationFlowStore';
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

interface NodeConfigPanelProps {
  onClose: () => void;
}

export function NodeConfigPanel({ onClose }: NodeConfigPanelProps) {
  const nodes = useFlowStore((state) => state.nodes);

  // Find the selected node
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.selected);
  }, [nodes]) as AutomationNode | undefined;

  if (!selectedNode) {
    return null;
  }

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
              {selectedNode.type?.replace(/-/g, ' ')}
            </div>
            <div className="font-medium">
              {(selectedNode.data as { label?: string }).label || 'Untitled'}
            </div>
          </div>

          {/* Type-specific config */}
          {renderConfigPanel()}
        </div>
      </div>
    </div>
  );
}
