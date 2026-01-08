/**
 * Test Execution Dialog
 * Dialog to input test data and run automation in test mode.
 * 
 * @module components/automations/TestExecutionDialog
 */

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from '@untitledui/icons/react/line';
import type { Automation } from '@/types/automations';
import type { TriggerEventConfig } from '@/types/automations';

interface TestExecutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: Automation;
  onSubmit: (testData: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

/**
 * Generate sample test data based on trigger type
 */
function generateSampleData(automation: Automation): Record<string, unknown> {
  const triggerType = automation.trigger_type;
  const triggerConfig = automation.trigger_config;

  if (triggerType === 'event') {
    const eventConfig = triggerConfig as TriggerEventConfig | null;
    const event = (eventConfig as Record<string, unknown>)?.event as string || 'lead.created';

    // Generate sample data based on event type
    if (event.startsWith('lead.')) {
      return {
        lead: {
          id: 'test-lead-id',
          name: 'Test Lead',
          email: 'test@example.com',
          phone: '+1234567890',
          company: 'Test Company',
          status: 'new',
          stage_id: null,
          data: { source: 'test' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        event: event,
        timestamp: new Date().toISOString(),
      };
    }

    if (event.startsWith('conversation.')) {
      return {
        conversation: {
          id: 'test-conversation-id',
          agent_id: automation.agent_id,
          status: 'active',
          channel: 'widget',
          metadata: {},
          created_at: new Date().toISOString(),
        },
        event: event,
        timestamp: new Date().toISOString(),
      };
    }

    if (event === 'message.received') {
      return {
        message: {
          id: 'test-message-id',
          conversation_id: 'test-conversation-id',
          role: 'user',
          content: 'Hello, this is a test message',
          created_at: new Date().toISOString(),
        },
        conversation_id: 'test-conversation-id',
        event: event,
        timestamp: new Date().toISOString(),
      };
    }
  }

  if (triggerType === 'schedule') {
    return {
      scheduled_at: new Date().toISOString(),
      event: 'schedule.triggered',
    };
  }

  if (triggerType === 'manual') {
    return {
      triggered_by: 'user',
      event: 'manual.triggered',
      timestamp: new Date().toISOString(),
    };
  }

  // Default empty object
  return {};
}

export function TestExecutionDialog({
  open,
  onOpenChange,
  automation,
  onSubmit,
  loading,
}: TestExecutionDialogProps) {
  const sampleData = useMemo(() => generateSampleData(automation), [automation]);
  const [testDataJson, setTestDataJson] = useState(JSON.stringify(sampleData, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      const parsed = JSON.parse(testDataJson);
      setParseError(null);
      await onSubmit(parsed);
    } catch (error) {
      setParseError('Invalid JSON format');
    }
  };

  const handleReset = () => {
    setTestDataJson(JSON.stringify(sampleData, null, 2));
    setParseError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Test Automation</DialogTitle>
          <DialogDescription>
            Run this automation with test data. Test mode won't persist side effects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="test-data">Test Trigger Data</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                Reset to sample
              </Button>
            </div>
            
            <Textarea
              id="test-data"
              value={testDataJson}
              onChange={(e) => {
                setTestDataJson(e.target.value);
                setParseError(null);
              }}
              className="font-mono text-xs min-h-[200px]"
              placeholder="Enter JSON test data..."
            />

            {parseError && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle size={14} aria-hidden="true" />
                <span>{parseError}</span>
              </div>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Test mode:</strong> The automation will execute but won't create real 
              records or send actual notifications. HTTP requests will still be made to 
              external endpoints.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !!parseError}>
            {loading ? 'Running...' : 'Run Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
