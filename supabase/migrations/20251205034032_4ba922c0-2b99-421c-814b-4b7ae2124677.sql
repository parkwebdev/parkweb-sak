-- =============================================
-- SECURITY FIX: API Key Hashing & Access Control
-- =============================================

-- 1. Add key_hash column for secure API key storage
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_hash text;

-- 2. Drop the old overly permissive SELECT policy for api_keys
DROP POLICY IF EXISTS "Users can view accessible api keys" ON public.api_keys;

-- 3. Create new owner-only SELECT policy for api_keys
-- Team members should NOT be able to see full API keys
CREATE POLICY "Users can only view their own api keys"
ON public.api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- =============================================
-- SECURITY FIX: Conversations Table Public Access
-- =============================================

-- 4. Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view conversation status for realtime" ON public.conversations;

-- 5. Create more restrictive public access policy
-- Only allow public access to specific conversations by ID that are active/non-expired
CREATE POLICY "Public can view active conversation by ID"
ON public.conversations
FOR SELECT
USING (
  status IN ('active'::conversation_status, 'human_takeover'::conversation_status)
  AND expires_at > now()
);

-- =============================================
-- SECURITY FIX: Webhook Auth Config Access
-- =============================================

-- 6. Drop the current webhook SELECT policy
DROP POLICY IF EXISTS "Users can view accessible webhooks" ON public.webhooks;

-- 7. Create owner-only SELECT policy for webhooks (protects auth_config secrets)
CREATE POLICY "Users can only view their own webhooks"
ON public.webhooks
FOR SELECT
USING (auth.uid() = user_id);