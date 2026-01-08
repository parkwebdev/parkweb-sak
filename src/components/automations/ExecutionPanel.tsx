/**
 * Execution Panel
 * Side panel showing execution history and details with real-time updates.
 * 
 * @module components/automations/ExecutionPanel
 */

import { useState, useEffect } from 'react';
import { X, Play, ClockRewind, RefreshCw01 as RefreshCw } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { ExecutionHistoryList } from './ExecutionHistoryList';
import { ExecutionDetail } from './ExecutionDetail';
import { TestExecutionDialog } from './TestExecutionDialog';
import { useAutomationExecutions, useAutomationExecution } from '@/hooks/useAutomationExecutions';
import type { Automation } from '@/types/automations';

interface ExecutionPanelProps {
  automation: Automation;
  onClose: () => void;
}

export function ExecutionPanel({ automation, onClose }: ExecutionPanelProps) {
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  
  const { 
    executions, 
    loading, 
    refetch, 
    triggerExecution, 
    triggering 
  } = useAutomationExecutions({ 
    automationId: automation.id 
  });

  // Real-time hook for the selected execution
  const { data: selectedExecution, isLoading: loadingDetail } = useAutomationExecution(selectedExecutionId);

  // Auto-select the most recent execution when a new one is triggered
  useEffect(() => {
    if (triggering && executions.length > 0) {
      // When trigger completes, the list will update and we'll see the new execution
    }
  }, [triggering, executions]);

  // Update selected execution from the list if it changes (real-time sync)
  useEffect(() => {
    if (selectedExecutionId && executions.length > 0) {
      const updatedExecution = executions.find(e => e.id === selectedExecutionId);
      if (updatedExecution?.status === 'completed' || updatedExecution?.status === 'failed') {
        // Execution finished, the useAutomationExecution hook will have the latest data
      }
    }
  }, [executions, selectedExecutionId]);

  const handleRunTest = async (testData: Record<string, unknown>) => {
    const result = await triggerExecution({
      triggerData: testData,
      testMode: true,
    });
    setTestDialogOpen(false);
    // Auto-select the new execution if returned
    if (result?.executionId) {
      setSelectedExecutionId(result.executionId);
    }
  };

  const handleRunLive = async () => {
    const result = await triggerExecution({
      triggerData: {},
      testMode: false,
    });
    // Auto-select the new execution if returned
    if (result?.executionId) {
      setSelectedExecutionId(result.executionId);
    }
  };

  return (
    <div className="h-full flex flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ClockRewind size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium">Executions</h3>
          {selectedExecution?.status === 'running' && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <IconButton
            label="Refresh"
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw size={14} aria-hidden="true" />
          </IconButton>
          <IconButton
            label="Close panel"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X size={14} aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Button
          size="sm"
          onClick={() => setTestDialogOpen(true)}
          disabled={triggering || automation.status !== 'active'}
        >
          <Play size={14} className="mr-1" aria-hidden="true" />
          Test Run
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRunLive}
          disabled={triggering || automation.status !== 'active'}
        >
          Run Live
        </Button>
      </div>

      {/* Content */}
      {selectedExecutionId && selectedExecution ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedExecutionId(null)}
            >
              ← Back to list
            </Button>
            {loadingDetail && (
              <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <ExecutionDetail execution={selectedExecution} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <ExecutionHistoryList
            executions={executions}
            loading={loading}
            selectedId={null}
            onSelect={(execution) => setSelectedExecutionId(execution.id)}
          />
        </div>
      )}

      {/* Test Dialog */}
      <TestExecutionDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        automation={automation}
        onSubmit={handleRunTest}
        loading={triggering}
      />
    </div>
  );
}
