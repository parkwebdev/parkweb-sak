/**
 * Execution History List
 * Displays a list of past automation executions.
 * 
 * @module components/automations/ExecutionHistoryList
 */

import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, PlayCircle } from '@untitledui/icons/react/line';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import type { AutomationExecution } from '@/types/automations';

interface ExecutionHistoryListProps {
  executions: AutomationExecution[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect: (execution: AutomationExecution) => void;
}

const statusConfig: Record<string, { 
  icon: React.ComponentType<{ size?: number; className?: string }>; 
  label: string; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}> = {
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    variant: 'default',
    className: 'text-status-active',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    variant: 'destructive',
    className: 'text-destructive',
  },
  running: {
    icon: PlayCircle,
    label: 'Running',
    variant: 'secondary',
    className: 'text-primary animate-pulse',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    variant: 'outline',
    className: 'text-muted-foreground',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    variant: 'outline',
    className: 'text-muted-foreground',
  },
};

function ExecutionRow({ 
  execution, 
  isSelected,
  onClick 
}: { 
  execution: AutomationExecution; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = statusConfig[execution.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const nodesExecuted = (execution.nodes_executed as unknown[])?.length || 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 text-left border-b border-border hover:bg-muted/50 transition-colors',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex items-start gap-3">
        <StatusIcon size={16} className={cn('mt-0.5 flex-shrink-0', config.className)} aria-hidden="true" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={config.variant} size="sm">
              {config.label}
            </Badge>
            {execution.test_mode && (
              <Badge variant="outline" size="sm">
                Test
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
          </p>
          
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{nodesExecuted} nodes</span>
            {execution.duration_ms && (
              <span>{execution.duration_ms}ms</span>
            )}
            <span className="capitalize">{execution.trigger_type}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 border-b border-border">
          <div className="flex items-start gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExecutionHistoryList({
  executions,
  loading,
  selectedId,
  onSelect,
}: ExecutionHistoryListProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center p-4">
        <Clock size={24} className="text-muted-foreground mb-2" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No executions yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Run the automation to see execution history
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {executions.map((execution) => (
          <ExecutionRow
            key={execution.id}
            execution={execution}
            isSelected={selectedId === execution.id}
            onClick={() => onSelect(execution)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
