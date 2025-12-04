-- Add agent_id column to webhooks table
ALTER TABLE public.webhooks 
ADD COLUMN agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_webhooks_agent_id ON public.webhooks(agent_id);

-- Update RLS policies to allow agent-based access
DROP POLICY IF EXISTS "Users can view accessible webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can create their own webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can update accessible webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can delete accessible webhooks" ON public.webhooks;

-- New policies that work with both user_id and agent_id
CREATE POLICY "Users can view accessible webhooks" 
ON public.webhooks 
FOR SELECT 
USING (
  has_account_access(user_id) OR 
  (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  ))
);

CREATE POLICY "Users can create webhooks for their agents" 
ON public.webhooks 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (agent_id IS NULL OR EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  ))
);

CREATE POLICY "Users can update accessible webhooks" 
ON public.webhooks 
FOR UPDATE 
USING (
  has_account_access(user_id) OR 
  (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  ))
);

CREATE POLICY "Users can delete accessible webhooks" 
ON public.webhooks 
FOR DELETE 
USING (
  has_account_access(user_id) OR 
  (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  ))
);