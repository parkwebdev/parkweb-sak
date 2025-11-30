-- Comprehensive security fixes for ChatPad

-- 1. Fix help_articles public user_id exposure
DROP POLICY IF EXISTS "Public can view help articles" ON public.help_articles;

CREATE POLICY "Authenticated users can view help articles"
ON public.help_articles FOR SELECT TO authenticated
USING (true);

-- 2. Add missing read/write policies for conversations
CREATE POLICY "Users can view accessible conversations"
ON public.conversations FOR SELECT TO authenticated
USING (has_account_access(user_id));

CREATE POLICY "Users can update accessible conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible conversations"
ON public.conversations FOR DELETE TO authenticated
USING (has_account_access(user_id));

-- 3. Add missing read policy for messages
CREATE POLICY "Users can view messages in accessible conversations"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND has_account_access(c.user_id)
  )
);

-- 4. Add missing policies for conversation_takeovers
CREATE POLICY "Users can view takeovers for accessible conversations"
ON public.conversation_takeovers FOR SELECT TO authenticated
USING (
  taken_over_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_takeovers.conversation_id
    AND has_account_access(c.user_id)
  )
);

CREATE POLICY "Users can create takeovers for accessible conversations"
ON public.conversation_takeovers FOR INSERT TO authenticated
WITH CHECK (
  taken_over_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND has_account_access(c.user_id)
  )
);

-- 5. Add write policies for help_categories
CREATE POLICY "Users can create categories for their agents"
ON public.help_categories FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_id AND agents.user_id = auth.uid())
);

CREATE POLICY "Users can update accessible categories"
ON public.help_categories FOR UPDATE TO authenticated
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible categories"
ON public.help_categories FOR DELETE TO authenticated
USING (has_account_access(user_id));

-- 6. Add write policies for help_articles
CREATE POLICY "Users can create articles for their agents"
ON public.help_articles FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_id AND agents.user_id = auth.uid())
);

CREATE POLICY "Users can update accessible articles"
ON public.help_articles FOR UPDATE TO authenticated
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible articles"
ON public.help_articles FOR DELETE TO authenticated
USING (has_account_access(user_id));

-- 7. Secure client uploads storage bucket
DROP POLICY IF EXISTS "Allow public client file access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public client file uploads" ON storage.objects;