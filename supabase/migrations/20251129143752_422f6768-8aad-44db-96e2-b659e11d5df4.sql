-- Add event filtering conditions and response actions to webhooks table
ALTER TABLE public.webhooks 
ADD COLUMN conditions jsonb DEFAULT '{}'::jsonb,
ADD COLUMN response_actions jsonb DEFAULT '{}'::jsonb;

-- Add comments to describe the columns
COMMENT ON COLUMN public.webhooks.conditions IS 'Filtering conditions to determine when webhook should fire (e.g., only send when lead status is new)';
COMMENT ON COLUMN public.webhooks.response_actions IS 'Actions to perform based on webhook API response (e.g., update lead status on success)';