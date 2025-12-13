/**
 * DebugConsole Component
 * 
 * Collapsible debug log panel for testing tools and webhooks.
 * Features color-coded log levels, timestamps, and expandable details.
 * Includes useDebugLogs hook for log management.
 * @module components/agents/DebugConsole
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash01, CheckCircle, XCircle, AlertCircle, InfoCircle } from '@untitledui/icons';
import { cn } from '@/lib/utils';

export type LogLevel = 'info' | 'success' | 'error' | 'warning';

export interface DebugLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: any;
}

interface DebugConsoleProps {
  logs: DebugLogEntry[];
  onClear: () => void;
  className?: string;
}

const levelConfig: Record<LogLevel, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  info: { icon: InfoCircle, color: 'text-info', bg: 'bg-info/10' },
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  warning: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
};

export const DebugConsole = ({ logs, onClear, className }: DebugConsoleProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const formatTime = (date: Date) => {
    const time = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">Debug Console</span>
          {logs.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {logs.length}
            </span>
          )}
        </div>
        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="h-7 px-2 text-xs"
          >
            <Trash01 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Log Content */}
      {!isCollapsed && (
        <div 
          ref={scrollRef}
          className="h-64 overflow-y-auto font-mono text-xs bg-background"
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No logs yet. Test a tool or webhook to see debug output.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {logs.map((log) => {
                const config = levelConfig[log.level];
                const Icon = config.icon;
                const isExpanded = expandedLogs.has(log.id);
                const hasDetails = log.details !== undefined;

                return (
                  <div
                    key={log.id}
                    className={cn(
                      'px-3 py-2 hover:bg-muted/30 transition-colors',
                      hasDetails && 'cursor-pointer'
                    )}
                    onClick={() => hasDetails && toggleLogExpansion(log.id)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className={cn('shrink-0 px-1.5 py-0.5 rounded text-2xs uppercase font-semibold', config.bg, config.color)}>
                        {log.level}
                      </span>
                      <span className="flex-1 break-words">{log.message}</span>
                      {hasDetails && (
                        <span className="text-muted-foreground shrink-0">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      )}
                    </div>
                    {hasDetails && isExpanded && (
                      <div className="mt-2 ml-[72px]">
                        <pre className="p-2 rounded bg-muted/50 overflow-auto max-h-48 text-2xs leading-relaxed">
                          {typeof log.details === 'string' 
                            ? log.details 
                            : JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper hook to manage debug logs
export const useDebugLogs = () => {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);

  const addLog = (level: LogLevel, message: string, details?: any) => {
    const entry: DebugLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      details,
    };
    setLogs(prev => [...prev, entry]);
    return entry;
  };

  const log = {
    info: (message: string, details?: any) => addLog('info', message, details),
    success: (message: string, details?: any) => addLog('success', message, details),
    error: (message: string, details?: any) => addLog('error', message, details),
    warning: (message: string, details?: any) => addLog('warning', message, details),
  };

  const clear = () => setLogs([]);

  return { logs, log, clear };
};
