-- Create scheduled_reports table
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of email addresses
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday (for weekly)
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- (for monthly)
  time_of_day TIME NOT NULL DEFAULT '09:00:00', -- When to send
  report_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Report configuration (filters, grouping, etc.)
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's scheduled reports"
  ON public.scheduled_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = scheduled_reports.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can create scheduled reports"
  ON public.scheduled_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = scheduled_reports.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update scheduled reports"
  ON public.scheduled_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = scheduled_reports.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can delete scheduled reports"
  ON public.scheduled_reports
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = scheduled_reports.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient querying
CREATE INDEX idx_scheduled_reports_org_active ON public.scheduled_reports(org_id, active);
CREATE INDEX idx_scheduled_reports_frequency ON public.scheduled_reports(frequency, active) WHERE active = true;