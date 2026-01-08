-- Create automations table for storing flow definitions
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

-- Create indexes for automations
CREATE INDEX idx_automations_agent ON public.automations(agent_id);
CREATE INDEX idx_automations_user ON public.automations(user_id);
CREATE INDEX idx_automations_status ON public.automations(status) WHERE enabled = true;
CREATE INDEX idx_automations_trigger ON public.automations(trigger_type) WHERE enabled = true;

-- Trigger for updated_at
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create automation_executions table for debugging and analytics
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

-- Create indexes for automation_executions
CREATE INDEX idx_executions_automation ON public.automation_executions(automation_id);
CREATE INDEX idx_executions_status ON public.automation_executions(status);
CREATE INDEX idx_executions_started ON public.automation_executions(started_at DESC);
CREATE INDEX idx_executions_lead ON public.automation_executions(lead_id) WHERE lead_id IS NOT NULL;

-- Enable RLS on automations
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

-- Enable RLS on automation_executions
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

-- Create function to update automation stats when execution completes
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

-- Create trigger to update automation stats on execution completion
CREATE TRIGGER trigger_update_automation_stats
  AFTER UPDATE ON public.automation_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_automation_stats();