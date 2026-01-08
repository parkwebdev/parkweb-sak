# Pilot Automations Architecture

> **Version**: 1.0  
> **Status**: Planning  
> **Created**: January 2026  
> **Related**: [Architecture](./ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Edge Functions](./EDGE_FUNCTIONS.md), [Security](./SECURITY.md)

A comprehensive plan for implementing a visual automation/flow builder that will replace Custom Tools and Webhooks with a unified, node-based workflow system.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Goals & Non-Goals](#goals--non-goals)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Node Types](#node-types)
6. [Execution Engine](#execution-engine)
7. [Security Considerations](#security-considerations)
8. [Type Safety Requirements](#type-safety-requirements)
9. [Frontend Implementation](#frontend-implementation)
10. [Migration Strategy](#migration-strategy)
11. [Implementation Phases](#implementation-phases)
12. [Testing Strategy](#testing-strategy)
13. [Performance Considerations](#performance-considerations)

---

## Executive Summary

### Current State

The Pilot platform currently has two separate systems for extending agent behavior:

1. **Custom Tools** (`agent_tools` table): HTTP endpoints the AI can call during conversations
2. **Webhooks** (`webhooks` table): Outbound HTTP calls triggered by events

**Problems with current architecture:**
- Two separate UIs for similar functionality
- Limited composability (can't chain tools → webhooks)
- No conditional logic or branching
- No visual representation of data flow
- Difficult to debug complex integrations
- No built-in retry/error handling logic

### Proposed Solution

A unified **Automations** system using React Flow to create visual workflows that:
- Replace both Custom Tools and Webhooks
- Enable multi-step, conditional workflows
- Provide visual debugging and testing
- Support bi-directional AI integration (AI triggers flows, flows trigger AI)

---

## Goals & Non-Goals

### Goals

| Goal | Description |
|------|-------------|
| **Unification** | Single system replaces both tools and webhooks |
| **Visual Builder** | Drag-and-drop node-based workflow editor |
| **AI Integration** | Workflows can be triggered by AI and call AI |
| **Type Safety** | Full TypeScript coverage, no `any` types |
| **Security** | RLS policies, SSRF protection, input validation |
| **Debuggability** | Execution logs, test mode, step-by-step inspection |
| **Composability** | Nodes can be chained, branched, and looped |
| **Migration Path** | Existing tools/webhooks migrate to new system |

### Non-Goals (v1)

| Non-Goal | Rationale |
|----------|-----------|
| Self-hosted execution | All execution happens in Supabase Edge Functions |
| Custom code nodes | Security risk; defer to external endpoints |
| Multi-agent workflows | Single agent "Ari" model; revisit if model changes |
| Real-time streaming | HTTP request/response model initially |
| Workflow versioning | Track in v2 after core is stable |
| Marketplace/sharing | Enterprise feature for later |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                              │
├─────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│   │   FlowEditor    │  │   NodeSidebar   │  │  ExecutionLogs  │     │
│   │   (React Flow)  │  │   (Drag/Drop)   │  │   (History)     │     │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│            │                    │                    │               │
│   ┌────────┴────────────────────┴────────────────────┴────────┐     │
│   │                    useAutomations Hook                     │     │
│   │   (CRUD, validation, execution, real-time subscription)   │     │
│   └────────────────────────────┬──────────────────────────────┘     │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────┐
│                        Supabase Layer                                │
├────────────────────────────────┼────────────────────────────────────┤
│   ┌────────────────────────────┴───────────────────────────────┐    │
│   │                     Database (PostgreSQL)                   │    │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │    │
│   │  │ automations  │  │ automation_  │  │   automation_    │  │    │
│   │  │   (flows)    │  │    nodes     │  │   executions     │  │    │
│   │  └──────────────┘  └──────────────┘  └──────────────────┘  │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                    Edge Functions                           │    │
│   │  ┌──────────────────┐  ┌──────────────────────────────┐    │    │
│   │  │ execute-         │  │ trigger-automation           │    │    │
│   │  │   automation     │  │ (event-based invocation)     │    │    │
│   │  └──────────────────┘  └──────────────────────────────┘    │    │
│   └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Trigger    │────▶│  Execution   │────▶│   Action     │
│   (Event)    │     │   Engine     │     │   Nodes      │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴───────┐
                    │  Conditions  │
                    │  (Branching) │
                    └──────────────┘
```

---

## Database Schema

### Tables

#### `automations`

Main automation/workflow definition.

```sql
CREATE TABLE public.automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,  -- Owner for RLS
  
  -- Metadata
  name text NOT NULL,
  description text,
  icon text,  -- Icon name for display
  color text,  -- Accent color for display
  
  -- Status
  status text NOT NULL DEFAULT 'draft',  -- 'draft' | 'active' | 'paused' | 'error'
  enabled boolean NOT NULL DEFAULT false,
  
  -- Trigger configuration (denormalized for query efficiency)
  trigger_type text NOT NULL,  -- 'event' | 'schedule' | 'manual' | 'ai_tool'
  trigger_config jsonb NOT NULL DEFAULT '{}',
  
  -- React Flow data (serialized graph)
  nodes jsonb NOT NULL DEFAULT '[]',
  edges jsonb NOT NULL DEFAULT '[]',
  viewport jsonb,  -- { x, y, zoom }
  
  -- Execution settings
  timeout_ms integer DEFAULT 30000,
  retry_config jsonb DEFAULT '{"maxRetries": 3, "backoffMs": 1000}',
  
  -- AI Tool exposure (if trigger_type = 'ai_tool')
  tool_name text,  -- Function name for AI
  tool_description text,  -- AI-readable description
  tool_parameters jsonb,  -- JSON Schema for parameters
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_executed_at timestamptz,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'paused', 'error')),
  CONSTRAINT valid_trigger_type CHECK (trigger_type IN ('event', 'schedule', 'manual', 'ai_tool')),
  CONSTRAINT tool_name_required CHECK (
    trigger_type != 'ai_tool' OR (tool_name IS NOT NULL AND tool_description IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_automations_agent ON automations(agent_id);
CREATE INDEX idx_automations_user ON automations(user_id);
CREATE INDEX idx_automations_trigger ON automations(trigger_type) WHERE enabled = true;
CREATE INDEX idx_automations_tool_name ON automations(agent_id, tool_name) WHERE trigger_type = 'ai_tool' AND enabled = true;

-- RLS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible automations"
ON automations FOR SELECT
USING (has_account_access(user_id));

CREATE POLICY "Users can create automations"
ON automations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update accessible automations"
ON automations FOR UPDATE
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible automations"
ON automations FOR DELETE
USING (has_account_access(user_id));
```

#### `automation_executions`

Execution history and logs.

```sql
CREATE TABLE public.automation_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  
  -- Execution context
  trigger_type text NOT NULL,
  trigger_data jsonb,  -- Input data from trigger
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'running',  -- 'running' | 'completed' | 'failed' | 'timeout'
  
  -- Timing
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  duration_ms integer,
  
  -- Results
  output jsonb,  -- Final output data
  error text,  -- Error message if failed
  
  -- Step-by-step log
  node_logs jsonb NOT NULL DEFAULT '[]',
  /*
   * Array of:
   * {
   *   nodeId: string,
   *   nodeName: string,
   *   nodeType: string,
   *   status: 'running' | 'completed' | 'failed' | 'skipped',
   *   startedAt: string,
   *   completedAt: string,
   *   input: Record<string, unknown>,
   *   output: Record<string, unknown>,
   *   error?: string
   * }
   */
  
  -- Test mode flag
  test_mode boolean NOT NULL DEFAULT false,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'timeout'))
);

-- Indexes
CREATE INDEX idx_executions_automation ON automation_executions(automation_id);
CREATE INDEX idx_executions_status ON automation_executions(status) WHERE status = 'running';
CREATE INDEX idx_executions_conversation ON automation_executions(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_executions_started ON automation_executions(started_at DESC);

-- RLS (inherited from automation ownership)
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view execution logs"
ON automation_executions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM automations a 
    WHERE a.id = automation_id AND has_account_access(a.user_id)
  )
);

-- Service role can insert (edge functions)
CREATE POLICY "Service can insert executions"
ON automation_executions FOR INSERT
WITH CHECK (true);  -- Only service role can bypass RLS

CREATE POLICY "Service can update executions"
ON automation_executions FOR UPDATE
USING (true);  -- Only service role can bypass RLS
```

### JSONB Type Definitions

Add to `src/types/metadata.ts`:

```typescript
/**
 * Automation node definition (stored in automations.nodes)
 */
export interface AutomationNode {
  id: string;
  type: AutomationNodeType;
  position: { x: number; y: number };
  data: AutomationNodeData;
  measured?: { width: number; height: number };
}

export type AutomationNodeType = 
  | 'trigger'
  | 'action'
  | 'condition'
  | 'transform'
  | 'ai'
  | 'delay'
  | 'loop';

export interface AutomationNodeData {
  label: string;
  config: Record<string, unknown>;
  // Type-specific fields added by each node type
}

/**
 * Automation edge definition (stored in automations.edges)
 */
export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;  // For condition branches
  targetHandle?: string;
  animated?: boolean;
  data?: {
    condition?: string;  // For condition edges
  };
}

/**
 * Trigger configuration by type
 */
export interface TriggerConfigEvent {
  eventType: AutomationEventType;
  filters?: Record<string, unknown>;
}

export interface TriggerConfigSchedule {
  cron: string;
  timezone: string;
}

export interface TriggerConfigAITool {
  toolName: string;
  toolDescription: string;
  parameters: JSONSchema;
}

export type AutomationEventType =
  | 'conversation.created'
  | 'conversation.closed'
  | 'conversation.human_takeover'
  | 'lead.created'
  | 'lead.updated'
  | 'lead.stage_changed'
  | 'booking.created'
  | 'booking.cancelled'
  | 'message.received'
  | 'message.sent';

/**
 * Retry configuration
 */
export interface AutomationRetryConfig {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier?: number;
}

/**
 * Execution node log entry
 */
export interface AutomationNodeLog {
  nodeId: string;
  nodeName: string;
  nodeType: AutomationNodeType;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}
```

---

## Node Types

### 1. Trigger Nodes

Entry points for automation execution.

| Type | Description | Config |
|------|-------------|--------|
| **Event Trigger** | Fires on database/system events | `{ eventType, filters }` |
| **Schedule Trigger** | Cron-based execution | `{ cron, timezone }` |
| **Manual Trigger** | Button-click execution | `{ }` |
| **AI Tool Trigger** | Exposed as AI function | `{ toolName, description, parameters }` |

### 2. Action Nodes

Perform operations.

| Type | Description | Config |
|------|-------------|--------|
| **HTTP Request** | Call external API | `{ url, method, headers, body, auth }` |
| **Send Email** | Send via Resend | `{ to, subject, template, variables }` |
| **Send SMS** | Send via Twilio (future) | `{ to, message }` |
| **Update Lead** | Modify lead data | `{ leadId, updates }` |
| **Create Lead** | Create new lead | `{ name, email, phone, data }` |
| **Update Conversation** | Modify conversation | `{ conversationId, updates }` |
| **AI Generate** | Generate text with AI | `{ prompt, model, maxTokens }` |
| **Notify Team** | Send in-app notification | `{ message, type }` |

### 3. Logic Nodes

Control flow.

| Type | Description | Config |
|------|-------------|--------|
| **Condition** | If/else branching | `{ conditions: ConditionGroup[] }` |
| **Switch** | Multi-branch by value | `{ field, cases }` |
| **Loop** | Iterate over array | `{ collection, itemVar }` |
| **Delay** | Wait before continuing | `{ durationMs }` |
| **Stop** | End execution | `{ output }` |

### 4. Transform Nodes

Data manipulation.

| Type | Description | Config |
|------|-------------|--------|
| **Set Variable** | Define variables | `{ variables: Record<string, expression> }` |
| **Map Data** | Transform object shape | `{ mapping }` |
| **Filter Array** | Filter items | `{ condition }` |
| **Aggregate** | Reduce/summarize | `{ operation, field }` |

---

## Execution Engine

### Edge Function: `execute-automation`

Core execution engine implemented as a Supabase Edge Function.

```typescript
// supabase/functions/execute-automation/index.ts

interface ExecuteRequest {
  automationId: string;
  triggerData?: Record<string, unknown>;
  conversationId?: string;
  testMode?: boolean;
}

interface ExecutionContext {
  automationId: string;
  executionId: string;
  variables: Map<string, unknown>;
  conversationId?: string;
  testMode: boolean;
  logger: Logger;
}

// Processing flow:
// 1. Validate request & load automation
// 2. Create execution record
// 3. Find trigger node
// 4. Execute nodes in topological order
// 5. Handle conditions/branching
// 6. Update execution record with results
```

### Node Executor Pattern

Each node type has a dedicated executor:

```typescript
// supabase/functions/_shared/automation/executors/index.ts

interface NodeExecutor<TConfig = unknown, TOutput = unknown> {
  type: AutomationNodeType;
  execute: (
    node: AutomationNode,
    context: ExecutionContext,
    input: Record<string, unknown>
  ) => Promise<TOutput>;
  validate?: (config: TConfig) => ValidationResult;
}

// Registry pattern
const executors = new Map<string, NodeExecutor>();
executors.set('http-request', httpRequestExecutor);
executors.set('condition', conditionExecutor);
executors.set('ai-generate', aiGenerateExecutor);
// ...
```

### Variable Resolution

Variables use a template syntax for dynamic values:

```typescript
// Expression: "Hello {{lead.name}}, your status is {{lead.status}}"
// Context: { lead: { name: "John", status: "new" } }
// Result: "Hello John, your status is new"

function resolveTemplate(
  template: string | object,
  context: Record<string, unknown>
): unknown {
  // Handle nested paths: "lead.data.customField"
  // Handle array access: "items[0].name"
  // Handle fallbacks: "{{name | 'Unknown'}}"
}
```

---

## Security Considerations

### 1. SSRF Protection

All HTTP request nodes must validate URLs:

```typescript
// supabase/functions/_shared/automation/security/url-validator.ts

const BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/0\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,  // AWS metadata
  /^https?:\/\/\[::1\]/,
  /^https?:\/\/metadata\.google/,
];

export function validateUrl(url: string): ValidationResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(url)) {
      return { valid: false, error: 'Internal/private URLs are not allowed' };
    }
  }
  return { valid: true };
}
```

### 2. Rate Limiting

Protect against runaway automations:

```typescript
const RATE_LIMITS = {
  maxExecutionsPerMinute: 60,
  maxNodesPerExecution: 50,
  maxExecutionDurationMs: 30000,
  maxHttpRequestsPerExecution: 10,
};
```

### 3. RLS Policies

All tables use `has_account_access()` pattern:

- Automations: User can only access their own or team's
- Executions: Inherited from automation ownership
- No cross-tenant data access

### 4. Input Validation

All node configs validated with Zod schemas:

```typescript
const httpRequestConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  auth: z.discriminatedUnion('type', [
    z.object({ type: z.literal('none') }),
    z.object({ type: z.literal('bearer'), token: z.string() }),
    z.object({ type: z.literal('basic'), username: z.string(), password: z.string() }),
    z.object({ type: z.literal('api_key'), key: z.string(), header: z.string() }),
  ]).optional(),
  timeoutMs: z.number().min(1000).max(30000).optional(),
});
```

### 5. Secret Management

Sensitive values stored as references:

```typescript
// Node config stores reference, not value
{
  auth: {
    type: 'bearer',
    token: '{{secrets.EXTERNAL_API_KEY}}'  // Reference
  }
}

// Edge function resolves from environment
const token = Deno.env.get('EXTERNAL_API_KEY');
```

---

## Type Safety Requirements

### TypeScript Standards

Following project standards from `DEVELOPMENT_STANDARDS.md`:

1. **No `: any`** - All parameters explicitly typed
2. **`catch (error: unknown)`** - Type-safe error handling
3. **Shared types in `src/types/`** - Canonical metadata types
4. **`getErrorMessage()`** - Consistent error extraction

### Frontend Types

```typescript
// src/types/automations.ts

import type { Tables } from '@/integrations/supabase/types';
import type { Node, Edge } from '@xyflow/react';

export type Automation = Tables<'automations'>;
export type AutomationExecution = Tables<'automation_executions'>;

// React Flow node with typed data
export interface AutomationFlowNode extends Node {
  type: AutomationNodeType;
  data: AutomationNodeData;
}

// React Flow edge with typed data
export interface AutomationFlowEdge extends Edge {
  data?: {
    condition?: string;
    label?: string;
  };
}
```

### Edge Function Types

```typescript
// supabase/functions/_shared/types/automations.ts

export interface ExecutionContext {
  automationId: string;
  executionId: string;
  variables: Map<string, unknown>;
  conversationId?: string;
  testMode: boolean;
  startedAt: number;
  logger: Logger;
}

export interface NodeResult<T = unknown> {
  success: boolean;
  output?: T;
  error?: string;
  durationMs: number;
}
```

---

## Frontend Implementation

### File Structure

```
src/
├── pages/
│   └── Automations.tsx              # Main page component
│
├── components/
│   └── automations/
│       ├── FlowEditor.tsx           # React Flow wrapper
│       ├── NodeSidebar.tsx          # Draggable node palette
│       ├── ExecutionPanel.tsx       # Test & execution logs
│       ├── AutomationHeader.tsx     # Name, status, actions
│       │
│       ├── nodes/                   # Custom node components
│       │   ├── index.ts             # nodeTypes export
│       │   ├── BaseNode.tsx         # Shared node wrapper
│       │   ├── TriggerNode.tsx      # Event/schedule/manual triggers
│       │   ├── ActionNode.tsx       # HTTP, email, database actions
│       │   ├── ConditionNode.tsx    # If/else branching
│       │   ├── TransformNode.tsx    # Data transformation
│       │   ├── AINode.tsx           # AI generation
│       │   └── DelayNode.tsx        # Wait/delay
│       │
│       ├── editors/                 # Node config editors
│       │   ├── HttpRequestEditor.tsx
│       │   ├── ConditionEditor.tsx
│       │   ├── TriggerEditor.tsx
│       │   └── ...
│       │
│       └── dialogs/
│           ├── CreateAutomationDialog.tsx
│           ├── TestAutomationDialog.tsx
│           └── ExecutionDetailDialog.tsx
│
├── hooks/
│   ├── useAutomations.ts            # CRUD + real-time
│   ├── useAutomationExecution.ts    # Run & monitor
│   └── useAutomationValidation.ts   # Flow validation
│
└── types/
    └── automations.ts               # Type definitions
```

### Hook Pattern

Following `useWebhooks.ts` as template:

```typescript
// src/hooks/useAutomations.ts

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { useAuth } from '@/hooks/useAuth';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import type { Automation } from '@/types/automations';

export function useAutomations(agentId: string) {
  const { user } = useAuth();
  const { accountOwnerId } = useAccountOwnerId();
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading, refetch } = useSupabaseQuery<Automation[]>({
    queryKey: queryKeys.automations.list(agentId),
    queryFn: async () => {
      if (!user || !agentId) return [];
      
      const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    realtime: {
      table: 'automations',
      filter: `agent_id=eq.${agentId}`,
    },
    enabled: !!user && !!agentId,
  });

  // ... CRUD methods following useWebhooks pattern
}
```

### Route Configuration

Add to `src/config/routes.ts`:

```typescript
// In ROUTE_CONFIG array
{
  id: 'automations',
  label: 'Automations',
  path: '/automations',
  requiredPermission: 'manage_webhooks',  // Reuse existing permission
  iconName: 'Dataflow03',
  shortcut: '⌥U',
  description: 'Build visual automation workflows',
  showInNav: true,
},
```

---

## Migration Strategy

### Phase 1: Parallel Operation

Both systems run simultaneously:
- New `automations` system available at `/automations`
- Existing `webhooks` and `agent_tools` continue working
- No automatic migration

### Phase 2: Migration Tools

Provide migration utilities:

```typescript
// src/lib/automation-migration.ts

export async function migrateWebhookToAutomation(
  webhookId: string
): Promise<Automation> {
  // Load webhook
  // Create automation with equivalent trigger/action
  // Return new automation (webhook unchanged)
}

export async function migrateToolToAutomation(
  toolId: string
): Promise<Automation> {
  // Load agent_tool
  // Create automation with AI tool trigger
  // Return new automation (tool unchanged)
}
```

### Phase 3: Deprecation

After validation period:
1. Show deprecation warnings in old UIs
2. Encourage migration via in-app prompts
3. Stop allowing new webhook/tool creation
4. Eventually remove old tables (major version)

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Basic infrastructure and empty canvas

- [ ] Install `@xyflow/react` package
- [ ] Create database migration for `automations` and `automation_executions` tables
- [ ] Add types to `src/types/automations.ts` and `src/types/metadata.ts`
- [ ] Add query keys to `src/lib/query-keys.ts`
- [ ] Create `useAutomations` hook with CRUD operations
- [ ] Add route to `src/config/routes.ts`
- [ ] Create basic `Automations.tsx` page with React Flow canvas
- [ ] Create `FlowEditor.tsx` wrapper with drag-drop support
- [ ] Create `NodeSidebar.tsx` with placeholder categories

**Deliverable:** Empty flow editor accessible at `/automations`

### Phase 2: Node System (Week 2)

**Goal:** Core node types with visual representation

- [ ] Create `BaseNode.tsx` with consistent styling
- [ ] Implement `TriggerNode.tsx` (event, manual)
- [ ] Implement `ActionNode.tsx` (placeholder)
- [ ] Implement `ConditionNode.tsx` with true/false handles
- [ ] Create node configuration panels
- [ ] Implement node selection and property editing
- [ ] Add edge validation (source → target type rules)
- [ ] Persist nodes/edges to database

**Deliverable:** Nodes can be added, connected, and saved

### Phase 3: HTTP Action (Week 3)

**Goal:** First working action node

- [ ] Create `HttpRequestEditor.tsx` with full config UI
- [ ] Create `execute-automation` edge function scaffold
- [ ] Implement HTTP request executor with SSRF protection
- [ ] Implement variable resolution in configs
- [ ] Add test execution mode
- [ ] Create `ExecutionPanel.tsx` with logs
- [ ] Add execution history query

**Deliverable:** Can create and test HTTP request automation

### Phase 4: Triggers (Week 4)

**Goal:** Event-based automation triggers

- [ ] Implement event trigger configuration
- [ ] Create `trigger-automation` edge function
- [ ] Add database triggers for events (lead.created, etc.)
- [ ] Implement condition node execution
- [ ] Add manual trigger button
- [ ] Real-time execution status updates

**Deliverable:** Automations trigger on real events

### Phase 5: AI Integration (Week 5)

**Goal:** Bidirectional AI ↔ Automation

- [ ] Implement AI Tool trigger type
- [ ] Register automations as tools in `widget-chat`
- [ ] Implement `AINode` for text generation
- [ ] Pass automation results back to conversation
- [ ] Add conversation context to executions

**Deliverable:** AI can call automations, automations can call AI

### Phase 6: Polish & Migration (Week 6)

**Goal:** Production-ready with migration path

- [ ] Create migration tools for webhooks → automations
- [ ] Create migration tools for tools → automations
- [ ] Add automation templates
- [ ] Implement remaining action nodes (email, lead update, etc.)
- [ ] Add execution retry logic
- [ ] Performance optimization
- [ ] Documentation

**Deliverable:** Complete system ready for migration

---

## Testing Strategy

### Unit Tests

```typescript
// Node executors
describe('HttpRequestExecutor', () => {
  it('should make GET request with resolved variables');
  it('should block internal URLs (SSRF protection)');
  it('should timeout after configured duration');
  it('should handle authentication headers');
});

// Variable resolution
describe('resolveTemplate', () => {
  it('should resolve simple variable paths');
  it('should handle nested object paths');
  it('should handle array index access');
  it('should use fallback for undefined values');
});
```

### Integration Tests

```typescript
// Execution flow
describe('AutomationExecution', () => {
  it('should execute nodes in correct order');
  it('should follow condition branches correctly');
  it('should handle execution errors gracefully');
  it('should create complete execution log');
});
```

### E2E Tests

- Create automation via UI
- Add and connect nodes
- Configure HTTP action
- Test execution
- Verify logs

---

## Performance Considerations

### Database

- Indexes on `agent_id`, `user_id`, `trigger_type`
- Partial indexes for active automations
- JSONB containment queries for trigger matching
- Execution log retention policy (30 days default)

### Edge Functions

- Parallel node execution where possible
- Connection pooling for database
- Streaming execution logs via realtime
- Timeout enforcement per-node and per-automation

### Frontend

- React Flow virtualization (built-in)
- Lazy-load node editors
- Debounced auto-save
- Optimistic UI updates

---

## Appendix: React Flow Integration

### Required Dependencies

```bash
bun add @xyflow/react
```

### Key Concepts

1. **Nodes**: Visual elements with position, type, data
2. **Edges**: Connections between node handles
3. **Handles**: Connection points on nodes (source/target)
4. **Custom Nodes**: React components for specialized behavior
5. **Node Types**: Registry mapping type strings to components

### Theme Integration

```typescript
// Dark mode support
const colorMode = theme === 'dark' ? 'dark' : 'light';

<ReactFlow
  colorMode={colorMode}
  proOptions={{ hideAttribution: true }}
  fitView
>
  <Background variant={BackgroundVariant.Dots} />
  <Controls />
  <MiniMap />
</ReactFlow>
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | - | Initial planning document |
