-- Enable the pg_net extension for async HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the trigger function that dispatches webhook events
CREATE OR REPLACE FUNCTION public.dispatch_webhook_on_table_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
    RAISE WARNING 'INTERNAL_WEBHOOK_SECRET not found in vault, skipping webhook dispatch';
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Build payload matching the EventPayload interface expected by dispatch-webhook-event
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
    url := supabase_url || '/functions/v1/dispatch-webhook-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret
    )::jsonb,
    body := payload::jsonb
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE WARNING 'Error dispatching webhook: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on leads table
DROP TRIGGER IF EXISTS webhook_dispatch_leads_insert ON leads;
CREATE TRIGGER webhook_dispatch_leads_insert
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION dispatch_webhook_on_table_event();

DROP TRIGGER IF EXISTS webhook_dispatch_leads_update ON leads;
CREATE TRIGGER webhook_dispatch_leads_update
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION dispatch_webhook_on_table_event();

-- Create triggers on conversations table
DROP TRIGGER IF EXISTS webhook_dispatch_conversations_insert ON conversations;
CREATE TRIGGER webhook_dispatch_conversations_insert
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION dispatch_webhook_on_table_event();

DROP TRIGGER IF EXISTS webhook_dispatch_conversations_update ON conversations;
CREATE TRIGGER webhook_dispatch_conversations_update
  AFTER UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION dispatch_webhook_on_table_event();

-- Create trigger on messages table (insert only)
DROP TRIGGER IF EXISTS webhook_dispatch_messages_insert ON messages;
CREATE TRIGGER webhook_dispatch_messages_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION dispatch_webhook_on_table_event();