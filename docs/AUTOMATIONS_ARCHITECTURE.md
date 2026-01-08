# Automations Architecture

> **Version**: 1.0  
> **Status**: Planning  
> **Created**: January 2026  
> **Related**: [Architecture](./ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md), [Edge Functions](./EDGE_FUNCTIONS.md), [Security](./SECURITY.md)

A comprehensive plan for implementing a visual automation/flow builder that will replace Custom Tools and Webhooks with a unified, node-based workflow system.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Database Schema](#2-database-schema)
3. [Node Types](#3-node-types)
4. [Execution Engine](#4-execution-engine)
5. [Security](#5-security)
6. [Frontend Implementation](#6-frontend-implementation)
7. [Implementation Phases](#7-implementation-phases-temporary)
8. [Migration Strategy](#8-migration-strategy)

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

### UntitledUI Icons

| Node Type | Icon Import |
|-----------|-------------|
| `trigger-event` | `Zap` |
| `trigger-schedule` | `Clock` |
| `trigger-manual` | `PlayCircle` |
| `trigger-ai-tool` | `Stars02` |
| `action-http` | `Globe02` |
| `action-email` | `Mail01` |
| `action-update-lead` | `User01` |
| `action-create-booking` | `Calendar` |
| `action-send-message` | `MessageSquare01` |
| `logic-condition` | `GitBranch01` |
| `logic-switch` | `SwitchHorizontal01` |
| `logic-loop` | `RefreshCw01` |
| `logic-delay` | `ClockStopwatch` |
| `logic-stop` | `StopCircle` |
| `transform-set-variable` | `Variable` |
| `transform-map` | `Dataflow03` |
| `transform-filter` | `FilterLines` |
| `transform-aggregate` | `BarChart01` |
| `ai-generate` | `Stars02` |
| `ai-classify` | `Tag01` |
| `ai-extract` | `FileSearch01` |

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

### File Structure

```
src/
├── pages/
│   └── Automations.tsx                    # Main page (~150 lines)
│
├── components/automations/
│   ├── AutomationsList.tsx                # DataTable list view
│   ├── AutomationCard.tsx                 # Card for grid view
│   ├── AutomationStatusBadge.tsx          # Status indicator
│   │
│   ├── editor/
│   │   ├── FlowEditor.tsx                 # React Flow wrapper
│   │   ├── FlowCanvas.tsx                 # Canvas with controls
│   │   ├── FlowToolbar.tsx                # Top toolbar
│   │   ├── FlowMinimap.tsx                # Minimap wrapper
│   │   └── FlowControls.tsx               # Zoom/fit controls
│   │
│   ├── sidebar/
│   │   ├── NodeSidebar.tsx                # Draggable palette
│   │   ├── NodeCategory.tsx               # Category group
│   │   └── DraggableNode.tsx              # Draggable item
│   │
│   ├── nodes/
│   │   ├── BaseNode.tsx                   # Shared node wrapper
│   │   ├── NodeHandle.tsx                 # Custom handle
│   │   ├── index.ts                       # nodeTypes export
│   │   ├── triggers/                      # Trigger node components
│   │   ├── actions/                       # Action node components
│   │   ├── logic/                         # Logic node components
│   │   ├── transform/                     # Transform node components
│   │   └── ai/                            # AI node components
│   │
│   ├── panels/
│   │   ├── NodeConfigPanel.tsx            # Right panel
│   │   ├── TriggerConfigForm.tsx          # Trigger config
│   │   ├── ActionConfigForm.tsx           # Action config
│   │   ├── LogicConfigForm.tsx            # Logic config
│   │   └── ConditionBuilder.tsx           # Condition UI
│   │
│   ├── variables/
│   │   ├── VariablePicker.tsx             # Variable selector
│   │   ├── VariableChip.tsx               # Display chip
│   │   └── VariableInput.tsx              # Input with picker
│   │
│   └── execution/
│       ├── ExecutionHistory.tsx           # History list
│       ├── ExecutionTimeline.tsx          # Visual timeline
│       ├── ExecutionNodeStatus.tsx        # Node status
│       └── TestRunDialog.tsx              # Test execution
│
├── hooks/
│   ├── useAutomations.ts                  # CRUD operations
│   ├── useAutomation.ts                   # Single automation
│   ├── useAutomationExecutions.ts         # Execution history
│   └── useFlowState.ts                    # React Flow state
│
└── types/
    └── automations.ts                     # All type definitions
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
import { getErrorMessage } from '@/types/errors';
import { toast } from 'sonner';
import { AUTOMATION_LIST_COLUMNS } from '@/lib/db-selects';
import type { Automation, AutomationInsert, AutomationUpdate } from '@/types/automations';

export function useAutomations() {
  const queryClient = useQueryClient();
  const { accountOwnerId } = useAccountOwnerId();
  const { agent } = useAgent();

  const { data: automations, isLoading, error } = useQuery({
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

  // ... updateMutation, deleteMutation, toggleMutation

  return {
    automations: automations ?? [],
    isLoading,
    error,
    createAutomation: createMutation.mutateAsync,
    // ... other mutations
  };
}
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

## 7. Implementation Phases (TEMPORARY)

> **Note:** This section will be removed after implementation is complete.

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

## 8. Migration Strategy

### Phase 1: Parallel Operation

Both systems run simultaneously:
- New `automations` system available at `/automations`
- Existing `webhooks` and `agent_tools` continue working
- No automatic migration

### Phase 2: Migration Tools

```typescript
// src/lib/automation-migration.ts

export async function migrateWebhookToAutomation(webhookId: string): Promise<Automation> {
  // Load webhook
  // Create automation with equivalent trigger/action
  // Return new automation (webhook unchanged)
}

export async function migrateToolToAutomation(toolId: string): Promise<Automation> {
  // Load agent_tool
  // Create automation with AI tool trigger
  // Return new automation (tool unchanged)
}
```

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

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | - | Initial planning document |
| 1.1 | Jan 2026 | - | Consolidated from 5 separate docs |
