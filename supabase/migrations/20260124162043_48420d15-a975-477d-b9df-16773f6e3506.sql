-- =====================================================
-- COMPLETE REMOVAL OF API ACCESS FEATURE
-- =====================================================

-- 1. Drop API key audit trigger
DROP TRIGGER IF EXISTS trigger_log_api_key_changes ON agent_api_keys;
DROP FUNCTION IF EXISTS log_api_key_changes();

-- 2. Drop API key validation function
DROP FUNCTION IF EXISTS validate_api_key(TEXT, UUID);

-- 3. Drop agent_api_keys table (includes RLS policies and indexes)
DROP TABLE IF EXISTS agent_api_keys CASCADE;

-- 4. Remove api_calls_count from usage_metrics
ALTER TABLE usage_metrics DROP COLUMN IF EXISTS api_calls_count;

-- 5. Update plans to remove api feature and max_api_calls_per_month limit
UPDATE plans SET 
  features = features - 'api',
  limits = limits - 'max_api_calls_per_month';

-- 6. Delete API Access help article if it exists
DELETE FROM platform_hc_articles 
WHERE category_id = 'ari' AND slug = 'api-access';