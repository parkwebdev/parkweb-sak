-- Phase 2: Calendar Integration Schema
-- Create calendar_provider enum
CREATE TYPE public.calendar_provider AS ENUM ('google_calendar', 'outlook_calendar');

-- Create calendar_event_status enum
CREATE TYPE public.calendar_event_status AS ENUM ('confirmed', 'cancelled', 'completed', 'no_show');

-- Create connected_accounts table for OAuth connections
CREATE TABLE public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  provider calendar_provider NOT NULL,
  account_email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  calendar_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connected_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  external_event_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'America/New_York',
  all_day BOOLEAN DEFAULT false,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  status calendar_event_status DEFAULT 'confirmed',
  event_type TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_accounts
CREATE POLICY "Users can view accessible connected accounts"
ON public.connected_accounts FOR SELECT
USING (has_account_access(user_id));

CREATE POLICY "Users can create connected accounts for accessible agents"
ON public.connected_accounts FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM agents WHERE agents.id = connected_accounts.agent_id AND has_account_access(agents.user_id)
));

CREATE POLICY "Users can update accessible connected accounts"
ON public.connected_accounts FOR UPDATE
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible connected accounts"
ON public.connected_accounts FOR DELETE
USING (has_account_access(user_id));

-- RLS Policies for calendar_events
CREATE POLICY "Users can view accessible calendar events"
ON public.calendar_events FOR SELECT
USING (EXISTS (
  SELECT 1 FROM connected_accounts ca
  WHERE ca.id = calendar_events.connected_account_id AND has_account_access(ca.user_id)
));

CREATE POLICY "Users can create calendar events for accessible accounts"
ON public.calendar_events FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM connected_accounts ca
  WHERE ca.id = calendar_events.connected_account_id AND has_account_access(ca.user_id)
));

CREATE POLICY "Users can update accessible calendar events"
ON public.calendar_events FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM connected_accounts ca
  WHERE ca.id = calendar_events.connected_account_id AND has_account_access(ca.user_id)
));

CREATE POLICY "Users can delete accessible calendar events"
ON public.calendar_events FOR DELETE
USING (EXISTS (
  SELECT 1 FROM connected_accounts ca
  WHERE ca.id = calendar_events.connected_account_id AND has_account_access(ca.user_id)
));

-- Indexes for performance
CREATE INDEX idx_connected_accounts_agent ON public.connected_accounts(agent_id);
CREATE INDEX idx_connected_accounts_location ON public.connected_accounts(location_id);
CREATE INDEX idx_connected_accounts_provider ON public.connected_accounts(provider);
CREATE INDEX idx_calendar_events_connected_account ON public.calendar_events(connected_account_id);
CREATE INDEX idx_calendar_events_location ON public.calendar_events(location_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_external_id ON public.calendar_events(external_event_id);

-- Triggers for updated_at
CREATE TRIGGER update_connected_accounts_updated_at
BEFORE UPDATE ON public.connected_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();