-- ============================================================
-- SUPER ADMIN DASHBOARD: Database Schema Changes
-- Phase 1: Tables, Functions, Indexes, and RLS Policies
-- ============================================================

-- 1.5 Database Function: is_super_admin
-- Helper function used by RLS policies - MUST be created first
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 1.1 New Table: platform_config
-- Stores platform-wide configuration including baseline prompts
-- ============================================================
CREATE TABLE platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Index for fast key lookups
CREATE INDEX idx_platform_config_key ON platform_config(key);

-- Enable RLS
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read
CREATE POLICY "Super admins can view platform config"
ON platform_config FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only super_admins can modify
CREATE POLICY "Super admins can manage platform config"
ON platform_config FOR ALL
USING (is_super_admin(auth.uid()));

-- Seed initial data
INSERT INTO platform_config (key, value, description) VALUES 
  ('baseline_prompt', '"You are Ari, a helpful AI assistant built on the Pilot platform."', 'Global prompt prepended to all agent system prompts'),
  ('security_guardrails', '{"enabled": true, "block_pii": true, "block_prompt_injection": true}', 'Security guardrail configuration'),
  ('feature_flags', '{"beta_features": false, "new_onboarding": false}', 'Platform-wide feature flags');

-- ============================================================
-- 1.2 New Table: admin_audit_log
-- Tracks all administrative actions for compliance and debugging
-- ============================================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_type TEXT, -- 'account', 'plan', 'config', 'team', 'article', 'email'
  target_id UUID,
  target_email TEXT, -- For account actions
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action);
CREATE INDEX idx_audit_target ON admin_audit_log(target_type, target_id);

-- Enable RLS
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read
CREATE POLICY "Super admins can view audit logs"
ON admin_audit_log FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only super_admins can insert
CREATE POLICY "Super admins can create audit logs"
ON admin_audit_log FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- ============================================================
-- 1.3 New Table: email_delivery_logs
-- Tracks email delivery status via Resend webhooks
-- ============================================================
CREATE TABLE email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT UNIQUE NOT NULL,
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT,
  template_type TEXT,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'complained', 'failed'
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounce_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_email_logs_status ON email_delivery_logs(status);
CREATE INDEX idx_email_logs_created ON email_delivery_logs(created_at DESC);
CREATE INDEX idx_email_logs_to ON email_delivery_logs(to_email);
CREATE INDEX idx_email_logs_resend_id ON email_delivery_logs(resend_email_id);

-- Enable RLS
ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view
CREATE POLICY "Super admins can view email logs"
ON email_delivery_logs FOR SELECT
USING (is_super_admin(auth.uid()));

-- ============================================================
-- 1.4 New Table: impersonation_sessions
-- Tracks secure impersonation sessions for support debugging
-- ============================================================
CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Index for active sessions
CREATE INDEX idx_impersonation_active ON impersonation_sessions(admin_user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage
CREATE POLICY "Super admins can manage impersonation sessions"
ON impersonation_sessions FOR ALL
USING (is_super_admin(auth.uid()));