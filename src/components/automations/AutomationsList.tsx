/**
 * AutomationsList Component
 * 
 * Displays a list of automations with cards showing status and stats.
 * Includes permission guard for create button.
 * 
 * @module components/automations/AutomationsList
 */

import { memo } from 'react';
import { Plus, Zap, Clock, Hand, Stars02, Edit03, Trash01, Play } from '@untitledui/icons';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useCanManage } from '@/hooks/useCanManage';
import type { AutomationListItem } from '@/types/automations';

interface AutomationsListProps {
  automations: AutomationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateClick: () => void;
  onDeleteClick?: (id: string) => void;
  onRunClick?: (id: string) => void;
}

const TRIGGER_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  event: Zap,
  schedule: Clock,
  manual: Hand,
  ai_tool: Stars02,
};

export const AutomationsList = memo(function AutomationsList({ 
  automations, 
  selectedId, 
  onSelect, 
  onCreateClick,
  onDeleteClick,
  onRunClick,
}: AutomationsListProps) {
  const canManageAutomations = useCanManage('manage_ari');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Automations</h2>
        {canManageAutomations && (
          <IconButton label="New automation" size="icon" className="h-7 w-7" onClick={onCreateClick}>
            <Plus size={14} />
          </IconButton>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {automations.map((automation) => {
            const TriggerIcon = TRIGGER_ICONS[automation.trigger_type] || Zap;
            const isSelected = automation.id === selectedId;

            return (
              <ContextMenu key={automation.id}>
                <ContextMenuTrigger asChild>
                  <button
                    onClick={() => onSelect(automation.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors',
                      'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected && 'bg-accent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div 
                        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-primary/10"
                      >
                        <TriggerIcon size={16} className="text-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {automation.name}
                          </span>
                          <Badge 
                            variant={automation.enabled ? 'default' : 'secondary'}
                            size="sm"
                          >
                            {automation.enabled ? 'Active' : 'Draft'}
                          </Badge>
                        </div>
                        
                        {automation.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {automation.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-1.5 text-2xs text-muted-foreground">
                          <span>{automation.execution_count} runs</span>
                          {automation.last_executed_at && (
                            <span>
                              Last run {formatDistanceToNow(new Date(automation.last_executed_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {automation.trigger_type === 'manual' && canManageAutomations && onRunClick && (
                    <>
                      <ContextMenuItem onSelect={() => {
                        // Delay to let ContextMenu close and restore pointer-events
                        requestAnimationFrame(() => onRunClick(automation.id));
                      }}>
                        <Play size={14} className="mr-2" aria-hidden="true" />
                        Run
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                    </>
                  )}
                  <ContextMenuItem onSelect={() => {
                    requestAnimationFrame(() => onSelect(automation.id));
                  }}>
                    <Edit03 size={14} className="mr-2" aria-hidden="true" />
                    Edit
                  </ContextMenuItem>
                  {canManageAutomations && onDeleteClick && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onSelect={() => {
                          // Critical: let ContextMenu fully close before opening delete dialog
                          requestAnimationFrame(() => onDeleteClick(automation.id));
                        }}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash01 size={14} className="mr-2" aria-hidden="true" />
                        Delete
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});
