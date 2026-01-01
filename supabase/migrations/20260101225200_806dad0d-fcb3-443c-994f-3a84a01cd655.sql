-- NOTE: pg_cron/pg_net are assumed already enabled in this Supabase project.

-- Helper function: invokes the send-scheduled-report edge function using INTERNAL_WEBHOOK_SECRET
CREATE OR REPLACE FUNCTION public.invoke_send_scheduled_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  internal_secret TEXT;
  supabase_url TEXT := 'https://mvaimvwdukpgvkifkfpa.supabase.co';
BEGIN
  SELECT decrypted_secret INTO internal_secret
  FROM vault.decrypted_secrets
  WHERE name = 'INTERNAL_WEBHOOK_SECRET'
  LIMIT 1;

  IF internal_secret IS NULL THEN
    RAISE WARNING 'INTERNAL_WEBHOOK_SECRET not found in vault, skipping scheduled report invocation';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/send-scheduled-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_secret
    )::jsonb,
    body := '{}'::jsonb
  );
END;
$$;

-- Idempotently (re)create the cron job
DO $$
DECLARE
  existing_job_id integer;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'send-scheduled-reports-hourly'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;
END;
$$;

SELECT cron.schedule(
  'send-scheduled-reports-hourly',
  '0 * * * *',
  $$SELECT public.invoke_send_scheduled_report();$$
);
