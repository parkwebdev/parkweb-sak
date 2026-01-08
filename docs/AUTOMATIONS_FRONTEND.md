# Automations Frontend Implementation

> Components, hooks, accessibility, and UI patterns

## File Structure

```
src/
├── pages/
│   └── Automations.tsx                    # Main page (~150 lines)
│
├── components/automations/
│   ├── AutomationsList.tsx                # DataTable list view (~200 lines)
│   ├── AutomationCard.tsx                 # Card for grid view (~80 lines)
│   ├── AutomationStatusBadge.tsx          # Status indicator (~40 lines)
│   │
│   ├── editor/
│   │   ├── FlowEditor.tsx                 # React Flow wrapper (~250 lines)
│   │   ├── FlowCanvas.tsx                 # Canvas with controls (~150 lines)
│   │   ├── FlowToolbar.tsx                # Top toolbar (~100 lines)
│   │   ├── FlowMinimap.tsx                # Minimap wrapper (~50 lines)
│   │   └── FlowControls.tsx               # Zoom/fit controls (~60 lines)
│   │
│   ├── sidebar/
│   │   ├── NodeSidebar.tsx                # Draggable palette (~150 lines)
│   │   ├── NodeCategory.tsx               # Category group (~60 lines)
│   │   └── DraggableNode.tsx              # Draggable item (~80 lines)
│   │
│   ├── nodes/
│   │   ├── BaseNode.tsx                   # Shared node wrapper (~100 lines)
│   │   ├── NodeHandle.tsx                 # Custom handle (~40 lines)
│   │   ├── index.ts                       # nodeTypes export
│   │   │
│   │   ├── triggers/
│   │   │   ├── TriggerEventNode.tsx       # Event trigger (~80 lines)
│   │   │   ├── TriggerScheduleNode.tsx    # Schedule trigger (~80 lines)
│   │   │   ├── TriggerManualNode.tsx      # Manual trigger (~60 lines)
│   │   │   └── TriggerAIToolNode.tsx      # AI tool trigger (~80 lines)
│   │   │
│   │   ├── actions/
│   │   │   ├── ActionHttpNode.tsx         # HTTP request (~100 lines)
│   │   │   ├── ActionEmailNode.tsx        # Send email (~80 lines)
│   │   │   ├── ActionUpdateLeadNode.tsx   # Update lead (~80 lines)
│   │   │   └── ActionCreateBookingNode.tsx # Create booking (~80 lines)
│   │   │
│   │   ├── logic/
│   │   │   ├── LogicConditionNode.tsx     # Condition (~120 lines)
│   │   │   ├── LogicSwitchNode.tsx        # Switch (~100 lines)
│   │   │   ├── LogicLoopNode.tsx          # Loop (~80 lines)
│   │   │   ├── LogicDelayNode.tsx         # Delay (~60 lines)
│   │   │   └── LogicStopNode.tsx          # Stop (~50 lines)
│   │   │
│   │   ├── transform/
│   │   │   ├── TransformSetVariableNode.tsx
│   │   │   ├── TransformMapNode.tsx
│   │   │   └── TransformFilterNode.tsx
│   │   │
│   │   └── ai/
│   │       ├── AIGenerateNode.tsx
│   │       ├── AIClassifyNode.tsx
│   │       └── AIExtractNode.tsx
│   │
│   ├── panels/
│   │   ├── NodeConfigPanel.tsx            # Right panel (~200 lines)
│   │   ├── TriggerConfigForm.tsx          # Trigger config (~150 lines)
│   │   ├── ActionConfigForm.tsx           # Action config (~150 lines)
│   │   ├── LogicConfigForm.tsx            # Logic config (~150 lines)
│   │   └── ConditionBuilder.tsx           # Condition UI (~200 lines)
│   │
│   ├── variables/
│   │   ├── VariablePicker.tsx             # Variable selector (~150 lines)
│   │   ├── VariableChip.tsx               # Display chip (~40 lines)
│   │   └── VariableInput.tsx              # Input with picker (~100 lines)
│   │
│   └── execution/
│       ├── ExecutionHistory.tsx           # History list (~150 lines)
│       ├── ExecutionTimeline.tsx          # Visual timeline (~200 lines)
│       ├── ExecutionNodeStatus.tsx        # Node status (~60 lines)
│       └── TestRunDialog.tsx              # Test execution (~120 lines)
│
├── hooks/
│   ├── useAutomations.ts                  # CRUD operations (~200 lines)
│   ├── useAutomation.ts                   # Single automation (~100 lines)
│   ├── useAutomationExecutions.ts         # Execution history (~100 lines)
│   └── useFlowState.ts                    # React Flow state (~150 lines)
│
└── types/
    └── automations.ts                     # All type definitions (~400 lines)
```

## Component Patterns

### Base Node Component

All nodes extend `BaseNode` for consistent styling:

```tsx
// src/components/automations/nodes/BaseNode.tsx

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { BaseNodeData } from '@/types/automations';

interface BaseNodeProps extends NodeProps<BaseNodeData> {
  icon: React.ReactNode;
  category: 'trigger' | 'action' | 'logic' | 'transform' | 'ai';
  children?: React.ReactNode;
  sourceHandles?: number;
  targetHandles?: number;
}

const categoryColors = {
  trigger: 'border-l-status-active',      // Green
  action: 'border-l-primary',             // Blue
  logic: 'border-l-status-warning',       // Yellow
  transform: 'border-l-status-info',      // Purple
  ai: 'border-l-gradient-start',          // Gradient
} as const;

export const BaseNode = memo(function BaseNode({
  data,
  selected,
  icon,
  category,
  children,
  sourceHandles = 1,
  targetHandles = 1,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        'min-w-[200px] rounded-lg border border-border bg-card shadow-sm',
        'border-l-4',
        categoryColors[category],
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        data.disabled && 'opacity-50'
      )}
      role="button"
      aria-label={`${data.label} node`}
      aria-selected={selected}
      tabIndex={0}
    >
      {/* Target handles */}
      {targetHandles > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-muted-foreground !border-background !w-3 !h-3"
        />
      )}

      {/* Node content */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium text-foreground truncate">
            {data.label}
          </span>
        </div>
        {data.description && (
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {data.description}
          </p>
        )}
        {children}
      </div>

      {/* Source handles */}
      {sourceHandles > 0 && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-muted-foreground !border-background !w-3 !h-3"
        />
      )}
    </div>
  );
});
```

### Condition Node with Multiple Outputs

```tsx
// src/components/automations/nodes/logic/LogicConditionNode.tsx

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch01 } from '@untitledui/icons';
import { BaseNode } from '../BaseNode';
import type { LogicConditionNodeData } from '@/types/automations';

export const LogicConditionNode = memo(function LogicConditionNode(
  props: NodeProps<LogicConditionNodeData>
) {
  const { data } = props;
  const ruleCount = data.config?.rules?.length ?? 0;

  return (
    <BaseNode
      {...props}
      icon={<GitBranch01 size={16} aria-hidden="true" />}
      category="logic"
      targetHandles={1}
      sourceHandles={0} // Custom handles below
    >
      <div className="mt-2 text-xs text-muted-foreground">
        {ruleCount} rule{ruleCount !== 1 ? 's' : ''} ({data.config?.logic ?? 'and'})
      </div>

      {/* True path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-status-active !border-background !w-3 !h-3"
        style={{ left: '30%' }}
      />
      <span
        className="absolute bottom-0 left-[30%] -translate-x-1/2 translate-y-full text-2xs text-status-active"
        aria-hidden="true"
      >
        Yes
      </span>

      {/* False path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-destructive !border-background !w-3 !h-3"
        style={{ left: '70%' }}
      />
      <span
        className="absolute bottom-0 left-[70%] -translate-x-1/2 translate-y-full text-2xs text-destructive"
        aria-hidden="true"
      >
        No
      </span>
    </BaseNode>
  );
});
```

## Design System Integration

### Color Tokens (from index.css)

```css
/* Node category colors - use existing status tokens */
.border-l-status-active { /* Triggers - green */ }
.border-l-primary { /* Actions - blue */ }
.border-l-status-warning { /* Logic - yellow/orange */ }
.border-l-status-info { /* Transform - purple */ }

/* Node states */
.bg-card { /* Default background */ }
.border-border { /* Default border */ }
.ring-ring { /* Selected ring */ }

/* Handle colors */
.bg-muted-foreground { /* Default handle */ }
.bg-status-active { /* Success/true path */ }
.bg-destructive { /* Error/false path */ }
```

### Typography

```tsx
// Node labels
<span className="text-sm font-medium text-foreground">

// Node descriptions
<p className="text-xs text-muted-foreground">

// Handle labels
<span className="text-2xs text-muted-foreground">

// Category headers in sidebar
<h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60">
```

### Spacing

```tsx
// Node padding
<div className="p-3">

// Node content gap
<div className="flex items-center gap-2">

// Sidebar categories
<div className="space-y-4">

// Node list in category
<div className="space-y-1">
```

## useAutomations Hook

Following existing patterns from `useWebhooks.ts`:

```typescript
// src/hooks/useAutomations.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useAgent } from '@/hooks/useAgent';
import { getErrorMessage } from '@/types/errors';
import { toast } from 'sonner';
import { AUTOMATION_LIST_COLUMNS } from '@/lib/db-selects';
import type { Automation, AutomationInsert, AutomationUpdate } from '@/types/automations';

export function useAutomations() {
  const queryClient = useQueryClient();
  const { accountOwnerId } = useAccountOwnerId();
  const { agent } = useAgent();

  const {
    data: automations,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.automations.list(agent?.id ?? ''),
    queryFn: async () => {
      if (!agent?.id) return [];

      const { data, error } = await supabase
        .from('automations')
        .select(AUTOMATION_LIST_COLUMNS)
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Automation[];
    },
    enabled: !!agent?.id && !!accountOwnerId,
  });

  const createMutation = useMutation({
    mutationFn: async (automation: AutomationInsert) => {
      if (!agent?.id || !accountOwnerId) {
        throw new Error('Missing agent or account');
      }

      const { data, error } = await supabase
        .from('automations')
        .insert({
          ...automation,
          agent_id: agent.id,
          user_id: accountOwnerId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.automations.list(agent?.id ?? ''),
      });
      toast.success('Automation created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create automation', {
        description: getErrorMessage(error),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: AutomationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('automations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.automations.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.automations.list(agent?.id ?? ''),
      });
      toast.success('Automation updated');
    },
    onError: (error: unknown) => {
      toast.error('Failed to update automation', {
        description: getErrorMessage(error),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.automations.list(agent?.id ?? ''),
      });
      toast.success('Automation deleted');
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete automation', {
        description: getErrorMessage(error),
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('automations')
        .update({ enabled, status: enabled ? 'active' : 'paused' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.automations.list(agent?.id ?? ''),
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to toggle automation', {
        description: getErrorMessage(error),
      });
    },
  });

  return {
    automations: automations ?? [],
    isLoading,
    error,
    createAutomation: createMutation.mutateAsync,
    updateAutomation: updateMutation.mutateAsync,
    deleteAutomation: deleteMutation.mutateAsync,
    toggleAutomation: toggleMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

## Accessibility Requirements

### Keyboard Navigation

```tsx
// FlowEditor keyboard handling
function FlowEditor() {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Delete selected nodes
    if (event.key === 'Delete' || event.key === 'Backspace') {
      deleteSelectedNodes();
    }

    // Undo/Redo
    if (event.metaKey || event.ctrlKey) {
      if (event.key === 'z') {
        event.shiftKey ? redo() : undo();
      }
    }

    // Arrow keys to move selection
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      moveSelectedNodes(event.key);
    }

    // Escape to deselect
    if (event.key === 'Escape') {
      clearSelection();
    }

    // Enter to open config panel
    if (event.key === 'Enter' && selectedNode) {
      openConfigPanel(selectedNode);
    }
  }, [/* deps */]);

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Automation flow editor"
    >
      <ReactFlow ... />
    </div>
  );
}
```

### Screen Reader Announcements

```tsx
// Announce node operations
function useNodeAnnouncements() {
  const announce = useCallback((message: string) => {
    const el = document.getElementById('automation-announcer');
    if (el) el.textContent = message;
  }, []);

  return {
    announceNodeAdded: (label: string) =>
      announce(`${label} node added to flow`),
    announceNodeDeleted: (label: string) =>
      announce(`${label} node deleted`),
    announceNodeSelected: (label: string) =>
      announce(`${label} node selected. Press Enter to configure.`),
    announceConnectionCreated: (from: string, to: string) =>
      announce(`Connected ${from} to ${to}`),
  };
}

// In page layout
<div
  id="automation-announcer"
  role="status"
  aria-live="polite"
  className="sr-only"
/>
```

### ARIA Labels

```tsx
// Node component
<div
  role="button"
  aria-label={`${data.label} node, ${category} type`}
  aria-selected={selected}
  aria-describedby={`node-desc-${id}`}
  tabIndex={0}
>
  <span id={`node-desc-${id}`} className="sr-only">
    {data.description || `${category} node. Press Enter to configure.`}
  </span>
</div>

// Handle component
<Handle
  aria-label={`${type} connection point`}
  aria-describedby={handleId}
/>

// Sidebar draggable
<div
  role="button"
  aria-label={`Add ${label} node. Drag to canvas or press Enter.`}
  draggable
  tabIndex={0}
/>
```

### Focus Management

```tsx
// Focus new node after adding
function onNodeAdd(node: AutomationNode) {
  setNodes((nodes) => [...nodes, node]);
  
  // Focus the new node after render
  requestAnimationFrame(() => {
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
    if (nodeElement instanceof HTMLElement) {
      nodeElement.focus();
    }
  });
}

// Trap focus in config panel
<Dialog open={isConfigOpen} onOpenChange={setConfigOpen}>
  <DialogContent aria-describedby="config-description">
    <DialogHeader>
      <DialogTitle>Configure {selectedNode?.data.label}</DialogTitle>
      <DialogDescription id="config-description">
        Edit the settings for this node.
      </DialogDescription>
    </DialogHeader>
    {/* Form content */}
  </DialogContent>
</Dialog>
```

## Loading States

```tsx
// List loading
function AutomationsList() {
  const { automations, isLoading } = useAutomations();

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading automations">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return <DataTable data={automations} ... />;
}

// Editor loading
function FlowEditor({ automationId }: { automationId: string }) {
  const { data, isLoading } = useAutomation(automationId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" role="status">
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return <FlowCanvas nodes={data.nodes} edges={data.edges} />;
}

// Save indicator
function SaveIndicator({ isSaving }: { isSaving: boolean }) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      {isSaving ? (
        <>
          <div className="h-2 w-2 rounded-full bg-status-warning animate-pulse" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-status-active" />
          <span>Saved</span>
        </>
      )}
    </div>
  );
}
```

## Dark Mode Support

React Flow supports dark mode via `colorMode` prop:

```tsx
import { ReactFlow } from '@xyflow/react';
import { useTheme } from 'next-themes';

function FlowCanvas() {
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <ReactFlow
      colorMode={colorMode}
      // React Flow automatically applies dark theme styles
    />
  );
}
```

### Custom Dark Mode Styles

```css
/* In index.css or component styles */
.react-flow.dark {
  --rf-background: hsl(var(--background));
  --rf-node-bg: hsl(var(--card));
  --rf-node-border: hsl(var(--border));
  --rf-edge: hsl(var(--muted-foreground));
  --rf-edge-selected: hsl(var(--primary));
}

/* Minimap dark mode */
.react-flow__minimap.dark {
  background-color: hsl(var(--card));
}

.react-flow__minimap-node {
  fill: hsl(var(--muted));
}
```

## Permission Guards

```tsx
// Automations page
import { useCanManage } from '@/hooks/useCanManage';
import { PermissionGuard } from '@/components/PermissionGuard';

function Automations() {
  const canManageWebhooks = useCanManage('manage_webhooks');

  return (
    <PermissionGuard permission="manage_webhooks" redirectTo="/ari">
      <div className="flex h-full">
        {/* Content */}
        
        {/* Only show mutation buttons if permitted */}
        {canManageWebhooks && (
          <Button onClick={createAutomation}>
            <Plus size={16} aria-hidden="true" />
            New Automation
          </Button>
        )}
      </div>
    </PermissionGuard>
  );
}

// Delete confirmation
function DeleteButton({ automationId }: { automationId: string }) {
  const canManage = useCanManage('manage_webhooks');

  if (!canManage) return null;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <IconButton
          label="Delete automation"
          variant="ghost"
          size="sm"
        >
          <Trash01 size={16} />
        </IconButton>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {/* Confirmation dialog */}
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

## Reduced Motion Support

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

function FlowEditor() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ReactFlow
      // Disable animations if reduced motion preferred
      fitViewOptions={{
        duration: prefersReducedMotion ? 0 : 400,
      }}
      defaultEdgeOptions={{
        animated: !prefersReducedMotion,
      }}
    />
  );
}

// Node animations
function BaseNode({ selected }: BaseNodeProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
    >
      {/* Node content */}
    </motion.div>
  );
}
```
