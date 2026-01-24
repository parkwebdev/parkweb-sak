-- Standardize plan limits to use consistent max_* prefixed keys
-- Remove legacy keys and consolidate conflicting values

-- Starter Plan: Consolidate to standardized keys (using more generous legacy values)
UPDATE plans 
SET limits = jsonb_build_object(
  'max_conversations_per_month', 200,
  'max_knowledge_sources', 1,
  'max_team_members', 2,
  'max_webhooks', 2
),
updated_at = now()
WHERE name = 'Starter';

-- Business Plan: Consolidate and remove legacy keys
UPDATE plans 
SET limits = jsonb_build_object(
  'max_conversations_per_month', 400,
  'max_knowledge_sources', 5,
  'max_team_members', 3,
  'max_webhooks', 5
),
updated_at = now()
WHERE name = 'Business';

-- Enterprise Plan: Add all required keys (NULL = unlimited)
UPDATE plans 
SET limits = jsonb_build_object(
  'max_conversations_per_month', NULL,
  'max_knowledge_sources', NULL,
  'max_team_members', NULL,
  'max_webhooks', NULL
),
updated_at = now()
WHERE name = 'Enterprise';