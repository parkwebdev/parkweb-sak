-- Add unique constraint for usage metrics tracking
ALTER TABLE public.usage_metrics 
DROP CONSTRAINT IF EXISTS usage_metrics_org_period_unique;

ALTER TABLE public.usage_metrics 
ADD CONSTRAINT usage_metrics_org_period_unique 
UNIQUE (org_id, period_start);

-- Insert default plans if they don't exist
INSERT INTO public.plans (name, price_monthly, price_yearly, limits, features, active)
VALUES 
  (
    'Free',
    0,
    0,
    '{
      "max_agents": 1,
      "max_conversations_per_month": 100,
      "max_api_calls_per_month": 1000,
      "max_knowledge_sources": 10,
      "max_team_members": 1
    }'::jsonb,
    '{
      "basic_analytics": true,
      "email_support": false,
      "priority_support": false,
      "custom_domain": false,
      "white_label": false
    }'::jsonb,
    true
  ),
  (
    'Pro',
    2900,
    29000,
    '{
      "max_agents": 10,
      "max_conversations_per_month": 5000,
      "max_api_calls_per_month": 50000,
      "max_knowledge_sources": 100,
      "max_team_members": 10
    }'::jsonb,
    '{
      "basic_analytics": true,
      "advanced_analytics": true,
      "email_support": true,
      "priority_support": false,
      "custom_domain": true,
      "white_label": true
    }'::jsonb,
    true
  ),
  (
    'Business',
    9900,
    99000,
    '{
      "max_agents": 50,
      "max_conversations_per_month": 25000,
      "max_api_calls_per_month": 250000,
      "max_knowledge_sources": 500,
      "max_team_members": 50
    }'::jsonb,
    '{
      "basic_analytics": true,
      "advanced_analytics": true,
      "email_support": true,
      "priority_support": true,
      "custom_domain": true,
      "white_label": true,
      "api_access": true,
      "sla": true
    }'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  updated_at = now();