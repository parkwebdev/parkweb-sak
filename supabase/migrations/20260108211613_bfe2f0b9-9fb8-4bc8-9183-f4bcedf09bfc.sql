-- ============================================
-- Automation Event Triggers
-- Adds database triggers to fire automations when leads, 
-- conversations, or messages change.
-- ============================================

-- Create function to dispatch automation events
CREATE OR REPLACE FUNCTION public.dispatch_automation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payload JSONB;
  supabase_url TEXT := 'https://mvaimvwdukpgvkifkfpa.supabase.co';
  internal_secret TEXT;
BEGIN
  -- Get the internal webhook secret from vault
  SELECT decrypted_secret INTO internal_secret
  FROM vault.decrypted_secrets
  WHERE name = 'INTERNAL_WEBHOOK_SECRET'
  LIMIT 1;

  -- If no secret found, log and skip (don't fail the transaction)
  IF internal_secret IS NULL THEN
    RAISE WARNING 'INTERNAL_WEBHOOK_SECRET not found in vault, skipping automation dispatch';
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Build payload
  payload := jsonb_build_object(
    'type', LOWER(TG_OP),
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END,
    'old_record', CASE 
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
      ELSE NULL
    END
  );

  -- Make async HTTP request to the dispatch function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/dispatch-automation-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret
    )::jsonb,
    body := payload::jsonb
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error dispatching automation event: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers on leads table
DROP TRIGGER IF EXISTS trigger_automation_leads_insert ON public.leads;
CREATE TRIGGER trigger_automation_leads_insert
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

DROP TRIGGER IF EXISTS trigger_automation_leads_update ON public.leads;
CREATE TRIGGER trigger_automation_leads_update
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

-- Create triggers on conversations table
DROP TRIGGER IF EXISTS trigger_automation_conversations_insert ON public.conversations;
CREATE TRIGGER trigger_automation_conversations_insert
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

DROP TRIGGER IF EXISTS trigger_automation_conversations_update ON public.conversations;
CREATE TRIGGER trigger_automation_conversations_update
  AFTER UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

-- Create triggers on messages table (for message.received)
DROP TRIGGER IF EXISTS trigger_automation_messages_insert ON public.messages;
CREATE TRIGGER trigger_automation_messages_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();