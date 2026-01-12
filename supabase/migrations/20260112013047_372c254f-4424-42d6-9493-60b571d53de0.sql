-- Assign super_admin role to aaron@getpilot.io
INSERT INTO public.user_roles (user_id, role, permissions)
VALUES (
  '7d163009-64c5-4e11-bc0c-9ffeca2cef6b',
  'super_admin',
  ARRAY['view_dashboard', 'manage_ari', 'view_conversations', 'manage_conversations', 'view_leads', 'manage_leads', 'view_bookings', 'manage_bookings', 'view_knowledge', 'manage_knowledge', 'view_help_articles', 'manage_help_articles', 'view_team', 'manage_team', 'view_settings', 'manage_settings', 'view_billing', 'manage_billing', 'view_integrations', 'manage_integrations', 'view_webhooks', 'manage_webhooks', 'view_api_keys', 'manage_api_keys']::app_permission[]
)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'super_admin',
  permissions = EXCLUDED.permissions,
  updated_at = now();