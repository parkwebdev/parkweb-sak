/**
 * NodeSidebar Component
 * 
 * Displays draggable node categories for the automation builder.
 * Memoized for performance.
 * 
 * @module components/automations/NodeSidebar
 */

import { memo } from 'react';
import { Zap, Play, GitBranch01, Variable } from '@untitledui/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NODE_CATEGORIES } from '@/types/automations';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  triggers: Zap,
  actions: Play,
  logic: GitBranch01,
  transform: Variable,
};

export const NodeSidebar = memo(function NodeSidebar() {
  return (
    <div className="w-56 border-r border-border bg-card flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Nodes
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {NODE_CATEGORIES.map((category) => {
            const CategoryIcon = CATEGORY_ICONS[category.id] || Zap;
            
            return (
              <div key={category.id}>
                {/* Category header */}
                <div className="flex items-center gap-2 px-2 py-1.5 mb-1 bg-muted/50 rounded-md">
                  <CategoryIcon size={14} className="text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    {category.label}
                  </span>
                </div>
                
                {/* Node items */}
                <div className="space-y-0.5">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow', node.type);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className={cn(
                        'px-3 py-2 rounded-md cursor-grab',
                        'hover:bg-accent/50 transition-colors',
                        'text-sm text-foreground'
                      )}
                    >
                      <div className="font-medium text-sm">{node.label}</div>
                      <div className="text-2xs text-muted-foreground mt-0.5">
                        {node.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});
