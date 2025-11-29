-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  title_color TEXT DEFAULT '#2563eb',
  background_color TEXT DEFAULT '#f8fafc',
  action_type TEXT DEFAULT 'open_url',
  action_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Org admins can manage announcements
CREATE POLICY "Org admins can manage announcements"
ON public.announcements
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.agents
    WHERE agents.id = announcements.agent_id
    AND is_org_admin(auth.uid(), agents.org_id)
  )
);

-- Org members can view announcements
CREATE POLICY "Org members can view announcements"
ON public.announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agents
    WHERE agents.id = announcements.agent_id
    AND is_org_member(auth.uid(), agents.org_id)
  )
);

-- Public can view active announcements
CREATE POLICY "Public can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_announcements_agent_id ON public.announcements(agent_id);
CREATE INDEX idx_announcements_active ON public.announcements(is_active) WHERE is_active = true;