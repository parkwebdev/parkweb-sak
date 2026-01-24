-- Clean up plan features: remove aspirational features and normalize api key
-- Remove features we're not implementing and fix api vs api_access inconsistency

UPDATE plans 
SET features = (
  -- Start fresh with only the features we want to keep
  COALESCE(
    jsonb_build_object(
      'widget', COALESCE((features->>'widget')::boolean, (features->>'widget') = 'true', false),
      'hosted_page', COALESCE((features->>'hosted_page')::boolean, (features->>'hosted_page') = 'true', false),
      'api', COALESCE(
        (features->>'api')::boolean, 
        (features->>'api') = 'true',
        (features->>'api_access')::boolean,
        (features->>'api_access') = 'true',
        false
      ),
      'webhooks', COALESCE((features->>'webhooks')::boolean, (features->>'webhooks') = 'true', false)
    ),
    '{}'::jsonb
  )
)
WHERE features IS NOT NULL;