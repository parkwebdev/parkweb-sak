/**
 * Execution Detail
 * Shows node-by-node execution trace with variable values and errors.
 * 
 * @module components/automations/ExecutionDetail
 */

import { format } from 'date-fns';
import { CheckCircle, XCircle, AlertCircle, Clock, ChevronDown, ChevronRight } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import type { AutomationExecution } from '@/types/automations';

interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  status: 'success' | 'error' | 'skipped';
  output?: unknown;
  error?: string;
  durationMs: number;
  timestamp: string;
}

interface ExecutionDetailProps {
  execution: AutomationExecution;
}

function NodeResultRow({ node, index }: { node: NodeExecutionResult; index: number }) {
  const [isOpen, setIsOpen] = useState(node.status === 'error');

  const statusConfig = {
    success: {
      icon: CheckCircle,
      className: 'text-status-active',
      bgClassName: 'bg-status-active/10',
    },
    error: {
      icon: XCircle,
      className: 'text-destructive',
      bgClassName: 'bg-destructive/10',
    },
    skipped: {
      icon: AlertCircle,
      className: 'text-muted-foreground',
      bgClassName: 'bg-muted',
    },
  };

  const config = statusConfig[node.status];
  const StatusIcon = config.icon;
  const hasOutput = node.output !== undefined && node.output !== null;
  const hasError = !!node.error;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full p-3 text-left hover:bg-muted/50 transition-colors border-b border-border',
            isOpen && 'bg-muted/30'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
              config.bgClassName
            )}>
              {index + 1}
            </div>
            
            <StatusIcon size={16} className={config.className} aria-hidden="true" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{node.nodeType}</span>
                <Badge variant="outline" size="sm" className="font-mono text-2xs">
                  {node.nodeId.slice(0, 8)}
                </Badge>
              </div>
            </div>
            
            <span className="text-xs text-muted-foreground">
              {node.durationMs}ms
            </span>
            
            {(hasOutput || hasError) && (
              isOpen ? (
                <ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" aria-hidden="true" />
              )
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-3 py-2 bg-muted/20 border-b border-border">
          {hasError && (
            <div className="mb-2">
              <p className="text-xs font-medium text-destructive mb-1">Error</p>
              <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded overflow-x-auto">
                {node.error}
              </pre>
            </div>
          )}
          
          {hasOutput && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                {typeof node.output === 'string' 
                  ? node.output 
                  : JSON.stringify(node.output, null, 2)
                }
              </pre>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ExecutionDetail({ execution }: ExecutionDetailProps) {
  const nodesExecuted = (execution.nodes_executed as unknown as NodeExecutionResult[]) || [];
  const variables = execution.variables as Record<string, unknown> | null;
  const triggerData = execution.trigger_data as Record<string, unknown> | null;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge 
              variant={execution.status === 'completed' ? 'default' : 'destructive'}
            >
              {execution.status}
            </Badge>
            {execution.test_mode && (
              <Badge variant="outline">Test Mode</Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Started:</span>
              <span className="ml-1">{format(new Date(execution.started_at), 'PPp')}</span>
            </div>
            {execution.completed_at && (
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <span className="ml-1">{format(new Date(execution.completed_at), 'PPp')}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-1">{execution.duration_ms || 0}ms</span>
            </div>
            <div>
              <span className="text-muted-foreground">Trigger:</span>
              <span className="ml-1 capitalize">{execution.trigger_type}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {execution.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs font-medium text-destructive mb-1">Execution Error</p>
            <pre className="text-xs text-destructive whitespace-pre-wrap">
              {execution.error}
            </pre>
          </div>
        )}

        {/* Trigger Data */}
        {triggerData && Object.keys(triggerData).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Trigger Data</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
              {JSON.stringify(triggerData, null, 2)}
            </pre>
          </div>
        )}

        {/* Node Execution Trace */}
        {nodesExecuted.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Execution Trace ({nodesExecuted.length} nodes)
            </p>
            <div className="border border-border rounded-lg overflow-hidden">
              {nodesExecuted.map((node, index) => (
                <NodeResultRow key={`${node.nodeId}-${index}`} node={node} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Final Variables */}
        {variables && Object.keys(variables).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Final Variables</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
              {JSON.stringify(variables, null, 2)}
            </pre>
          </div>
        )}

        {/* Empty State */}
        {nodesExecuted.length === 0 && !execution.error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock size={24} className="text-muted-foreground mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No execution data</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
