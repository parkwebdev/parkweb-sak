-- Update existing human messages to use current avatar from profiles
UPDATE messages m
SET metadata = jsonb_set(
  COALESCE(m.metadata, '{}')::jsonb,
  '{sender_avatar}',
  to_jsonb(p.avatar_url)
)
FROM profiles p
WHERE m.metadata->>'sender_type' = 'human'
  AND m.metadata->>'sender_id' = p.user_id::text
  AND p.avatar_url IS NOT NULL;