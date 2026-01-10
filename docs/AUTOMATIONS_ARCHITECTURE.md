# Automations Architecture

> **Version**: 1.8  
> **Status**: Implementation Complete (100%)  
> **Created**: January 2026  
> **Last Updated**: January 10, 2026  
> **Related**: [Architecture](./ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Edge Functions](./EDGE_FUNCTIONS.md), [Security](./SECURITY.md)

A visual automation/flow builder that replaces Custom Tools and Webhooks with a unified, node-based workflow system. **Implementation is 100% complete.**

## Recent Updates (v1.8)

- **Visual Branching**: Condition nodes now display Yes/No edge labels with color-coded handles (green/red)
- **Node Validation**: Real-time validation prevents publishing incomplete automations
- **Template Library**: Create automations from pre-built templates for faster onboarding

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Schema](#2-database-schema)
3. [Node Types](#3-node-types)
4. [Execution Engine](#4-execution-engine)
5. [Security](#5-security)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Best Practices & Patterns](#7-best-practices--patterns)
8. [Implementation Phases](#8-implementation-phases-temporary)
9. [Migration Strategy](#9-migration-strategy)
10. [React Flow Patterns](#10-react-flow-patterns)
11. [Documentation Checklist](#11-documentation-checklist)

---

## 1. Overview

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

### Goals & Non-Goals

#### Goals

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

#### Non-Goals (v1)

| Non-Goal | Rationale |
|----------|-----------|
| Self-hosted execution | All execution happens in Supabase Edge Functions |
| Custom code nodes | Security risk; defer to external endpoints |
| Multi-agent workflows | Single agent "Ari" model; revisit if model changes |
| Real-time streaming | HTTP request/response model initially |
| Workflow versioning | Track in v2 after core is stable |
| Marketplace/sharing | Enterprise feature for later |

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
│   │  ┌──────────────┐  ┌──────────────────┐                    │    │
│   │  │ automations  │  │   automation_    │                    │    │
│   │  │   (flows)    │  │   executions     │                    │    │
│   │  └──────────────┘  └──────────────────┘                    │    │
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

## 2. Database Schema

### Tables

#### `automations`

Stores automation flow definitions.

```sql
CREATE TABLE public.automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Zap',
  color TEXT DEFAULT 'blue',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'error')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Trigger configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'event',      -- Lead/conversation events
    'schedule',   -- Cron-based
    'manual',     -- User-initiated
    'ai_tool'     -- Called by AI as a tool
  )),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  
  -- Flow definition (React Flow format)
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
  
  -- Execution stats
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  last_execution_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_automations_agent ON public.automations(agent_id);
CREATE INDEX idx_automations_user ON public.automations(user_id);
CREATE INDEX idx_automations_status ON public.automations(status) WHERE enabled = true;
CREATE INDEX idx_automations_trigger ON public.automations(trigger_type) WHERE enabled = true;

-- Trigger for updated_at
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

#### `automation_executions`

Stores execution history for debugging and analytics.

```sql
CREATE TABLE public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  
  -- Trigger context
  trigger_type TEXT NOT NULL,
  trigger_data JSONB,
  
  -- Execution state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )),
  
  -- Results
  nodes_executed JSONB DEFAULT '[]',
  variables JSONB DEFAULT '{}',
  error TEXT,
  error_node_id TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Flags
  test_mode BOOLEAN NOT NULL DEFAULT false,
  
  -- Context
  triggered_by UUID, -- User ID if manual
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_executions_automation ON public.automation_executions(automation_id);
CREATE INDEX idx_executions_status ON public.automation_executions(status);
CREATE INDEX idx_executions_started ON public.automation_executions(started_at DESC);
CREATE INDEX idx_executions_lead ON public.automation_executions(lead_id) WHERE lead_id IS NOT NULL;
```

### RLS Policies

#### `automations` Policies

```sql
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view automations in their account"
  ON public.automations FOR SELECT
  USING (public.has_account_access(user_id));

CREATE POLICY "Users can create automations in their account"
  ON public.automations FOR INSERT
  WITH CHECK (
    public.has_account_access(user_id)
    AND agent_id IN (
      SELECT id FROM public.agents 
      WHERE public.has_account_access(agents.user_id)
    )
  );

CREATE POLICY "Users can update automations in their account"
  ON public.automations FOR UPDATE
  USING (public.has_account_access(user_id))
  WITH CHECK (public.has_account_access(user_id));

CREATE POLICY "Users can delete automations in their account"
  ON public.automations FOR DELETE
  USING (public.has_account_access(user_id));
```

#### `automation_executions` Policies

```sql
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view executions for their automations"
  ON public.automation_executions FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM public.automations 
      WHERE public.has_account_access(user_id)
    )
  );

CREATE POLICY "Users can delete executions for their automations"
  ON public.automation_executions FOR DELETE
  USING (
    automation_id IN (
      SELECT id FROM public.automations 
      WHERE public.has_account_access(user_id)
    )
  );
```

### DB Select Columns

Add to `src/lib/db-selects.ts`:

```typescript
export const AUTOMATION_LIST_COLUMNS = `
  id,
  agent_id,
  user_id,
  name,
  description,
  icon,
  color,
  status,
  enabled,
  trigger_type,
  trigger_config,
  execution_count,
  last_executed_at,
  last_execution_status,
  created_at,
  updated_at
`;

export const AUTOMATION_DETAIL_COLUMNS = `
  id,
  agent_id,
  user_id,
  name,
  description,
  icon,
  color,
  status,
  enabled,
  trigger_type,
  trigger_config,
  nodes,
  edges,
  viewport,
  execution_count,
  last_executed_at,
  last_execution_status,
  created_at,
  updated_at
`;

export const AUTOMATION_EXECUTION_LIST_COLUMNS = `
  id,
  automation_id,
  trigger_type,
  trigger_data,
  status,
  error,
  error_node_id,
  started_at,
  completed_at,
  duration_ms,
  test_mode,
  triggered_by,
  lead_id,
  conversation_id
`;

export const AUTOMATION_EXECUTION_DETAIL_COLUMNS = `
  id,
  automation_id,
  trigger_type,
  trigger_data,
  status,
  nodes_executed,
  variables,
  error,
  error_node_id,
  started_at,
  completed_at,
  duration_ms,
  test_mode,
  triggered_by,
  lead_id,
  conversation_id
`;
```

### Query Keys

Add to `src/lib/query-keys.ts`:

```typescript
automations: {
  all: ['automations'] as const,
  lists: () => [...queryKeys.automations.all, 'list'] as const,
  list: (agentId: string) => [...queryKeys.automations.lists(), agentId] as const,
  details: () => [...queryKeys.automations.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.automations.details(), id] as const,
  executions: {
    all: (automationId: string) => [...queryKeys.automations.detail(automationId), 'executions'] as const,
    list: (automationId: string, filters?: { status?: string }) => 
      [...queryKeys.automations.executions.all(automationId), filters] as const,
    detail: (executionId: string) => 
      [...queryKeys.automations.all, 'execution', executionId] as const,
  },
},
```

### Database Triggers

#### Event-Based Automation Firing

```sql
CREATE OR REPLACE FUNCTION public.fire_lead_automations()
RETURNS TRIGGER AS $$
DECLARE
  automation RECORD;
  trigger_data JSONB;
BEGIN
  trigger_data := jsonb_build_object(
    'event', TG_OP,
    'table', TG_TABLE_NAME,
    'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
    'timestamp', now()
  );

  FOR automation IN
    SELECT a.id
    FROM public.automations a
    WHERE a.enabled = true
      AND a.status = 'active'
      AND a.trigger_type = 'event'
      AND a.trigger_config->>'event_source' = 'lead'
      AND (
        a.trigger_config->>'event_type' = TG_OP
        OR a.trigger_config->>'event_type' = 'any'
      )
      AND a.user_id = COALESCE(NEW.user_id, OLD.user_id)
  LOOP
    PERFORM pg_notify(
      'automation_trigger',
      jsonb_build_object(
        'automation_id', automation.id,
        'trigger_data', trigger_data
      )::text
    );
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_lead_automations
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.fire_lead_automations();
```

#### Conversation Event Trigger

```sql
CREATE OR REPLACE FUNCTION public.fire_conversation_automations()
RETURNS TRIGGER AS $$
DECLARE
  automation RECORD;
  trigger_data JSONB;
  owner_id UUID;
BEGIN
  SELECT agents.user_id INTO owner_id
  FROM public.agents
  WHERE agents.id = COALESCE(NEW.agent_id, OLD.agent_id);

  trigger_data := jsonb_build_object(
    'event', TG_OP,
    'table', TG_TABLE_NAME,
    'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
    'timestamp', now()
  );

  FOR automation IN
    SELECT a.id
    FROM public.automations a
    WHERE a.enabled = true
      AND a.status = 'active'
      AND a.trigger_type = 'event'
      AND a.trigger_config->>'event_source' = 'conversation'
      AND (
        a.trigger_config->>'event_type' = TG_OP
        OR a.trigger_config->>'event_type' = 'any'
      )
      AND a.user_id = owner_id
  LOOP
    PERFORM pg_notify(
      'automation_trigger',
      jsonb_build_object(
        'automation_id', automation.id,
        'trigger_data', trigger_data
      )::text
    );
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_conversation_automations
  AFTER INSERT OR UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.fire_conversation_automations();
```

#### Execution Stats Update

```sql
CREATE OR REPLACE FUNCTION public.update_automation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND OLD.status = 'running' THEN
    UPDATE public.automations
    SET 
      execution_count = execution_count + 1,
      last_executed_at = NEW.completed_at,
      last_execution_status = NEW.status
    WHERE id = NEW.automation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_automation_stats
  AFTER UPDATE ON public.automation_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_automation_stats();
```

#### Cleanup Job

```sql
CREATE OR REPLACE FUNCTION public.cleanup_old_executions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.automation_executions
  WHERE completed_at < now() - INTERVAL '30 days'
    AND status IN ('completed', 'cancelled');
    
  DELETE FROM public.automation_executions
  WHERE completed_at < now() - INTERVAL '7 days'
    AND status = 'failed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule: SELECT cron.schedule('cleanup-executions', '0 3 * * *', 'SELECT public.cleanup_old_executions()');
```

---

## 3. Node Types

### Node Categories

| Category | Purpose | Nodes |
|----------|---------|-------|
| Triggers | Start automation | Event, Schedule, Manual, AI Tool |
| Actions | Perform operations | HTTP Request, Send Email, Update Lead, Create Booking |
| Logic | Control flow | Condition, Switch, Loop, Delay, Stop |
| Transform | Data manipulation | Set Variable, Map Data, Filter Array, Aggregate |
| AI | AI operations | Generate Text, Classify, Extract |

### Base Node Interface

```typescript
// src/types/automations.ts

import type { Node, Edge } from '@xyflow/react';

export interface BaseNodeData {
  label: string;
  description?: string;
  disabled?: boolean;
}

export type AutomationNodeType =
  // Triggers
  | 'trigger-event'
  | 'trigger-schedule'
  | 'trigger-manual'
  | 'trigger-ai-tool'
  // Actions
  | 'action-http'
  | 'action-email'
  | 'action-update-lead'
  | 'action-create-booking'
  | 'action-send-message'
  // Logic
  | 'logic-condition'
  | 'logic-switch'
  | 'logic-loop'
  | 'logic-delay'
  | 'logic-stop'
  // Transform
  | 'transform-set-variable'
  | 'transform-map'
  | 'transform-filter'
  | 'transform-aggregate'
  // AI
  | 'ai-generate'
  | 'ai-classify'
  | 'ai-extract';

export type AutomationNode = Node<AutomationNodeData, AutomationNodeType>;

export type AutomationEdge = Edge<{
  condition?: string;
  label?: string;
}>;
```

### Trigger Nodes

#### Event Trigger

```typescript
import { z } from 'zod';

export const eventSourceSchema = z.enum(['lead', 'conversation', 'booking', 'message']);
export const eventTypeSchema = z.enum(['INSERT', 'UPDATE', 'DELETE', 'any']);

export const triggerEventConfigSchema = z.object({
  type: z.literal('trigger-event'),
  eventSource: eventSourceSchema,
  eventType: eventTypeSchema,
  conditions: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(['equals', 'not_equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'is_null', 'is_not_null']),
    value: z.unknown().optional(),
  })).optional(),
});

export type TriggerEventConfig = z.infer<typeof triggerEventConfigSchema>;

export interface TriggerEventNodeData extends BaseNodeData {
  config: TriggerEventConfig;
}
```

#### Schedule Trigger

```typescript
export const scheduleFrequencySchema = z.enum([
  'every_minute', 'every_5_minutes', 'every_15_minutes', 'every_30_minutes',
  'hourly', 'daily', 'weekly', 'monthly', 'custom',
]);

export const triggerScheduleConfigSchema = z.object({
  type: z.literal('trigger-schedule'),
  frequency: scheduleFrequencySchema,
  cronExpression: z.string().optional(),
  timezone: z.string().default('UTC'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type TriggerScheduleConfig = z.infer<typeof triggerScheduleConfigSchema>;

export interface TriggerScheduleNodeData extends BaseNodeData {
  config: TriggerScheduleConfig;
}
```

#### Manual Trigger

```typescript
export const triggerManualConfigSchema = z.object({
  type: z.literal('trigger-manual'),
  requireConfirmation: z.boolean().default(false),
  confirmationMessage: z.string().optional(),
  inputFields: z.array(z.object({
    name: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(['text', 'number', 'boolean', 'select']),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
});

export type TriggerManualConfig = z.infer<typeof triggerManualConfigSchema>;

export interface TriggerManualNodeData extends BaseNodeData {
  config: TriggerManualConfig;
}
```

#### AI Tool Trigger

```typescript
export const triggerAIToolConfigSchema = z.object({
  type: z.literal('trigger-ai-tool'),
  toolName: z.string().min(1).max(64).regex(/^[a-z_][a-z0-9_]*$/, 
    'Tool name must be lowercase with underscores'),
  toolDescription: z.string().min(10).max(500),
  parameters: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
    description: z.string().min(1),
    required: z.boolean().default(false),
  })),
  returnDescription: z.string().optional(),
});

export type TriggerAIToolConfig = z.infer<typeof triggerAIToolConfigSchema>;

export interface TriggerAIToolNodeData extends BaseNodeData {
  config: TriggerAIToolConfig;
}
```

### Action Nodes

#### HTTP Request

```typescript
export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const actionHttpConfigSchema = z.object({
  type: z.literal('action-http'),
  method: httpMethodSchema,
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  bodyType: z.enum(['json', 'form', 'raw']).default('json'),
  timeout: z.number().int().min(1000).max(30000).default(10000),
  retryCount: z.number().int().min(0).max(3).default(0),
  retryDelay: z.number().int().min(1000).max(60000).default(1000),
  successStatusCodes: z.array(z.number().int()).default([200, 201, 202, 204]),
  outputVariable: z.string().optional(),
});

export type ActionHttpConfig = z.infer<typeof actionHttpConfigSchema>;

export interface ActionHttpNodeData extends BaseNodeData {
  config: ActionHttpConfig;
}
```

#### Send Email

```typescript
export const actionEmailConfigSchema = z.object({
  type: z.literal('action-email'),
  to: z.string().min(1),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  bodyType: z.enum(['text', 'html']).default('html'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  replyTo: z.string().optional(),
  templateId: z.string().uuid().optional(),
});

export type ActionEmailConfig = z.infer<typeof actionEmailConfigSchema>;

export interface ActionEmailNodeData extends BaseNodeData {
  config: ActionEmailConfig;
}
```

#### Update Lead

```typescript
export const actionUpdateLeadConfigSchema = z.object({
  type: z.literal('action-update-lead'),
  leadId: z.string(),
  updates: z.record(z.unknown()),
  createIfNotExists: z.boolean().default(false),
});

export type ActionUpdateLeadConfig = z.infer<typeof actionUpdateLeadConfigSchema>;

export interface ActionUpdateLeadNodeData extends BaseNodeData {
  config: ActionUpdateLeadConfig;
}
```

#### Create Booking

```typescript
export const actionCreateBookingConfigSchema = z.object({
  type: z.literal('action-create-booking'),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string(),
  duration: z.number().int().min(5).max(480),
  locationId: z.string().uuid().optional(),
  visitorName: z.string().optional(),
  visitorEmail: z.string().optional(),
  visitorPhone: z.string().optional(),
  leadId: z.string().optional(),
});

export type ActionCreateBookingConfig = z.infer<typeof actionCreateBookingConfigSchema>;

export interface ActionCreateBookingNodeData extends BaseNodeData {
  config: ActionCreateBookingConfig;
}
```

### Logic Nodes

#### Condition

```typescript
export const conditionOperatorSchema = z.enum([
  'equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with',
  'gt', 'gte', 'lt', 'lte', 'is_empty', 'is_not_empty', 'is_null', 'is_not_null', 'matches_regex',
]);

export const conditionRuleSchema = z.object({
  field: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.unknown().optional(),
});

export const logicConditionConfigSchema = z.object({
  type: z.literal('logic-condition'),
  rules: z.array(conditionRuleSchema).min(1),
  logic: z.enum(['and', 'or']).default('and'),
});

export type LogicConditionConfig = z.infer<typeof logicConditionConfigSchema>;

export interface LogicConditionNodeData extends BaseNodeData {
  config: LogicConditionConfig;
}
```

#### Switch

```typescript
export const switchCaseSchema = z.object({
  label: z.string().min(1),
  value: z.unknown(),
  handleId: z.string(),
});

export const logicSwitchConfigSchema = z.object({
  type: z.literal('logic-switch'),
  expression: z.string().min(1),
  cases: z.array(switchCaseSchema).min(1),
  defaultHandleId: z.string(),
});

export type LogicSwitchConfig = z.infer<typeof logicSwitchConfigSchema>;

export interface LogicSwitchNodeData extends BaseNodeData {
  config: LogicSwitchConfig;
}
```

#### Loop

```typescript
export const logicLoopConfigSchema = z.object({
  type: z.literal('logic-loop'),
  arrayExpression: z.string().min(1),
  itemVariable: z.string().min(1).default('item'),
  indexVariable: z.string().min(1).default('index'),
  maxIterations: z.number().int().min(1).max(1000).default(100),
  continueOnError: z.boolean().default(false),
});

export type LogicLoopConfig = z.infer<typeof logicLoopConfigSchema>;

export interface LogicLoopNodeData extends BaseNodeData {
  config: LogicLoopConfig;
}
```

#### Delay

```typescript
export const delayUnitSchema = z.enum(['seconds', 'minutes', 'hours', 'days']);

export const logicDelayConfigSchema = z.object({
  type: z.literal('logic-delay'),
  duration: z.number().int().min(1),
  unit: delayUnitSchema,
  maxDelay: z.number().int().optional(),
});

export type LogicDelayConfig = z.infer<typeof logicDelayConfigSchema>;

export interface LogicDelayNodeData extends BaseNodeData {
  config: LogicDelayConfig;
}
```

#### Stop

```typescript
export const logicStopConfigSchema = z.object({
  type: z.literal('logic-stop'),
  status: z.enum(['success', 'failure', 'cancelled']).default('success'),
  message: z.string().optional(),
  outputVariable: z.string().optional(),
});

export type LogicStopConfig = z.infer<typeof logicStopConfigSchema>;

export interface LogicStopNodeData extends BaseNodeData {
  config: LogicStopConfig;
}
```

### Transform Nodes

#### Set Variable

```typescript
export const transformSetVariableConfigSchema = z.object({
  type: z.literal('transform-set-variable'),
  variables: z.array(z.object({
    name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    value: z.unknown(),
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']).optional(),
  })).min(1),
});

export type TransformSetVariableConfig = z.infer<typeof transformSetVariableConfigSchema>;

export interface TransformSetVariableNodeData extends BaseNodeData {
  config: TransformSetVariableConfig;
}
```

#### Map Data

```typescript
export const transformMapConfigSchema = z.object({
  type: z.literal('transform-map'),
  inputArray: z.string().min(1),
  outputVariable: z.string().min(1),
  mapping: z.record(z.string()),
});

export type TransformMapConfig = z.infer<typeof transformMapConfigSchema>;

export interface TransformMapNodeData extends BaseNodeData {
  config: TransformMapConfig;
}
```

#### Filter Array

```typescript
export const transformFilterConfigSchema = z.object({
  type: z.literal('transform-filter'),
  inputArray: z.string().min(1),
  outputVariable: z.string().min(1),
  condition: z.string().min(1),
});

export type TransformFilterConfig = z.infer<typeof transformFilterConfigSchema>;

export interface TransformFilterNodeData extends BaseNodeData {
  config: TransformFilterConfig;
}
```

### AI Nodes

#### AI Generate

```typescript
export const aiGenerateConfigSchema = z.object({
  type: z.literal('ai-generate'),
  prompt: z.string().min(1),
  model: z.enum(['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku']).default('gpt-4o-mini'),
  maxTokens: z.number().int().min(1).max(4096).default(500),
  temperature: z.number().min(0).max(2).default(0.7),
  outputVariable: z.string().min(1),
  outputFormat: z.enum(['text', 'json']).default('text'),
  jsonSchema: z.record(z.unknown()).optional(),
});

export type AIGenerateConfig = z.infer<typeof aiGenerateConfigSchema>;

export interface AIGenerateNodeData extends BaseNodeData {
  config: AIGenerateConfig;
}
```

#### AI Classify

```typescript
export const aiClassifyConfigSchema = z.object({
  type: z.literal('ai-classify'),
  input: z.string().min(1),
  categories: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  })).min(2),
  outputVariable: z.string().min(1),
  includeConfidence: z.boolean().default(false),
});

export type AIClassifyConfig = z.infer<typeof aiClassifyConfigSchema>;

export interface AIClassifyNodeData extends BaseNodeData {
  config: AIClassifyConfig;
}
```

#### AI Extract

```typescript
export const aiExtractConfigSchema = z.object({
  type: z.literal('ai-extract'),
  input: z.string().min(1),
  fields: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'boolean', 'array']),
    description: z.string().min(1),
    required: z.boolean().default(false),
  })).min(1),
  outputVariable: z.string().min(1),
});

export type AIExtractConfig = z.infer<typeof aiExtractConfigSchema>;

export interface AIExtractNodeData extends BaseNodeData {
  config: AIExtractConfig;
}
```

### Node Executor Interface

```typescript
export interface ExecutionContext {
  automationId: string;
  executionId: string;
  agentId: string;
  userId: string;
  variables: Record<string, unknown>;
  trigger: { type: string; data: unknown };
  testMode: boolean;
}

export interface NodeExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  nextHandleId?: string;
  variables?: Record<string, unknown>;
  duration_ms: number;
}

export type NodeExecutor<T extends BaseNodeData> = (
  node: Node<T>,
  context: ExecutionContext,
) => Promise<NodeExecutionResult>;

export type NodeExecutorRegistry = {
  [K in AutomationNodeType]: NodeExecutor<AutomationNodeData>;
};
```

### Variable Resolution

```typescript
export function resolveTemplate(
  template: string,
  variables: Record<string, unknown>,
): string;

export interface VariableNamespaces {
  trigger: { type: string; data: unknown; timestamp: string };
  lead?: LeadData;
  conversation?: ConversationData;
  booking?: BookingData;
  env: { now: string; today: string; agent_id: string };
  [customVariable: string]: unknown;
}
```

### UntitledUI Icon Imports

All icons must be imported from `@untitledui/icons/react/icons`:

```typescript
// src/components/automations/nodes/icons.ts
import {
  Zap,
  Clock,
  PlayCircle,
  Stars02,
  Globe02,
  Mail01,
  User01,
  Calendar,
  MessageSquare01,
  GitBranch01,
  SwitchHorizontal01,
  RefreshCw01,
  ClockStopwatch,
  StopCircle,
  Variable,
  Dataflow03,
  FilterLines,
  BarChart01,
  Tag01,
  FileSearch01,
} from '@untitledui/icons/react/icons';

export const nodeIcons = {
  'trigger-event': Zap,
  'trigger-schedule': Clock,
  'trigger-manual': PlayCircle,
  'trigger-ai-tool': Stars02,
  'action-http': Globe02,
  'action-email': Mail01,
  'action-update-lead': User01,
  'action-create-booking': Calendar,
  'action-send-message': MessageSquare01,
  'logic-condition': GitBranch01,
  'logic-switch': SwitchHorizontal01,
  'logic-loop': RefreshCw01,
  'logic-delay': ClockStopwatch,
  'logic-stop': StopCircle,
  'transform-set-variable': Variable,
  'transform-map': Dataflow03,
  'transform-filter': FilterLines,
  'transform-aggregate': BarChart01,
  'ai-generate': Stars02,
  'ai-classify': Tag01,
  'ai-extract': FileSearch01,
} as const;
```

Usage in components:

```tsx
import { nodeIcons } from './icons';

const Icon = nodeIcons[nodeType];
<Icon size={16} aria-hidden="true" />
```

---

## 4. Execution Engine

### Edge Function Structure

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

const executors = new Map<string, NodeExecutor>();
executors.set('http-request', httpRequestExecutor);
executors.set('condition', conditionExecutor);
executors.set('ai-generate', aiGenerateExecutor);
```

### Variable Resolution

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

## 5. Security

### SSRF Protection

#### Blocked URL Patterns

```typescript
// supabase/functions/_shared/url-validator.ts

const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]',
  '169.254.', '169.254.169.254',
  'metadata.google.internal', 'metadata.gke.internal',
  'supabase.co', 'supabase.com', 'supabase.net',
];

const BLOCKED_IP_RANGES = [
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' },
  { start: '100.64.0.0', end: '100.127.255.255' },
];

const BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'data:', 'javascript:'];

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

export function validateUrl(url: string): UrlValidationResult {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: `Protocol ${parsed.protocol} is not allowed.` };
    }

    const hostname = parsed.hostname.toLowerCase();
    for (const blocked of BLOCKED_HOSTS) {
      if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
        return { valid: false, error: `Host ${hostname} is not allowed.` };
      }
    }

    if (isPrivateIP(hostname)) {
      return { valid: false, error: 'Private IP addresses are not allowed.' };
    }

    return { valid: true, sanitizedUrl: parsed.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}
```

### Rate Limiting

```typescript
const RATE_LIMITS = {
  event: { maxExecutionsPerMinute: 60, maxExecutionsPerHour: 1000, maxConcurrent: 10 },
  schedule: { maxExecutionsPerMinute: 10, maxExecutionsPerHour: 100, maxConcurrent: 5 },
  manual: { maxExecutionsPerMinute: 30, maxExecutionsPerHour: 500, maxConcurrent: 5 },
  ai_tool: { maxExecutionsPerMinute: 100, maxExecutionsPerHour: 2000, maxConcurrent: 20 },
} as const;

interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}

async function checkRateLimit(
  automationId: string,
  triggerType: string,
  supabaseClient: SupabaseClient
): Promise<RateLimitCheck> {
  const limits = RATE_LIMITS[triggerType as keyof typeof RATE_LIMITS];
  if (!limits) return { allowed: true };

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check concurrent, per-minute, and per-hour limits
  // Return { allowed: false, reason, retryAfter } if exceeded
}
```

### Input Validation

```typescript
// supabase/functions/_shared/automation-schemas.ts

import { z } from 'zod';

export const executeAutomationRequestSchema = z.object({
  automationId: z.string().uuid(),
  triggerData: z.record(z.unknown()).optional(),
  testMode: z.boolean().default(false),
  triggeredBy: z.string().uuid().optional(),
});

export const variableNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid variable name');

export function validateTemplateString(template: string): boolean {
  const templateRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g;
  const withoutTemplates = template.replace(templateRegex, '');

  if (withoutTemplates.includes('{{') || withoutTemplates.includes('}}')) {
    return false;
  }

  const dangerousPatterns = [
    /eval\s*\(/i, /function\s*\(/i, /new\s+Function/i,
    /<script/i, /javascript:/i, /on\w+\s*=/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(template));
}
```

### Variable Resolution Security

```typescript
// supabase/functions/_shared/template-resolver.ts

export function resolveTemplate(
  template: string,
  variables: Record<string, unknown>,
  options: { maxDepth?: number; allowedNamespaces?: string[] } = {}
): string {
  const { maxDepth = 5, allowedNamespaces } = options;

  if (!validateTemplateString(template)) {
    throw new Error('Template contains invalid patterns');
  }

  return template.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_.]*)\}\}/g, (match, path) => {
    if (allowedNamespaces) {
      const namespace = path.split('.')[0];
      if (!allowedNamespaces.includes(namespace)) return match;
    }

    const value = getNestedValue(variables, path, maxDepth);
    if (value === undefined) return match;

    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string, maxDepth: number): unknown {
  const parts = path.split('.');
  if (parts.length > maxDepth) throw new Error(`Path exceeds maximum depth of ${maxDepth}`);

  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
      throw new Error('Invalid path: prototype access not allowed');
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
```

### Secret Management

```typescript
// Secrets are referenced, not stored in configs
const httpConfig = {
  type: 'action-http',
  url: 'https://api.example.com',
  headers: { 'Authorization': '{{secrets.API_KEY}}' },
};

async function resolveSecrets(
  config: Record<string, unknown>,
  agentId: string,
  supabaseClient: SupabaseClient
): Promise<Record<string, unknown>> {
  const secretPattern = /\{\{secrets\.([A-Z_][A-Z0-9_]*)\}\}/g;
  const configStr = JSON.stringify(config);
  const matches = [...configStr.matchAll(secretPattern)];

  if (matches.length === 0) return config;

  const secretNames = [...new Set(matches.map((m) => m[1]))];
  const secrets = await fetchSecrets(agentId, secretNames, supabaseClient);

  let resolved = configStr;
  for (const [placeholder, name] of matches) {
    const value = secrets[name];
    if (!value) throw new Error(`Secret ${name} not found`);
    resolved = resolved.replace(placeholder, value);
  }

  return JSON.parse(resolved);
}
```

### Edge Function Error Handling

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// supabase/functions/_shared/errors.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function createErrorResponse(status: number, message: string, details?: unknown): Response {
  return new Response(
    JSON.stringify({ error: message, ...(details ? { details } : {}) }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Audit Logging

```typescript
async function logSecurityEvent(
  supabaseClient: SupabaseClient,
  event: {
    action: string;
    resourceType: string;
    resourceId: string;
    userId?: string;
    success: boolean;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  await supabaseClient.from('security_logs').insert({
    action: event.action,
    resource_type: event.resourceType,
    resource_id: event.resourceId,
    user_id: event.userId,
    success: event.success,
    details: event.details,
  });
}
```

### Security Checklist

- [ ] All node configs validated with Zod schemas
- [ ] SSRF protection tested with private IPs and cloud metadata URLs
- [ ] Rate limiting configured per trigger type
- [ ] Secret references working (no plaintext secrets in configs)
- [ ] RLS policies tested for all operations
- [ ] Error messages don't leak sensitive information
- [ ] Template resolution prevents code injection
- [ ] Audit logging captures security events
- [ ] CORS headers properly configured
- [ ] Request timeouts configured on all HTTP calls

---

## 6. Frontend Implementation

### File Structure & Component Size Guidelines

```
src/
├── pages/
│   └── Automations.tsx                    # Main page (~150 lines max)
│
├── components/automations/
│   ├── AutomationsList.tsx                # DataTable list view (~200 lines max)
│   ├── AutomationCard.tsx                 # Card for grid view (~80 lines max)
│   ├── AutomationStatusBadge.tsx          # Status indicator (~40 lines)
│   ├── AutomationErrorBoundary.tsx        # Error boundary wrapper
│   │
│   ├── loading/
│   │   ├── AutomationsListSkeleton.tsx    # List loading state
│   │   ├── FlowEditorSkeleton.tsx         # Editor loading state
│   │   └── NodeConfigSkeleton.tsx         # Config panel loading
│   │
│   ├── editor/
│   │   ├── FlowEditor.tsx                 # React Flow wrapper (~150 lines max)
│   │   ├── FlowCanvas.tsx                 # Canvas with controls (~100 lines max)
│   │   ├── FlowToolbar.tsx                # Top toolbar (~80 lines max)
│   │   ├── FlowMinimap.tsx                # Minimap wrapper (~40 lines)
│   │   └── FlowControls.tsx               # Zoom/fit controls (~60 lines)
│   │
│   ├── sidebar/
│   │   ├── NodeSidebar.tsx                # Draggable palette (~120 lines max)
│   │   ├── NodeCategory.tsx               # Category group (~60 lines)
│   │   └── DraggableNode.tsx              # Draggable item (~50 lines)
│   │
│   ├── nodes/
│   │   ├── BaseNode.tsx                   # Shared node wrapper (~80 lines max)
│   │   ├── NodeHandle.tsx                 # Custom handle (~40 lines)
│   │   ├── icons.ts                       # Icon registry (~50 lines)
│   │   ├── index.ts                       # nodeTypes export
│   │   ├── triggers/                      # Trigger node components
│   │   ├── actions/                       # Action node components
│   │   ├── logic/                         # Logic node components
│   │   ├── transform/                     # Transform node components
│   │   └── ai/                            # AI node components
│   │
│   ├── panels/
│   │   ├── NodeConfigPanel.tsx            # Right panel (~200 lines max)
│   │   ├── TriggerConfigForm.tsx          # Trigger config (~150 lines max)
│   │   ├── ActionConfigForm.tsx           # Action config (~150 lines max)
│   │   ├── LogicConfigForm.tsx            # Logic config (~150 lines max)
│   │   └── ConditionBuilder.tsx           # Condition UI (~180 lines max)
│   │
│   ├── variables/
│   │   ├── VariablePicker.tsx             # Variable selector (~100 lines max)
│   │   ├── VariableChip.tsx               # Display chip (~40 lines)
│   │   └── VariableInput.tsx              # Input with picker (~80 lines)
│   │
│   └── execution/
│       ├── ExecutionHistory.tsx           # History list (~150 lines max)
│       ├── ExecutionTimeline.tsx          # Visual timeline (~120 lines max)
│       ├── ExecutionNodeStatus.tsx        # Node status (~60 lines)
│       └── TestRunDialog.tsx              # Test execution (~100 lines max)
│
├── hooks/
│   ├── useAutomations.ts                  # CRUD operations
│   ├── useAutomationsRealtime.ts          # With real-time subscriptions
│   ├── useAutomation.ts                   # Single automation
│   ├── useAutomationExecutions.ts         # Execution history
│   ├── useFlowState.ts                    # React Flow state
│   └── useNodeAnnouncements.ts            # Screen reader announcements
│
└── types/
    └── automations.ts                     # All type definitions
```

**Component Size Rules:**
- Page components: ~150 lines max
- Complex feature components (editor, panels): ~200 lines max
- Standard components: ~100 lines max
- Simple components (badges, chips): ~50 lines max
- If a component exceeds limits, extract sub-components

### Loading States & Skeletons

```tsx
// src/components/automations/loading/AutomationsListSkeleton.tsx

import { Skeleton } from '@/components/ui/skeleton';

export function AutomationsListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading automations">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Table header */}
      <div className="flex gap-4 p-4 border-b border-border">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28" />
      </div>
      
      {/* Table rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-border">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}
```

```tsx
// src/components/automations/loading/FlowEditorSkeleton.tsx

import { Skeleton } from '@/components/ui/skeleton';

export function FlowEditorSkeleton() {
  return (
    <div className="flex h-full" role="status" aria-label="Loading flow editor">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-border p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
      
      {/* Canvas skeleton */}
      <div className="flex-1 bg-muted/30 relative">
        <Skeleton className="absolute top-4 left-4 h-10 w-48" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Skeleton className="h-24 w-48 rounded-lg" />
        </div>
        <Skeleton className="absolute bottom-4 right-4 h-32 w-40" />
      </div>
    </div>
  );
}
```

```tsx
// src/components/automations/loading/NodeConfigSkeleton.tsx

import { Skeleton } from '@/components/ui/skeleton';

export function NodeConfigSkeleton() {
  return (
    <div className="p-4 space-y-4" role="status" aria-label="Loading configuration">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
```

### Error Boundary for Flow Canvas

```tsx
// src/components/automations/AutomationErrorBoundary.tsx

import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from '@untitledui/icons/react/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeaturedIcon } from '@/components/ui/featured-icon';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AutomationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Automation flow error:', { error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="m-4">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FeaturedIcon icon={AlertCircle} variant="error" size="md" />
              <CardTitle className="text-base">
                {this.props.fallbackMessage || 'Something went wrong'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The automation editor encountered an error. Your changes have been saved.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleRetry} size="sm">
              <RefreshCw size={16} aria-hidden="true" className="mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

Usage:

```tsx
// In FlowEditor.tsx
import { AutomationErrorBoundary } from './AutomationErrorBoundary';

export function FlowEditor({ automationId }: { automationId: string }) {
  return (
    <AutomationErrorBoundary fallbackMessage="Flow editor failed to load">
      <ReactFlowProvider>
        <FlowCanvas automationId={automationId} />
      </ReactFlowProvider>
    </AutomationErrorBoundary>
  );
}
```

### Route Configuration Integration

Add to `src/config/routes.ts`:

```typescript
// In ROUTE_CONFIG array
{
  id: 'automations',
  label: 'Automations',
  path: '/automations',
  requiredPermission: 'manage_webhooks', // Reuse existing permission
  adminOnly: false,
  iconName: 'Zap',
  shortcut: 'a',
  description: 'Visual workflow automation builder',
  showInNav: true,
  showInBottomNav: false,
},

// In ARI_SECTIONS array (if automations become part of Ari config)
{
  id: 'automations',
  label: 'Automations',
  group: 'integrations',
  requiredPermission: 'manage_webhooks',
  iconName: 'Zap',
  activeIconName: 'Zap',
},
```

### Base Node Component

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
  trigger: 'border-l-status-active',
  action: 'border-l-primary',
  logic: 'border-l-status-warning',
  transform: 'border-l-status-info',
  ai: 'border-l-gradient-start',
} as const;

export const BaseNode = memo(function BaseNode({
  data, selected, icon, category, children,
  sourceHandles = 1, targetHandles = 1,
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        'min-w-[200px] rounded-lg border border-border bg-card shadow-sm border-l-4',
        categoryColors[category],
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        data.disabled && 'opacity-50'
      )}
      role="button"
      aria-label={`${data.label} node`}
      aria-selected={selected}
      tabIndex={0}
    >
      {targetHandles > 0 && (
        <Handle type="target" position={Position.Top}
          className="!bg-muted-foreground !border-background !w-3 !h-3" />
      )}

      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium text-foreground truncate">{data.label}</span>
        </div>
        {data.description && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{data.description}</p>
        )}
        {children}
      </div>

      {sourceHandles > 0 && (
        <Handle type="source" position={Position.Bottom}
          className="!bg-muted-foreground !border-background !w-3 !h-3" />
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
    <BaseNode {...props} icon={<GitBranch01 size={16} aria-hidden="true" />}
      category="logic" targetHandles={1} sourceHandles={0}
    >
      <div className="mt-2 text-xs text-muted-foreground">
        {ruleCount} rule{ruleCount !== 1 ? 's' : ''} ({data.config?.logic ?? 'and'})
      </div>

      <Handle type="source" position={Position.Bottom} id="true"
        className="!bg-status-active !border-background !w-3 !h-3" style={{ left: '30%' }} />
      <span className="absolute bottom-0 left-[30%] -translate-x-1/2 translate-y-full text-2xs text-status-active">
        Yes
      </span>

      <Handle type="source" position={Position.Bottom} id="false"
        className="!bg-destructive !border-background !w-3 !h-3" style={{ left: '70%' }} />
      <span className="absolute bottom-0 left-[70%] -translate-x-1/2 translate-y-full text-2xs text-destructive">
        No
      </span>
    </BaseNode>
  );
});
```

### Design System Integration

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
```

### useAutomations Hook

```typescript
// src/hooks/useAutomations.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useAgent } from '@/hooks/useAgent';
import { useStableObject } from '@/hooks/useStableObject';
import { getErrorMessage } from '@/types/errors';
import { toast } from '@/lib/toast';
import { AUTOMATION_LIST_COLUMNS } from '@/lib/db-selects';
import type { Automation, AutomationInsert, AutomationUpdate } from '@/types/automations';

interface UseAutomationsOptions {
  status?: 'all' | 'draft' | 'active' | 'paused' | 'error';
}

export function useAutomations(options: UseAutomationsOptions = {}) {
  const queryClient = useQueryClient();
  const { accountOwnerId } = useAccountOwnerId();
  const { agent } = useAgent();
  
  // Stabilize options to prevent infinite loops
  const stableOptions = useStableObject(options);

  const { data: automations, isLoading, error } = useQuery({
    queryKey: queryKeys.automations.list(agent?.id ?? ''),
    queryFn: async () => {
      if (!agent?.id) return [];
      let query = supabase
        .from('automations')
        .select(AUTOMATION_LIST_COLUMNS)
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });
      
      if (stableOptions.status && stableOptions.status !== 'all') {
        query = query.eq('status', stableOptions.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Automation[];
    },
    enabled: !!agent?.id && !!accountOwnerId,
    staleTime: 30 * 1000, // 30 seconds - consistent with useWebhooks
  });

  const createMutation = useMutation({
    mutationFn: async (automation: AutomationInsert) => {
      if (!agent?.id || !accountOwnerId) throw new Error('Missing agent or account');
      const { data, error } = await supabase
        .from('automations')
        .insert({ ...automation, agent_id: agent.id, user_id: accountOwnerId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.list(agent?.id ?? '') });
      toast.success('Automation created');
    },
    onError: (error: unknown) => {
      toast.error('Failed to create automation', { description: getErrorMessage(error) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (automationId: string) => {
      const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', automationId);
      if (error) throw error;
    },
    onSuccess: (_, automationId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.list(agent?.id ?? '') });
      toast.undo('Automation deleted', {
        onUndo: async () => {
          // Undo logic - would need to store deleted automation temporarily
        },
      });
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete automation', { description: getErrorMessage(error) });
    },
  });

  return {
    automations: automations ?? [],
    isLoading,
    error,
    createAutomation: createMutation.mutateAsync,
    deleteAutomation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
```

### useAutomations with Real-Time Subscriptions

```typescript
// src/hooks/useAutomationsRealtime.ts

import { useSupabaseQuery } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { useAgent } from '@/hooks/useAgent';
import { AUTOMATION_LIST_COLUMNS } from '@/lib/db-selects';
import type { Automation } from '@/types/automations';

export function useAutomationsRealtime() {
  const { accountOwnerId } = useAccountOwnerId();
  const { agent } = useAgent();

  const { data: automations, isLoading, error } = useSupabaseQuery<Automation[]>({
    queryKey: queryKeys.automations.list(agent?.id ?? ''),
    queryFn: async ({ supabase }) => {
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
    staleTime: 30 * 1000,
    // Real-time subscription for live updates
    realtime: {
      table: 'automations',
      filter: `agent_id=eq.${agent?.id}`,
      event: '*', // INSERT, UPDATE, DELETE
    },
  });

  return { automations: automations ?? [], isLoading, error };
}
```
```

### Accessibility Requirements

#### Keyboard Navigation

```tsx
function FlowEditor() {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') deleteSelectedNodes();
    if (event.metaKey || event.ctrlKey) {
      if (event.key === 'z') event.shiftKey ? redo() : undo();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      moveSelectedNodes(event.key);
    }
    if (event.key === 'Escape') clearSelection();
    if (event.key === 'Enter' && selectedNode) openConfigPanel(selectedNode);
  }, []);

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} role="application"
      aria-label="Automation flow editor">
      <ReactFlow ... />
    </div>
  );
}
```

#### Screen Reader Announcements

```tsx
function useNodeAnnouncements() {
  const announce = useCallback((message: string) => {
    const el = document.getElementById('automation-announcer');
    if (el) el.textContent = message;
  }, []);

  return {
    announceNodeAdded: (label: string) => announce(`${label} node added to flow`),
    announceNodeDeleted: (label: string) => announce(`${label} node deleted`),
    announceNodeSelected: (label: string) => announce(`${label} node selected. Press Enter to configure.`),
  };
}

// In page layout
<div id="automation-announcer" role="status" aria-live="polite" className="sr-only" />
```

### Dark Mode Support

```tsx
import { ReactFlow } from '@xyflow/react';
import { useTheme } from 'next-themes';

function FlowCanvas() {
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === 'dark' ? 'dark' : 'light';

  return <ReactFlow colorMode={colorMode} />;
}
```

### Permission Guards

```tsx
import { useCanManage } from '@/hooks/useCanManage';
import { PermissionGuard } from '@/components/PermissionGuard';

function Automations() {
  const canManageWebhooks = useCanManage('manage_webhooks');

  return (
    <PermissionGuard permission="manage_webhooks" redirectTo="/ari">
      {canManageWebhooks && (
        <Button onClick={createAutomation}>
          <Plus size={16} aria-hidden="true" />
          New Automation
        </Button>
      )}
    </PermissionGuard>
  );
}
```

### Reduced Motion Support

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

function FlowEditor() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ReactFlow
      fitViewOptions={{ duration: prefersReducedMotion ? 0 : 400 }}
      defaultEdgeOptions={{ animated: !prefersReducedMotion }}
    />
  );
}
```

---

## 7. Best Practices & Patterns

### Optimistic Updates

```typescript
// src/hooks/useAutomationOptimistic.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/types/errors';
import { toast } from '@/lib/toast';
import type { Automation } from '@/types/automations';

export function useToggleAutomation(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('automations')
        .update({ enabled, status: enabled ? 'active' : 'paused' })
        .eq('id', id);
      if (error) throw error;
    },
    // Optimistic update
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.automations.list(agentId) });
      
      const previousAutomations = queryClient.getQueryData<Automation[]>(
        queryKeys.automations.list(agentId)
      );
      
      queryClient.setQueryData<Automation[]>(
        queryKeys.automations.list(agentId),
        (old) => old?.map(a => 
          a.id === id ? { ...a, enabled, status: enabled ? 'active' : 'paused' } : a
        )
      );
      
      return { previousAutomations };
    },
    // Rollback on error
    onError: (error: unknown, _, context) => {
      if (context?.previousAutomations) {
        queryClient.setQueryData(
          queryKeys.automations.list(agentId),
          context.previousAutomations
        );
      }
      toast.error('Failed to update automation', { description: getErrorMessage(error) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.list(agentId) });
    },
  });
}

// Optimistic node position update
export function useUpdateNodePosition(automationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      nodeId, 
      position 
    }: { 
      nodeId: string; 
      position: { x: number; y: number } 
    }) => {
      // Debounced save to DB
      const automation = queryClient.getQueryData<Automation>(
        queryKeys.automations.detail(automationId)
      );
      if (!automation) return;
      
      const updatedNodes = automation.nodes.map(n => 
        n.id === nodeId ? { ...n, position } : n
      );
      
      const { error } = await supabase
        .from('automations')
        .update({ nodes: updatedNodes })
        .eq('id', automationId);
      if (error) throw error;
    },
    // Immediately update local state (no server round-trip for position)
    onMutate: async ({ nodeId, position }) => {
      queryClient.setQueryData<Automation>(
        queryKeys.automations.detail(automationId),
        (old) => old ? {
          ...old,
          nodes: old.nodes.map(n => n.id === nodeId ? { ...n, position } : n)
        } : old
      );
    },
    onError: (error: unknown) => {
      // Only show error for actual save failures, not position updates
      console.error('Failed to save node position:', getErrorMessage(error));
    },
  });
}
```

### Toast Patterns

```typescript
// Correct toast usage for automations

import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';

// Success toast
toast.success('Automation saved');

// Error toast with description
toast.error('Failed to save automation', { 
  description: getErrorMessage(error) 
});

// Undo toast for delete operations
toast.undo('Automation deleted', {
  onUndo: async () => {
    // Restore the automation
    await restoreAutomation(automationId);
    queryClient.invalidateQueries({ queryKey: queryKeys.automations.list(agentId) });
  },
});

// Saving toast with minimum duration
const savingToast = toast.saving('Saving changes...');
try {
  await saveAutomation(data);
  savingToast.dismiss();
  toast.success('Changes saved');
} catch (error) {
  savingToast.dismiss();
  toast.error('Failed to save', { description: getErrorMessage(error) });
}

// Dedupe toast (prevent duplicate toasts)
toast.dedupe('automation-test', 'Test execution started');

// Silent auto-save (no toast unless error)
async function autoSave(data: AutomationUpdate) {
  try {
    await supabase.from('automations').update(data).eq('id', automationId);
  } catch (error) {
    toast.error('Auto-save failed', { description: getErrorMessage(error) });
  }
}
```

### Focus Management & Accessibility

```tsx
// src/hooks/useNodeAnnouncements.ts

import { useCallback, useRef } from 'react';

export function useNodeAnnouncements() {
  const announce = useCallback((message: string) => {
    const el = document.getElementById('automation-announcer');
    if (el) el.textContent = message;
  }, []);

  return {
    announceNodeAdded: (label: string) => announce(`${label} node added to flow`),
    announceNodeDeleted: (label: string) => announce(`${label} node deleted`),
    announceNodeSelected: (label: string) => 
      announce(`${label} node selected. Press Enter to configure, Delete to remove.`),
    announceConnectionCreated: (source: string, target: string) => 
      announce(`Connected ${source} to ${target}`),
    announceExecutionStarted: () => announce('Automation test started'),
    announceExecutionComplete: (status: 'success' | 'failed') => 
      announce(`Automation test ${status}`),
  };
}
```

```tsx
// Focus management for NodeConfigPanel

import { useEffect, useRef } from 'react';

interface NodeConfigPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

export function NodeConfigPanel({ nodeId, onClose }: NodeConfigPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus and move to panel when opened
  useEffect(() => {
    if (nodeId) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first focusable element in panel
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [nodeId]);

  // Restore focus when panel closes
  const handleClose = useCallback(() => {
    previousFocusRef.current?.focus();
    onClose();
  }, [onClose]);

  // Trap focus within panel
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [handleClose]);

  if (!nodeId) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby="node-config-title"
      aria-describedby="node-config-description"
      onKeyDown={handleKeyDown}
      className="border-l border-border bg-card w-80"
    >
      <div className="p-4">
        <h2 id="node-config-title" className="text-base font-semibold">
          Configure Node
        </h2>
        <p id="node-config-description" className="sr-only">
          Edit the configuration for this automation node
        </p>
        {/* Form fields with proper aria-describedby */}
      </div>
    </div>
  );
}
```

```tsx
// Announcer component in Automations page

export function Automations() {
  return (
    <div>
      {/* Screen reader announcer */}
      <div 
        id="automation-announcer" 
        role="status" 
        aria-live="polite" 
        className="sr-only" 
      />
      
      <FlowEditor />
    </div>
  );
}
```

### staleTime Configuration Reference

| Hook | staleTime | Rationale |
|------|-----------|-----------|
| `useAutomations` | 30s | Consistent with `useWebhooks`, moderate refresh rate |
| `useAutomation` (detail) | 60s | Single automation less volatile |
| `useAutomationExecutions` | 10s | Executions update more frequently |
| `useAgent` | 5 min | Agent config rarely changes |

---

## 8. Implementation Phases

> **Status**: Phases 1-5 Complete (~85%), Phase 6 In Progress

### Phase 1: Foundation ✅ COMPLETE

**Goal:** Basic infrastructure and empty canvas

- [x] Install `@xyflow/react` package
- [x] Create database migration for `automations` and `automation_executions` tables
- [x] Add types to `src/types/automations.ts` and `src/types/metadata.ts`
- [x] Add query keys to `src/lib/query-keys.ts`
- [x] Add DB select columns to `src/lib/db-selects.ts`
- [x] Create `useAutomations` hook with CRUD operations + `staleTime: 30s`
- [x] Add route to `src/config/routes.ts` (ROUTE_CONFIG)
- [x] Create loading skeletons: `AutomationsListSkeleton`
- [x] Create `AutomationErrorBoundary.tsx`
- [x] Create basic `Automations.tsx` page with React Flow canvas
- [x] Create `FlowEditor.tsx` wrapper with drag-drop support
- [x] Create `NodeSidebar.tsx` with node categories
- [x] Create `automationFlowStore.ts` with zundo for undo/redo

**Deliverable:** ✅ Flow editor accessible at `/ari/automations`

### Phase 2: Node System ✅ COMPLETE

**Goal:** Core node types with visual representation

- [x] Create `BaseNode.tsx` with consistent styling
- [x] Implement trigger nodes (event, manual, schedule, ai-tool)
- [x] Implement action nodes (http, delay, set-variable, stop)
- [x] Implement `ConditionNode.tsx` with true/false handles
- [x] Create node configuration panels in `panels/` folder
- [x] Implement node selection and property editing via `NodeConfigPanel.tsx`
- [x] Add edge validation (source → target type rules)
- [x] Persist nodes/edges to database via `useAutomationAutoSave`

**Deliverable:** ✅ Nodes can be added, connected, and saved

### Phase 3: HTTP Action ✅ COMPLETE

**Goal:** First working action node

- [x] Create HTTP request editor panel
- [x] Create `execute-automation` edge function
- [x] Implement HTTP request executor with SSRF protection (`http-executor.ts`)
- [x] Implement variable resolution (`variable-resolver.ts`)
- [x] Add test execution mode
- [x] Create `ExecutionPanel.tsx` with logs
- [x] Create `ExecutionHistoryList.tsx` and `ExecutionDetail.tsx`
- [x] Add execution history via `useAutomationExecutions` hook

**Deliverable:** ✅ Can create and test HTTP request automation

### Phase 4: Triggers ✅ COMPLETE

**Goal:** Event-based automation triggers

- [x] Implement event trigger configuration
- [x] Create `trigger-automation` edge function
- [x] Create `dispatch-automation-event` edge function
- [x] Implement `trigger-matcher.ts` for event matching
- [x] Add database triggers for events (lead.created, conversation.created, etc.)
- [x] Implement condition node execution
- [x] Add manual trigger via `TestExecutionDialog.tsx`
- [x] Real-time execution status updates (`useAutomationExecution` with Realtime + polling)

**Deliverable:** ✅ Automations trigger on real events

### Phase 5: AI Integration ✅ COMPLETE

**Goal:** Bidirectional AI ↔ Automation

- [x] Implement AI Tool trigger type
- [x] Create `automation-tools.ts` for registering automations as tools
- [x] Integrate in `widget-chat/index.ts` to fetch automation tools
- [x] Modify `tool-executor.ts` to handle `automation_*` tool calls
- [x] Implement AI node executors (`ai-generate`, `ai-classify`, `ai-extract`)
- [x] Pass automation results back to conversation

**Deliverable:** ✅ AI can call automations, automations can call AI

### Phase 6: Polish & Migration ✅ COMPLETE

**Goal:** Production-ready with migration path

- [x] Create migration tools for webhooks → automations (`src/lib/automation-migration.ts`)
- [x] Create migration tools for tools → automations (same file)
- [x] Add automation templates (`src/lib/automation-templates.ts` - 8 templates)
- [x] Implement remaining action nodes (`action-email`, `action-update-lead`, `action-create-booking`)
- [x] Add execution retry logic (already in `http.ts` with exponential backoff)
- [x] Performance optimization (React Flow memoization, debounced saves)
- [x] Real-time execution status updates (`useAutomationExecution` hook with Realtime + polling)
- [x] Final documentation review

**Deliverable:** ✅ Complete system ready for migration

---

## 9. Migration Strategy

### Phase 1: Parallel Operation

Both systems run simultaneously:
- New `automations` system available at `/automations`
- Existing `webhooks` and `agent_tools` continue working
- No automatic migration

### Phase 2: Migration Tools

**Implementation Complete:** See `src/lib/automation-migration.ts`

```typescript
// Key functions implemented:
export async function migrateWebhookToAutomation(webhook: Webhook, agentId: string): Promise<MigrationResult>
export async function migrateToolToAutomation(tool: AgentTool, userId: string): Promise<MigrationResult>
export async function migrateAllWebhooks(agentId: string): Promise<MigrationResult[]>
export async function migrateAllTools(agentId: string, userId: string): Promise<MigrationResult[]>
export async function getMigrationCounts(agentId: string): Promise<{ webhooks: number; tools: number }>
```

**Automation Templates:** See `src/lib/automation-templates.ts`

8 pre-built templates across 4 categories:
- **lead-management**: New Lead Notification, Lead Scoring, Lead Follow-up
- **notifications**: Slack Alert, Email Digest
- **ai-workflows**: AI Lead Qualifier, Content Generator
- **integrations**: CRM Sync

### Phase 3: Deprecation

1. Show deprecation warnings in old UIs
2. Encourage migration via in-app prompts
3. Stop allowing new webhook/tool creation
4. Eventually remove old tables (major version)

---

## Appendix

### Testing Strategy

```typescript
// Unit Tests
describe('HttpRequestExecutor', () => {
  it('should make GET request with resolved variables');
  it('should block internal URLs (SSRF protection)');
  it('should timeout after configured duration');
});

// Integration Tests
describe('AutomationExecution', () => {
  it('should execute nodes in correct order');
  it('should follow condition branches correctly');
  it('should create complete execution log');
});
```

### Performance Considerations

**Database:**
- Indexes on `agent_id`, `user_id`, `trigger_type`
- Partial indexes for active automations
- Execution log retention policy (30 days default)

**Edge Functions:**
- Parallel node execution where possible
- Timeout enforcement per-node and per-automation

**Frontend:**
- React Flow virtualization (built-in)
- Lazy-load node editors
- Debounced auto-save
- Optimistic UI updates

### React Flow Integration

```bash
bun add @xyflow/react
```

Key concepts:
1. **Nodes**: Visual elements with position, type, data
2. **Edges**: Connections between node handles
3. **Handles**: Connection points on nodes (source/target)
4. **Custom Nodes**: React components for specialized behavior
5. **Node Types**: Registry mapping type strings to components

```typescript
const colorMode = theme === 'dark' ? 'dark' : 'light';

<ReactFlow colorMode={colorMode} proOptions={{ hideAttribution: true }} fitView>
  <Background variant={BackgroundVariant.Dots} />
  <Controls />
  <MiniMap />
</ReactFlow>
```

---

## 10. React Flow Patterns

Production-ready React Flow patterns following the official documentation and industry best practices.

### Undo/Redo with Zustand Temporal

Use `zustand` with `zundo` middleware for undo/redo history:

```bash
bun add zustand zundo
```

```typescript
// src/stores/automationFlowStore.ts

import { create } from 'zustand';
import { temporal } from 'zundo';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  reset: () => void;
}

const initialState = {
  nodes: [],
  edges: [],
};

export const useFlowStore = create<FlowState>()(
  temporal(
    (set, get) => ({
      ...initialState,
      
      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },
      
      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },
      
      onConnect: (connection) => {
        set({ edges: addEdge(connection, get().edges) });
      },
      
      addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
      },
      
      deleteNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== nodeId),
          edges: get().edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        });
      },
      
      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          ),
        });
      },
      
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      reset: () => set(initialState),
    }),
    {
      // Limit history to 50 states
      limit: 50,
      // Debounce rapid changes (e.g., dragging)
      handleSet: (handleSet) => {
        let timeout: ReturnType<typeof setTimeout> | null = null;
        return (state) => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            handleSet(state);
          }, 100);
        };
      },
      // Partition functions for granular history (optional)
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);

// Hook for undo/redo actions
export function useFlowHistory() {
  const { undo, redo, clear, pastStates, futureStates } = useFlowStore.temporal.getState();
  
  return {
    undo,
    redo,
    clear,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
```

```tsx
// Usage in FlowEditor.tsx
import { useFlowStore, useFlowHistory } from '@/stores/automationFlowStore';

function FlowToolbar() {
  const { undo, redo, canUndo, canRedo } = useFlowHistory();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
  
  return (
    <div className="flex gap-1">
      <IconButton
        icon={ArrowUturnLeft}
        label="Undo (⌘Z)"
        onClick={undo}
        disabled={!canUndo}
        size="sm"
      />
      <IconButton
        icon={ArrowUturnRight}
        label="Redo (⌘⇧Z)"
        onClick={redo}
        disabled={!canRedo}
        size="sm"
      />
    </div>
  );
}
```

### useFlowState Hook Implementation

Controlled state hook for React Flow integration:

```typescript
// src/features/automations/hooks/useFlowState.ts

import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { 
  Node, 
  Edge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect,
  Connection,
  NodeChange,
  EdgeChange 
} from '@xyflow/react';
import { useFlowStore } from '@/stores/automationFlowStore';

interface UseFlowStateReturn {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  selectedNodes: Node[];
  selectedNodeIds: string[];
}

export function useFlowState(): UseFlowStateReturn {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    addNode,
    deleteNode,
    updateNodeData,
  } = useFlowStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges,
      onNodesChange: state.onNodesChange,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      addNode: state.addNode,
      deleteNode: state.deleteNode,
      updateNodeData: state.updateNodeData,
    }))
  );

  const selectedNodes = useMemo(
    () => nodes.filter((n) => n.selected),
    [nodes]
  );

  const selectedNodeIds = useMemo(
    () => selectedNodes.map((n) => n.id),
    [selectedNodes]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    updateNodeData,
    selectedNodes,
    selectedNodeIds,
  };
}
```

### nodeTypes Registry Memoization

**CRITICAL**: `nodeTypes` must be defined outside the component or memoized to prevent React Flow from re-registering on every render:

```typescript
// src/features/automations/nodes/nodeTypes.ts

import { memo } from 'react';
import type { NodeTypes } from '@xyflow/react';
import { TriggerNode } from './TriggerNode';
import { ActionNode } from './ActionNode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';
import { AINode } from './AINode';
import { LoopNode } from './LoopNode';
import { ResponseNode } from './ResponseNode';

// Define outside component - NEVER inside
export const nodeTypes: NodeTypes = {
  trigger: memo(TriggerNode),
  action: memo(ActionNode),
  condition: memo(ConditionNode),
  delay: memo(DelayNode),
  ai: memo(AINode),
  loop: memo(LoopNode),
  response: memo(ResponseNode),
};

// Edge types registry
import type { EdgeTypes } from '@xyflow/react';
import { CustomEdge } from './CustomEdge';

export const edgeTypes: EdgeTypes = {
  default: memo(CustomEdge),
};
```

```tsx
// src/features/automations/components/FlowEditor.tsx

import { nodeTypes, edgeTypes } from '../nodes/nodeTypes';

export function FlowEditor() {
  // nodeTypes is stable reference from module scope
  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      // ...
    />
  );
}
```

### Connection Validation Rules

Validate connections before allowing them:

```typescript
// src/features/automations/lib/connectionValidation.ts

import type { Node, Edge, Connection, IsValidConnection } from '@xyflow/react';

interface ConnectionRules {
  // Which node types can connect to which
  allowedConnections: Record<string, string[]>;
  // Maximum outgoing edges per handle type
  maxOutgoing: Record<string, number>;
  // Prevent self-connections
  preventSelfConnection: boolean;
  // Prevent cycles
  preventCycles: boolean;
}

const defaultRules: ConnectionRules = {
  allowedConnections: {
    trigger: ['action', 'condition', 'delay', 'ai'],
    action: ['action', 'condition', 'delay', 'ai', 'response'],
    condition: ['action', 'condition', 'delay', 'ai', 'response'],
    delay: ['action', 'condition', 'ai', 'response'],
    ai: ['action', 'condition', 'response'],
    loop: ['action', 'condition', 'ai'],
    response: [], // Terminal node
  },
  maxOutgoing: {
    trigger: 1,
    action: 1,
    delay: 1,
    ai: 1,
    condition: 2, // true/false branches
    loop: 2, // continue/complete branches
    response: 0, // Terminal
  },
  preventSelfConnection: true,
  preventCycles: true,
};

export function createConnectionValidator(
  nodes: Node[],
  edges: Edge[],
  rules: ConnectionRules = defaultRules
): IsValidConnection {
  return (connection: Edge | Connection): boolean => {
    const { source, target, sourceHandle } = connection;
    
    if (!source || !target) return false;
    
    // Prevent self-connections
    if (rules.preventSelfConnection && source === target) {
      return false;
    }
    
    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);
    
    if (!sourceNode || !targetNode) return false;
    
    // Check allowed connections
    const allowed = rules.allowedConnections[sourceNode.type || ''];
    if (allowed && !allowed.includes(targetNode.type || '')) {
      return false;
    }
    
    // Check max outgoing from this handle
    const existingFromHandle = edges.filter(
      (e) => e.source === source && e.sourceHandle === sourceHandle
    );
    const maxFromHandle = sourceHandle?.includes('true') || sourceHandle?.includes('false')
      ? 1  // Condition branches: 1 each
      : rules.maxOutgoing[sourceNode.type || ''] ?? Infinity;
    
    if (existingFromHandle.length >= maxFromHandle) {
      return false;
    }
    
    // Prevent cycles (BFS)
    if (rules.preventCycles) {
      const visited = new Set<string>();
      const queue = [target];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === source) return false; // Would create cycle
        if (visited.has(current)) continue;
        visited.add(current);
        
        edges
          .filter((e) => e.source === current)
          .forEach((e) => queue.push(e.target));
      }
    }
    
    return true;
  };
}
```

```tsx
// Usage in FlowEditor.tsx
const { nodes, edges } = useFlowState();
const isValidConnection = useMemo(
  () => createConnectionValidator(nodes, edges),
  [nodes, edges]
);

<ReactFlow isValidConnection={isValidConnection} />
```

### Drag & Drop from Sidebar

Complete drag-and-drop handler for adding nodes from sidebar:

```tsx
// src/features/automations/components/NodeSidebar.tsx

import { DragEvent } from 'react';
import type { NodeType } from '../types';

interface NodeSidebarItemProps {
  nodeType: NodeType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}

export function NodeSidebarItem({ 
  nodeType, 
  label, 
  icon: Icon, 
  description 
}: NodeSidebarItemProps) {
  const onDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border border-border 
                 hover:border-primary/50 hover:bg-accent cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
    >
      <FeaturedIcon icon={Icon} size="sm" variant="secondary" />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{label}</span>
        <span className="text-xs text-muted-foreground truncate">{description}</span>
      </div>
    </div>
  );
}
```

```tsx
// src/features/automations/components/FlowEditor.tsx

import { useCallback, useRef, DragEvent } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowState } from '../hooks/useFlowState';
import { useNodeAnnouncements } from '@/hooks/useNodeAnnouncements';
import { nanoid } from 'nanoid';

export function FlowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const { addNode, nodes } = useFlowState();
  const { announceNodeAdded } = useNodeAnnouncements();

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Get drop position in flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create new node
      const newNode = {
        id: nanoid(),
        type,
        position,
        data: { label: getNodeLabel(type) },
      };

      addNode(newNode);
      announceNodeAdded(getNodeLabel(type));
    },
    [screenToFlowPosition, addNode, announceNodeAdded]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        onDragOver={onDragOver}
        onDrop={onDrop}
        // ...
      />
    </div>
  );
}

function getNodeLabel(type: string): string {
  const labels: Record<string, string> = {
    trigger: 'Trigger',
    action: 'HTTP Request',
    condition: 'Condition',
    delay: 'Delay',
    ai: 'AI Action',
    loop: 'Loop',
    response: 'Response',
  };
  return labels[type] || 'Node';
}
```

### Copy/Paste Nodes

Clipboard support for copying and pasting nodes:

```typescript
// src/features/automations/hooks/useClipboard.ts

import { useCallback, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useFlowState } from './useFlowState';
import { nanoid } from 'nanoid';

interface ClipboardData {
  nodes: Node[];
  edges: Edge[];
}

const OFFSET = 50; // Paste offset from original position

export function useClipboard() {
  const { nodes, edges, addNode, onConnect } = useFlowState();
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const copy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    
    // Include edges between selected nodes
    const selectedEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    setClipboard({ nodes: selectedNodes, edges: selectedEdges });
    
    // Also copy to system clipboard for cross-tab support
    navigator.clipboard.writeText(
      JSON.stringify({ nodes: selectedNodes, edges: selectedEdges })
    );
  }, [nodes, edges]);

  const paste = useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) return;

    // Create ID mapping for new nodes
    const idMap = new Map<string, string>();
    clipboard.nodes.forEach((n) => {
      idMap.set(n.id, nanoid());
    });

    // Create new nodes with offset positions
    const newNodes: Node[] = clipboard.nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      position: {
        x: n.position.x + OFFSET,
        y: n.position.y + OFFSET,
      },
      selected: true,
    }));

    // Create new edges with updated IDs
    const newEdges: Edge[] = clipboard.edges.map((e) => ({
      ...e,
      id: nanoid(),
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
    }));

    // Add nodes
    newNodes.forEach(addNode);
    
    // Add edges
    newEdges.forEach((e) => {
      onConnect({
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      });
    });

    // Update clipboard for cascading pastes
    setClipboard({ nodes: newNodes, edges: newEdges });
  }, [clipboard, addNode, onConnect]);

  const cut = useCallback(() => {
    copy();
    const selectedNodes = nodes.filter((n) => n.selected);
    selectedNodes.forEach((n) => deleteNode(n.id));
  }, [copy, nodes]);

  return { copy, paste, cut, hasClipboard: clipboard !== null };
}
```

```tsx
// Keyboard shortcuts in FlowEditor.tsx
useEffect(() => {
  const { copy, paste, cut } = useClipboard();
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    
    switch (e.key) {
      case 'c':
        e.preventDefault();
        copy();
        break;
      case 'v':
        e.preventDefault();
        paste();
        break;
      case 'x':
        e.preventDefault();
        cut();
        break;
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Multi-Select Patterns

Selection box and multi-select behavior:

```tsx
// src/features/automations/components/FlowEditor.tsx

import { useCallback, useState } from 'react';
import { 
  ReactFlow, 
  SelectionMode,
  useOnSelectionChange,
  type OnSelectionChangeParams,
} from '@xyflow/react';

export function FlowEditor() {
  const [selectedCount, setSelectedCount] = useState(0);

  // Track selection changes
  const onSelectionChange = useCallback(
    ({ nodes, edges }: OnSelectionChangeParams) => {
      setSelectedCount(nodes.length);
    },
    []
  );

  // Delete selected nodes
  const deleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    selectedNodes.forEach((n) => deleteNode(n.id));
  }, [nodes, deleteNode]);

  // Keyboard delete handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedCount > 0) {
        // Don't delete if focus is in an input
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        deleteSelected();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCount, deleteSelected]);

  return (
    <ReactFlow
      selectionMode={SelectionMode.Partial} // Select nodes partially in box
      selectionOnDrag // Enable selection box
      panOnDrag={[1, 2]} // Pan with middle/right mouse button
      selectNodesOnDrag={false} // Don't select during pan
      onSelectionChange={onSelectionChange}
      multiSelectionKeyCode="Shift" // Hold Shift for multi-select
      deleteKeyCode={null} // Handle delete manually (above)
      // ...
    />
  );
}
```

### Viewport Constraints

Limit panning and zoom ranges:

```tsx
// src/features/automations/components/FlowEditor.tsx

import { ReactFlow } from '@xyflow/react';

// Viewport constraints
const VIEWPORT_CONFIG = {
  minZoom: 0.25,
  maxZoom: 2,
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  // Extent limits panning range [minX, minY, maxX, maxY]
  translateExtent: [
    [-2000, -2000],
    [4000, 4000],
  ] as [[number, number], [number, number]],
  // Node placement constraints
  nodeExtent: [
    [-1500, -1500],
    [3500, 3500],
  ] as [[number, number], [number, number]],
};

export function FlowEditor() {
  return (
    <ReactFlow
      minZoom={VIEWPORT_CONFIG.minZoom}
      maxZoom={VIEWPORT_CONFIG.maxZoom}
      defaultViewport={VIEWPORT_CONFIG.defaultViewport}
      translateExtent={VIEWPORT_CONFIG.translateExtent}
      nodeExtent={VIEWPORT_CONFIG.nodeExtent}
      fitView
      fitViewOptions={{
        padding: 0.2,
        maxZoom: 1.5,
      }}
      // ...
    />
  );
}
```

### Auto-Layout with Dagre

Automatic node positioning using dagre:

```bash
bun add @dagrejs/dagre
```

```typescript
// src/features/automations/lib/autoLayout.ts

import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

interface LayoutOptions {
  direction: 'TB' | 'LR' | 'BT' | 'RL';
  nodeSpacing: number;
  rankSpacing: number;
}

const defaultOptions: LayoutOptions = {
  direction: 'TB', // Top to bottom
  nodeSpacing: 80,
  rankSpacing: 100,
};

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options };
  
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  
  g.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSpacing,
    ranksep: opts.rankSpacing,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to graph
  nodes.forEach((node) => {
    // Default node dimensions - adjust per node type if needed
    const width = node.type === 'condition' ? 200 : 180;
    const height = node.type === 'condition' ? 100 : 80;
    g.setNode(node.id, { width, height });
  });

  // Add edges to graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run layout algorithm
  Dagre.layout(g);

  // Apply positions back to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    const width = node.type === 'condition' ? 200 : 180;
    const height = node.type === 'condition' ? 100 : 80;
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

```tsx
// Usage in FlowEditor.tsx
import { useReactFlow } from '@xyflow/react';
import { getLayoutedElements } from '../lib/autoLayout';

function FlowToolbar() {
  const { nodes, edges, setNodes, setEdges } = useFlowState();
  const { fitView } = useReactFlow();

  const onAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      { direction: 'TB' }
    );
    
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    
    // Fit view after layout with animation
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.2, duration: 300 });
    });
  }, [nodes, edges, setNodes, setEdges, fitView]);

  return (
    <IconButton
      icon={Grid3x3}
      label="Auto-arrange nodes"
      onClick={onAutoLayout}
      size="sm"
    />
  );
}
```

### Viewport Persistence

Save and restore viewport position:

```typescript
// src/features/automations/hooks/useViewportPersistence.ts

import { useCallback, useEffect, useRef } from 'react';
import { useReactFlow, type Viewport } from '@xyflow/react';
import { debounce } from '@/lib/utils';

interface UseViewportPersistenceOptions {
  automationId: string;
  initialViewport?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;
}

export function useViewportPersistence({
  automationId,
  initialViewport,
  onViewportChange,
}: UseViewportPersistenceOptions) {
  const { setViewport, getViewport } = useReactFlow();
  const initialized = useRef(false);

  // Restore viewport on mount
  useEffect(() => {
    if (initialViewport && !initialized.current) {
      setViewport(initialViewport);
      initialized.current = true;
    }
  }, [initialViewport, setViewport]);

  // Debounced save
  const debouncedSave = useCallback(
    debounce((viewport: Viewport) => {
      onViewportChange?.(viewport);
    }, 500),
    [onViewportChange]
  );

  // Handle viewport changes
  const handleMoveEnd = useCallback(() => {
    const viewport = getViewport();
    debouncedSave(viewport);
  }, [getViewport, debouncedSave]);

  return { onMoveEnd: handleMoveEnd };
}
```

```tsx
// Usage in FlowEditor.tsx
export function FlowEditor({ automation }: { automation: Automation }) {
  const updateAutomation = useUpdateAutomation(automation.id);
  
  const { onMoveEnd } = useViewportPersistence({
    automationId: automation.id,
    initialViewport: automation.viewport,
    onViewportChange: (viewport) => {
      updateAutomation.mutate({ viewport });
    },
  });

  return (
    <ReactFlow
      defaultViewport={automation.viewport}
      onMoveEnd={onMoveEnd}
      // ...
    />
  );
}
```

### CSS Stylesheet Import (CRITICAL)

**REQUIRED**: Without importing React Flow styles, edges will NOT render and nodes will have no styling:

```tsx
// REQUIRED: Import in FlowEditor.tsx or main entry point
// Without this, edges will NOT render and nodes will have no styling!
import '@xyflow/react/dist/style.css';

// Alternative: Import only base styles for fully custom styling
// import '@xyflow/react/dist/base.css';
```

### useUpdateNodeInternals Hook

**REQUIRED** when adding/removing handles programmatically:

```typescript
// src/features/automations/hooks/useDynamicHandles.ts

import { useCallback } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';

/**
 * REQUIRED: Call after adding/removing handles programmatically
 * Without this, edge positions won't update correctly
 */
export function useDynamicHandles(nodeId: string) {
  const updateNodeInternals = useUpdateNodeInternals();
  
  const updateHandles = useCallback(() => {
    updateNodeInternals(nodeId);
  }, [updateNodeInternals, nodeId]);
  
  return { updateHandles };
}
```

```tsx
// Usage in a node that adds/removes handles dynamically
function DynamicHandleNode({ id, data }: NodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();
  
  useEffect(() => {
    // After handles are added/removed, update internals
    updateNodeInternals(id);
  }, [data.handleCount, id, updateNodeInternals]);
  
  return (/* ... */);
}
```

### Accessibility Configuration (ariaLabelConfig)

Localized accessibility messages for WCAG 2.2 compliance:

```tsx
// src/features/automations/lib/ariaLabels.ts

export const ariaLabels = {
  'node.a11yDescription.default': 
    'Press enter or space to select. Press delete to remove.',
  'node.a11yDescription.keyboardDisabled': 
    'Use arrow keys to move. Press delete to remove.',
  'controls.ariaLabel': 'Automation Controls',
  'controls.zoomIn.ariaLabel': 'Zoom In',
  'controls.zoomOut.ariaLabel': 'Zoom Out',
  'controls.fitView.ariaLabel': 'Fit All Nodes',
  'minimap.ariaLabel': 'Automation Overview',
};
```

```tsx
// Usage in FlowEditor.tsx
import { ariaLabels } from '../lib/ariaLabels';

<ReactFlow
  ariaLabelConfig={ariaLabels}
  // Explicit keyboard accessibility - REQUIRED for WCAG 2.2
  nodesFocusable={true}       // Enable Tab navigation to nodes
  edgesFocusable={true}       // Enable Tab navigation to edges
  disableKeyboardA11y={false} // Keep arrow key node movement
  autoPanOnNodeFocus={true}   // Auto-scroll to focused node
  // ...
/>
```

### ReactFlowProvider Placement (CRITICAL)

`useReactFlow()` hook can ONLY be called inside ReactFlowProvider:

```tsx
// ❌ WRONG - will crash with "zustand provider" error
function FlowEditor() {
  const instance = useReactFlow(); // 💥 Crashes!
  return (
    <ReactFlowProvider>
      <ReactFlow />
    </ReactFlowProvider>
  );
}

// ✅ CORRECT - provider wraps externally
function FlowEditorWrapper() {
  return (
    <ReactFlowProvider>
      <FlowCanvas /> {/* useReactFlow() works inside here */}
    </ReactFlowProvider>
  );
}

function FlowCanvas() {
  const instance = useReactFlow(); // ✅ Works!
  return <ReactFlow />;
}
```

### Handle ID Uniqueness Rule

When a node has MULTIPLE handles of the same type (source or target), each handle MUST have a unique `id` prop:

```tsx
// ❌ WRONG - ambiguous handles
<Handle type="source" position={Position.Bottom} />
<Handle type="source" position={Position.Right} />

// ✅ CORRECT - unique IDs
<Handle type="source" position={Position.Bottom} id="output-main" />
<Handle type="source" position={Position.Right} id="output-error" />

// Edge connections reference these IDs:
const edge = {
  id: 'edge-1',
  source: 'node-1',
  sourceHandle: 'output-main',  // References specific handle
  target: 'node-2',
  targetHandle: null,           // Uses default target handle
};
```

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Edges not rendering | Missing `@xyflow/react/dist/style.css` import |
| `useReactFlow` crashes | Provider not wrapping component |
| Handles not updating | Call `useUpdateNodeInternals(nodeId)` |
| Duplicate handle errors | Add unique `id` to each handle |
| Hidden handles breaking edges | Use `opacity: 0` NOT `display: none` |

**Handle Visibility Warning:**

```tsx
// ❌ WRONG: display: none breaks edge rendering
<Handle 
  type="source" 
  style={{ display: 'none' }}  // NEVER do this!
/>

// ✅ CORRECT: Use opacity or visibility
<Handle 
  type="source" 
  style={{ opacity: 0 }}              // Invisible but functional
  // OR
  style={{ visibility: 'hidden' }}     // Hidden but functional
/>

// ✅ BEST: Conditional rendering
{showHandle && <Handle type="source" position={Position.Right} />}
```

### React Flow Performance Tips

| Optimization | Implementation |
|--------------|----------------|
| Memoize nodeTypes/edgeTypes | Define outside component |
| Memoize custom nodes | Wrap with `memo()` |
| Use `useShallow` for store selectors | Prevent unnecessary re-renders |
| Debounce position saves | 100-500ms debounce |
| Limit history states | `limit: 50` in zundo |
| Virtualization | Built into React Flow |
| Lazy load node config panels | Dynamic imports |

---

## 11. Documentation Checklist

When implementing automations, update these documentation files:

### Required Updates

| File | What to Add |
|------|-------------|
| `docs/HOOKS_REFERENCE.md` | `useAutomations`, `useAutomationExecutions`, `useAutomationAutoSave`, `useFlowStore`, `useFlowHistory` |
| `docs/EDGE_FUNCTIONS.md` | `execute-automation`, `trigger-automation` function signatures and parameters |
| `docs/DATABASE_SCHEMA.md` | `automations` and `automation_executions` tables, RLS policies, triggers |
| `docs/ARCHITECTURE.md` | Automations system overview in Features section |
| `src/config/routes.ts` | Add `automations` to ROUTE_CONFIG array |
| `src/lib/query-keys.ts` | Add `automations` query key namespace |
| `src/lib/db-selects.ts` | Add `AUTOMATION_*_COLUMNS` constants |
| `src/types/metadata.ts` | Add `AutomationMetadata` if needed for JSONB fields |

### Optional Updates

| File | When to Update |
|------|----------------|
| `docs/SECURITY.md` | If new security patterns are introduced |
| `docs/AI_ARCHITECTURE.md` | When AI tool trigger is implemented |
| `docs/COMPONENT_PATTERNS.md` | If new reusable patterns emerge |

### Checklist per Phase

**Phase 1:** ✅ COMPLETE
- [x] Update DATABASE_SCHEMA.md with new tables
- [x] Update query-keys.ts
- [x] Update routes.ts
- [x] Update db-selects.ts

**Phase 2:** ✅ COMPLETE
- [x] Update HOOKS_REFERENCE.md with useAutomations
- [x] Create automationFlowStore with zundo for undo/redo

**Phase 3:** ✅ COMPLETE
- [x] Create execute-automation edge function
- [x] Document in EDGE_FUNCTIONS.md

**Phase 4:** ✅ COMPLETE
- [x] Create trigger-automation edge function
- [x] Create dispatch-automation-event edge function

**Phase 5:** ✅ COMPLETE
- [x] Create automation-tools.ts for AI integration
- [x] Integrate with widget-chat and tool-executor

**Phase 6:** ✅ COMPLETE
- [x] Final review of all documentation
- [x] Migration tools for webhooks/tools (`src/lib/automation-migration.ts`)
- [x] Automation templates (`src/lib/automation-templates.ts` - 8 templates)
- [x] Action executors (`action-email`, `action-update-lead`, `action-create-booking`)
- [ ] Real-time execution updates (deferred)

---

## Implementation Summary

### Edge Functions Created

| Function | Purpose | Status |
|----------|---------|--------|
| `execute-automation` | Core execution engine with node graph traversal | ✅ Deployed |
| `trigger-automation` | Trigger dispatcher for events/schedules/AI tools | ✅ Deployed |
| `dispatch-automation-event` | Database trigger forwarder | ✅ Deployed |

### Shared Modules Created

| Module | Purpose |
|--------|---------|
| `_shared/automation/types.ts` | Shared type definitions |
| `_shared/automation/variable-resolver.ts` | Template variable resolution |
| `_shared/automation/http-executor.ts` | SSRF-protected HTTP client |
| `_shared/automation/trigger-matcher.ts` | Event matching logic |
| `_shared/automation/executors/*.ts` | 11 node executor implementations |
| `_shared/tools/automation-tools.ts` | AI tool registration |
| `src/lib/automation-migration.ts` | Webhook/tool migration utilities |
| `src/lib/automation-templates.ts` | 8 pre-built automation templates |

### Frontend Components Created

| Component | Purpose |
|-----------|---------|
| `AutomationEditor.tsx` | Main editor with React Flow |
| `FlowEditor.tsx` | React Flow wrapper with drag-drop |
| `FlowToolbar.tsx` | Toolbar with save, test, history |
| `NodeSidebar.tsx` | Draggable node palette |
| `NodeConfigPanel.tsx` | Selected node configuration |
| `ExecutionPanel.tsx` | Execution history sheet |
| `ExecutionHistoryList.tsx` | List of past executions |
| `ExecutionDetail.tsx` | Node-by-node execution trace |
| `TestExecutionDialog.tsx` | Manual test trigger dialog |
| `nodes/*.tsx` | 5 node type components |
| `panels/*.tsx` | 8 config panel components |

### Hooks Created

| Hook | Purpose |
|------|---------|
| `useAutomations` | CRUD operations for automations |
| `useAutomationExecutions` | Execution history with test trigger |
| `useAutomationAutoSave` | Debounced auto-save |

### Store Created

| Store | Purpose |
|-------|---------|
| `automationFlowStore.ts` | Zustand + zundo for undo/redo |

---

## Future Enhancements (Optional)

1. Schedule trigger testing UI
2. Automation versioning/rollback
3. Advanced condition builder UI
4. Template marketplace

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | - | Initial planning document |
| 1.1 | Jan 2026 | - | Consolidated from 5 separate docs |
| 1.2 | Jan 2026 | - | Added 12 missing patterns: skeletons, staleTime, optimistic updates, error boundaries, toast patterns, focus management, route config, useStableObject, icon imports, documentation checklist, component size guidelines, real-time subscriptions |
| 1.3 | Jan 2026 | - | Added 10 React Flow patterns: undo/redo with zustand temporal, useFlowState hook, nodeTypes memoization, connection validation, drag & drop handlers, copy/paste nodes, multi-select patterns, viewport constraints, auto-layout with dagre, viewport persistence |
| 1.4 | Jan 2026 | - | Added 7 critical React Flow patterns from docs deep-dive: CSS stylesheet import, useUpdateNodeInternals hook, ariaLabelConfig for accessibility, ReactFlowProvider placement, handle ID uniqueness, common pitfalls table, handle visibility warning |
| 1.5 | Jan 2026 | - | Updated status to Implementation (85% complete). Marked Phases 1-5 as complete with checkboxes. Added Implementation Summary section documenting all created files. Added Remaining Work section for Phase 6 items. |
| 1.6 | Jan 2026 | - | Phase 6 complete (95% total). Added action executors (`action-email`, `action-update-lead`, `action-create-booking`). Added migration tools (`src/lib/automation-migration.ts`) and 8 templates (`src/lib/automation-templates.ts`). Updated all checklists. |
| 1.7 | Jan 2026 | - | **100% Complete.** Added real-time execution status updates via `useAutomationExecution` hook with Supabase Realtime subscription + polling for running executions. Updated `ExecutionPanel` with live status indicator. |
