-- Fix plan feature flags to match tier structure
-- Starter: foundational features only
UPDATE public.plans 
SET features = jsonb_build_object(
  'widget', true,
  'knowledge_sources', true,
  'calendar_booking', true,
  'api', false,
  'webhooks', false,
  'custom_tools', false,
  'integrations', false,
  'locations', false,
  'advanced_analytics', false,
  'report_builder', false,
  'scheduled_reports', false
)
WHERE name = 'Starter';

-- Business: adds locations, integrations, analytics, report builder
UPDATE public.plans 
SET features = jsonb_build_object(
  'widget', true,
  'knowledge_sources', true,
  'calendar_booking', true,
  'locations', true,
  'integrations', true,
  'advanced_analytics', true,
  'report_builder', true,
  'api', false,
  'webhooks', false,
  'custom_tools', false,
  'scheduled_reports', false
)
WHERE name = 'Business';

-- Advanced: all features enabled
UPDATE public.plans 
SET features = jsonb_build_object(
  'widget', true,
  'knowledge_sources', true,
  'calendar_booking', true,
  'locations', true,
  'integrations', true,
  'advanced_analytics', true,
  'report_builder', true,
  'api', true,
  'webhooks', true,
  'custom_tools', true,
  'scheduled_reports', true
)
WHERE name = 'Advanced';