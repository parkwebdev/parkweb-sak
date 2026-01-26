-- Clean up duplicate history entries (keep oldest per config_key+version)
DELETE FROM platform_config_history 
WHERE id NOT IN (
  SELECT (array_agg(id ORDER BY created_at ASC))[1]
  FROM platform_config_history 
  GROUP BY config_key, version
);

-- Add unique constraint to prevent future duplicate spam
ALTER TABLE platform_config_history 
ADD CONSTRAINT platform_config_history_key_version_unique 
UNIQUE (config_key, version);