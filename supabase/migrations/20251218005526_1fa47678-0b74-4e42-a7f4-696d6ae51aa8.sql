-- Create scheduled job for WordPress sync (runs hourly)
SELECT cron.schedule(
  'wordpress-scheduled-sync',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/scheduled-wordpress-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);