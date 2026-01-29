-- =============================================================================
-- Enterprise Security: Tighten Overly Permissive RLS INSERT Policies
-- =============================================================================

-- 1. Fix messages INSERT policy
-- Widget messages should only be insertable for active widget conversations
DROP POLICY IF EXISTS "Public can create messages" ON public.messages;

CREATE POLICY "Insert messages for valid conversations" ON public.messages
FOR INSERT WITH CHECK (
  -- Service role can insert any message (for AI responses)
  auth.role() = 'service_role'
  OR
  -- Widget can insert to active widget conversations
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND c.channel = 'widget'
    AND c.status IN ('active', 'human_takeover')
    AND c.expires_at > now()
  )
  OR
  -- Authenticated users can insert to their own conversations
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND has_account_access(c.user_id)
    )
  )
);

-- 2. Fix article_feedback - require valid article reference
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.article_feedback;

CREATE POLICY "Insert feedback for valid articles" ON public.article_feedback
FOR INSERT WITH CHECK (
  -- Require valid article reference and session
  article_id IS NOT NULL
  AND session_id IS NOT NULL
);

-- 3. Fix kb_article_feedback - require valid fields
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.kb_article_feedback;

CREATE POLICY "Insert KB feedback with validation" ON public.kb_article_feedback
FOR INSERT WITH CHECK (
  article_slug IS NOT NULL
  AND category_id IS NOT NULL
  AND session_id IS NOT NULL
);

-- 4. Fix kb_article_views - add basic validation
DROP POLICY IF EXISTS "Anyone can record article views" ON public.kb_article_views;

CREATE POLICY "Record article views with validation" ON public.kb_article_views
FOR INSERT WITH CHECK (
  article_slug IS NOT NULL
  AND category_id IS NOT NULL
  AND session_id IS NOT NULL
);

-- 5. Restrict knowledge_chunks to service_role only
DROP POLICY IF EXISTS "Service can insert chunks" ON public.knowledge_chunks;

CREATE POLICY "Service role can insert chunks" ON public.knowledge_chunks
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 6. Fix lead_activities - allow service role OR authenticated users for their leads
DROP POLICY IF EXISTS "Service can insert activities" ON public.lead_activities;

CREATE POLICY "Insert lead activities with access" ON public.lead_activities
FOR INSERT WITH CHECK (
  auth.role() = 'service_role'
  OR
  -- Allow authenticated users to log activities for leads they have access to
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM leads l
      WHERE l.id = lead_id
      AND has_account_access(l.user_id)
    )
  )
);

-- 7. Restrict pending_invitations to service_role only
DROP POLICY IF EXISTS "System can insert invitations" ON public.pending_invitations;

CREATE POLICY "Service role can insert invitations" ON public.pending_invitations
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 8. Restrict usage_metrics to service_role only
DROP POLICY IF EXISTS "System can insert usage metrics" ON public.usage_metrics;

CREATE POLICY "Service role can insert usage metrics" ON public.usage_metrics
FOR INSERT WITH CHECK (auth.role() = 'service_role');