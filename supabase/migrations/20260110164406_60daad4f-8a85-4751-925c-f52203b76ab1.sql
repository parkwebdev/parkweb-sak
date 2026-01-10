-- Purge all lead + conversation data for the current app user (scoped by user_id)
-- NOTE: This is a DATA DELETION migration.

DO $$
DECLARE
  v_user_id uuid := 'cfdcde65-d8cc-45c3-8512-1155ceb041da'::uuid;
BEGIN
  -- Delete conversation-dependent rows first
  DELETE FROM public.conversation_ratings r
  USING public.conversations c
  WHERE r.conversation_id = c.id
    AND c.user_id = v_user_id;

  DELETE FROM public.conversation_takeovers t
  USING public.conversations c
  WHERE t.conversation_id = c.id
    AND c.user_id = v_user_id;

  DELETE FROM public.conversation_memories m
  USING public.conversations c
  WHERE m.conversation_id = c.id
    AND c.user_id = v_user_id;

  DELETE FROM public.calendar_events e
  USING public.conversations c
  WHERE e.conversation_id = c.id
    AND c.user_id = v_user_id;

  DELETE FROM public.messages msg
  USING public.conversations c
  WHERE msg.conversation_id = c.id
    AND c.user_id = v_user_id;

  -- Delete lead-dependent rows
  DELETE FROM public.lead_comments lc
  USING public.leads l
  WHERE lc.lead_id = l.id
    AND l.user_id = v_user_id;

  DELETE FROM public.lead_assignees la
  USING public.leads l
  WHERE la.lead_id = l.id
    AND l.user_id = v_user_id;

  DELETE FROM public.lead_activities act
  USING public.leads l
  WHERE act.lead_id = l.id
    AND l.user_id = v_user_id;

  DELETE FROM public.calendar_events e
  USING public.leads l
  WHERE e.lead_id = l.id
    AND l.user_id = v_user_id;

  -- Delete core rows
  DELETE FROM public.conversations c
  WHERE c.user_id = v_user_id;

  DELETE FROM public.leads l
  WHERE l.user_id = v_user_id;
END $$;