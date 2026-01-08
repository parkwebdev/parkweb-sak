/**
 * Execution Panel
 * Side panel showing execution history and details.
 * 
 * @module components/automations/ExecutionPanel
 */

import { useState } from 'react';
import { X, Play, ClockRewind, RefreshCw01 as RefreshCw } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExecutionHistoryList } from './ExecutionHistoryList';
import { ExecutionDetail } from './ExecutionDetail';
import { TestExecutionDialog } from './TestExecutionDialog';
import { useAutomationExecutions } from '@/hooks/useAutomationExecutions';
import type { Automation, AutomationExecution } from '@/types/automations';

interface ExecutionPanelProps {
  automation: Automation;
  onClose: () => void;
}

export function ExecutionPanel({ automation, onClose }: ExecutionPanelProps) {
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);
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

  const handleRunTest = async (testData: Record<string, unknown>) => {
    await triggerExecution({
      triggerData: testData,
      testMode: true,
    });
    setTestDialogOpen(false);
  };

  const handleRunLive = async () => {
    await triggerExecution({
      triggerData: {},
      testMode: false,
    });
  };

  return (
    <div className="h-full flex flex-col border-l border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ClockRewind size={16} className="text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium">Executions</h3>
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
      {selectedExecution ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedExecution(null)}
            >
              ← Back to list
            </Button>
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
            onSelect={setSelectedExecution}
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
