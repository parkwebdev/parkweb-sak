# Automations Node Types

> Node definitions, Zod schemas, and executor interfaces

## Node Categories

| Category | Purpose | Nodes |
|----------|---------|-------|
| Triggers | Start automation | Event, Schedule, Manual, AI Tool |
| Actions | Perform operations | HTTP Request, Send Email, Update Lead, Create Booking |
| Logic | Control flow | Condition, Switch, Loop, Delay, Stop |
| Transform | Data manipulation | Set Variable, Map Data, Filter Array, Aggregate |
| AI | AI operations | Generate Text, Classify, Extract |

## Base Node Interface

```typescript
// src/types/automations.ts

import type { Node, Edge } from '@xyflow/react';

/**
 * Base configuration shared by all nodes
 */
export interface BaseNodeData {
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Node type identifier
 */
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

/**
 * Automation node extending React Flow Node
 */
export type AutomationNode = Node<AutomationNodeData, AutomationNodeType>;

/**
 * Automation edge extending React Flow Edge
 */
export type AutomationEdge = Edge<{
  condition?: string;
  label?: string;
}>;
```

## Trigger Nodes

### Event Trigger

Fires when a database event occurs.

```typescript
// Zod Schema
import { z } from 'zod';

export const eventSourceSchema = z.enum([
  'lead',
  'conversation',
  'booking',
  'message',
]);

export const eventTypeSchema = z.enum([
  'INSERT',
  'UPDATE',
  'DELETE',
  'any',
]);

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

// Node Data
export interface TriggerEventNodeData extends BaseNodeData {
  config: TriggerEventConfig;
}
```

### Schedule Trigger

Fires on a cron schedule.

```typescript
export const scheduleFrequencySchema = z.enum([
  'every_minute',
  'every_5_minutes',
  'every_15_minutes',
  'every_30_minutes',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'custom',
]);

export const triggerScheduleConfigSchema = z.object({
  type: z.literal('trigger-schedule'),
  frequency: scheduleFrequencySchema,
  cronExpression: z.string().optional(), // For 'custom'
  timezone: z.string().default('UTC'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type TriggerScheduleConfig = z.infer<typeof triggerScheduleConfigSchema>;

export interface TriggerScheduleNodeData extends BaseNodeData {
  config: TriggerScheduleConfig;
}
```

### Manual Trigger

Fired by user action.

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
    options: z.array(z.string()).optional(), // For select type
  })).optional(),
});

export type TriggerManualConfig = z.infer<typeof triggerManualConfigSchema>;

export interface TriggerManualNodeData extends BaseNodeData {
  config: TriggerManualConfig;
}
```

### AI Tool Trigger

Called by AI as a tool during conversation.

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

## Action Nodes

### HTTP Request

Makes external API calls with SSRF protection.

```typescript
export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const actionHttpConfigSchema = z.object({
  type: z.literal('action-http'),
  method: httpMethodSchema,
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(), // JSON string or template
  bodyType: z.enum(['json', 'form', 'raw']).default('json'),
  timeout: z.number().int().min(1000).max(30000).default(10000),
  retryCount: z.number().int().min(0).max(3).default(0),
  retryDelay: z.number().int().min(1000).max(60000).default(1000),
  successStatusCodes: z.array(z.number().int()).default([200, 201, 202, 204]),
  outputVariable: z.string().optional(), // Store response in variable
});

export type ActionHttpConfig = z.infer<typeof actionHttpConfigSchema>;

export interface ActionHttpNodeData extends BaseNodeData {
  config: ActionHttpConfig;
}
```

### Send Email

Sends email via configured provider.

```typescript
export const actionEmailConfigSchema = z.object({
  type: z.literal('action-email'),
  to: z.string().min(1), // Template: {{lead.email}}
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  bodyType: z.enum(['text', 'html']).default('html'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  replyTo: z.string().optional(),
  templateId: z.string().uuid().optional(), // Use email template
});

export type ActionEmailConfig = z.infer<typeof actionEmailConfigSchema>;

export interface ActionEmailNodeData extends BaseNodeData {
  config: ActionEmailConfig;
}
```

### Update Lead

Updates lead fields.

```typescript
export const actionUpdateLeadConfigSchema = z.object({
  type: z.literal('action-update-lead'),
  leadId: z.string(), // Template: {{trigger.lead.id}} or specific ID
  updates: z.record(z.unknown()), // Field -> value mapping
  createIfNotExists: z.boolean().default(false),
});

export type ActionUpdateLeadConfig = z.infer<typeof actionUpdateLeadConfigSchema>;

export interface ActionUpdateLeadNodeData extends BaseNodeData {
  config: ActionUpdateLeadConfig;
}
```

### Create Booking

Creates a calendar booking.

```typescript
export const actionCreateBookingConfigSchema = z.object({
  type: z.literal('action-create-booking'),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startTime: z.string(), // Template or ISO string
  duration: z.number().int().min(5).max(480), // Minutes
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

## Logic Nodes

### Condition

Branches flow based on conditions.

```typescript
export const conditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'gt',
  'gte',
  'lt',
  'lte',
  'is_empty',
  'is_not_empty',
  'is_null',
  'is_not_null',
  'matches_regex',
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

### Switch

Multi-way branching.

```typescript
export const switchCaseSchema = z.object({
  label: z.string().min(1),
  value: z.unknown(),
  handleId: z.string(), // React Flow handle ID
});

export const logicSwitchConfigSchema = z.object({
  type: z.literal('logic-switch'),
  expression: z.string().min(1), // Field or template to evaluate
  cases: z.array(switchCaseSchema).min(1),
  defaultHandleId: z.string(), // Fallback handle
});

export type LogicSwitchConfig = z.infer<typeof logicSwitchConfigSchema>;

export interface LogicSwitchNodeData extends BaseNodeData {
  config: LogicSwitchConfig;
}
```

### Loop

Iterates over arrays.

```typescript
export const logicLoopConfigSchema = z.object({
  type: z.literal('logic-loop'),
  arrayExpression: z.string().min(1), // Array to iterate
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

### Delay

Pauses execution.

```typescript
export const delayUnitSchema = z.enum(['seconds', 'minutes', 'hours', 'days']);

export const logicDelayConfigSchema = z.object({
  type: z.literal('logic-delay'),
  duration: z.number().int().min(1),
  unit: delayUnitSchema,
  maxDelay: z.number().int().optional(), // Fail if delay exceeds this (seconds)
});

export type LogicDelayConfig = z.infer<typeof logicDelayConfigSchema>;

export interface LogicDelayNodeData extends BaseNodeData {
  config: LogicDelayConfig;
}
```

### Stop

Ends automation execution.

```typescript
export const logicStopConfigSchema = z.object({
  type: z.literal('logic-stop'),
  status: z.enum(['success', 'failure', 'cancelled']).default('success'),
  message: z.string().optional(),
  outputVariable: z.string().optional(), // Final output value
});

export type LogicStopConfig = z.infer<typeof logicStopConfigSchema>;

export interface LogicStopNodeData extends BaseNodeData {
  config: LogicStopConfig;
}
```

## Transform Nodes

### Set Variable

Sets execution context variables.

```typescript
export const transformSetVariableConfigSchema = z.object({
  type: z.literal('transform-set-variable'),
  variables: z.array(z.object({
    name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
    value: z.unknown(), // Template or literal
    type: z.enum(['string', 'number', 'boolean', 'object', 'array']).optional(),
  })).min(1),
});

export type TransformSetVariableConfig = z.infer<typeof transformSetVariableConfigSchema>;

export interface TransformSetVariableNodeData extends BaseNodeData {
  config: TransformSetVariableConfig;
}
```

### Map Data

Transforms arrays.

```typescript
export const transformMapConfigSchema = z.object({
  type: z.literal('transform-map'),
  inputArray: z.string().min(1), // Expression
  outputVariable: z.string().min(1),
  mapping: z.record(z.string()), // Output field -> expression
});

export type TransformMapConfig = z.infer<typeof transformMapConfigSchema>;

export interface TransformMapNodeData extends BaseNodeData {
  config: TransformMapConfig;
}
```

### Filter Array

Filters arrays based on conditions.

```typescript
export const transformFilterConfigSchema = z.object({
  type: z.literal('transform-filter'),
  inputArray: z.string().min(1),
  outputVariable: z.string().min(1),
  condition: z.string().min(1), // Expression evaluating to boolean
});

export type TransformFilterConfig = z.infer<typeof transformFilterConfigSchema>;

export interface TransformFilterNodeData extends BaseNodeData {
  config: TransformFilterConfig;
}
```

## AI Nodes

### AI Generate

Generates text using AI.

```typescript
export const aiGenerateConfigSchema = z.object({
  type: z.literal('ai-generate'),
  prompt: z.string().min(1),
  model: z.enum(['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku']).default('gpt-4o-mini'),
  maxTokens: z.number().int().min(1).max(4096).default(500),
  temperature: z.number().min(0).max(2).default(0.7),
  outputVariable: z.string().min(1),
  outputFormat: z.enum(['text', 'json']).default('text'),
  jsonSchema: z.record(z.unknown()).optional(), // For JSON output
});

export type AIGenerateConfig = z.infer<typeof aiGenerateConfigSchema>;

export interface AIGenerateNodeData extends BaseNodeData {
  config: AIGenerateConfig;
}
```

### AI Classify

Classifies text into categories.

```typescript
export const aiClassifyConfigSchema = z.object({
  type: z.literal('ai-classify'),
  input: z.string().min(1), // Text or template
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

### AI Extract

Extracts structured data from text.

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

## Node Executor Interface

```typescript
/**
 * Execution context passed to node executors
 */
export interface ExecutionContext {
  automationId: string;
  executionId: string;
  agentId: string;
  userId: string;
  variables: Record<string, unknown>;
  trigger: {
    type: string;
    data: unknown;
  };
  testMode: boolean;
}

/**
 * Result from node execution
 */
export interface NodeExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  nextHandleId?: string; // For conditional routing
  variables?: Record<string, unknown>; // Variables to merge
  duration_ms: number;
}

/**
 * Node executor function type
 */
export type NodeExecutor<T extends BaseNodeData> = (
  node: Node<T>,
  context: ExecutionContext,
) => Promise<NodeExecutionResult>;

/**
 * Registry of node executors
 */
export type NodeExecutorRegistry = {
  [K in AutomationNodeType]: NodeExecutor<AutomationNodeData>;
};
```

## Variable Resolution

Variables in node configs use mustache-style templates:

```typescript
/**
 * Resolves template variables in a string
 * 
 * @example
 * resolveTemplate('Hello {{lead.name}}', { lead: { name: 'John' } })
 * // Returns: 'Hello John'
 */
export function resolveTemplate(
  template: string,
  variables: Record<string, unknown>,
): string;

/**
 * Available variable namespaces
 */
export interface VariableNamespaces {
  trigger: {
    type: string;
    data: unknown;
    timestamp: string;
  };
  lead?: LeadData;
  conversation?: ConversationData;
  booking?: BookingData;
  env: {
    now: string;
    today: string;
    agent_id: string;
  };
  [customVariable: string]: unknown;
}
```

## UntitledUI Icons

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
