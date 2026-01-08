# Automations Database Schema

> Database tables, RLS policies, and migrations for the Automations system

## Tables

### `automations`

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

### `automation_executions`

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

-- Partition by month for large-scale deployments (optional)
-- CREATE TABLE automation_executions_y2025m01 PARTITION OF automation_executions
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

## RLS Policies

### `automations` Policies

```sql
-- Enable RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Select: Account members can view
CREATE POLICY "Users can view automations in their account"
  ON public.automations
  FOR SELECT
  USING (public.has_account_access(user_id));

-- Insert: Account members can create
CREATE POLICY "Users can create automations in their account"
  ON public.automations
  FOR INSERT
  WITH CHECK (
    public.has_account_access(user_id)
    AND agent_id IN (
      SELECT id FROM public.agents 
      WHERE public.has_account_access(agents.user_id)
    )
  );

-- Update: Account members can update
CREATE POLICY "Users can update automations in their account"
  ON public.automations
  FOR UPDATE
  USING (public.has_account_access(user_id))
  WITH CHECK (public.has_account_access(user_id));

-- Delete: Account members can delete
CREATE POLICY "Users can delete automations in their account"
  ON public.automations
  FOR DELETE
  USING (public.has_account_access(user_id));
```

### `automation_executions` Policies

```sql
-- Enable RLS
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- Select: Account members can view via automation
CREATE POLICY "Users can view executions for their automations"
  ON public.automation_executions
  FOR SELECT
  USING (
    automation_id IN (
      SELECT id FROM public.automations 
      WHERE public.has_account_access(user_id)
    )
  );

-- Insert: Only edge functions (service role) can insert
-- No policy needed - handled by service role

-- Delete: Account members can delete old executions
CREATE POLICY "Users can delete executions for their automations"
  ON public.automation_executions
  FOR DELETE
  USING (
    automation_id IN (
      SELECT id FROM public.automations 
      WHERE public.has_account_access(user_id)
    )
  );
```

## DB Select Columns

Add to `src/lib/db-selects.ts`:

```typescript
/**
 * Automation list columns
 * Excludes large JSONB fields (nodes, edges) for list views
 */
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

/**
 * Automation detail columns
 * Full data including flow definition
 */
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

/**
 * Automation execution list columns
 */
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

/**
 * Automation execution detail columns
 * Includes full node execution data
 */
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

## Query Keys

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

## Database Triggers

### Event-Based Automation Firing

```sql
-- Function to fire automations on lead events
CREATE OR REPLACE FUNCTION public.fire_lead_automations()
RETURNS TRIGGER AS $$
DECLARE
  automation RECORD;
  trigger_data JSONB;
BEGIN
  -- Build trigger data
  trigger_data := jsonb_build_object(
    'event', TG_OP,
    'table', TG_TABLE_NAME,
    'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
    'timestamp', now()
  );

  -- Find matching automations
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
    -- Queue automation execution via pg_notify
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

-- Attach trigger to leads table
CREATE TRIGGER trigger_lead_automations
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.fire_lead_automations();
```

### Conversation Event Trigger

```sql
-- Function to fire automations on conversation events
CREATE OR REPLACE FUNCTION public.fire_conversation_automations()
RETURNS TRIGGER AS $$
DECLARE
  automation RECORD;
  trigger_data JSONB;
  owner_id UUID;
BEGIN
  -- Get account owner from agent
  SELECT agents.user_id INTO owner_id
  FROM public.agents
  WHERE agents.id = COALESCE(NEW.agent_id, OLD.agent_id);

  -- Build trigger data
  trigger_data := jsonb_build_object(
    'event', TG_OP,
    'table', TG_TABLE_NAME,
    'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
    'timestamp', now()
  );

  -- Find matching automations
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

-- Attach trigger to conversations table
CREATE TRIGGER trigger_conversation_automations
  AFTER INSERT OR UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.fire_conversation_automations();
```

## Execution Stats Update

```sql
-- Function to update automation stats after execution
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

## Cleanup Job

```sql
-- Function to clean up old executions (run via pg_cron)
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
