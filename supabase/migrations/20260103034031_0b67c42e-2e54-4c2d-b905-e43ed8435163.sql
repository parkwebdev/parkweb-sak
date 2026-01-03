-- Create junction table for multiple lead assignees
CREATE TABLE public.lead_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid,
  UNIQUE(lead_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_lead_assignees_lead ON public.lead_assignees(lead_id);
CREATE INDEX idx_lead_assignees_user ON public.lead_assignees(user_id);

-- Enable RLS
ALTER TABLE public.lead_assignees ENABLE ROW LEVEL SECURITY;

-- RLS policies matching leads table pattern
CREATE POLICY "Users can view lead assignees for accessible leads"
  ON public.lead_assignees FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND has_account_access(l.user_id)
  ));

CREATE POLICY "Users can add assignees to accessible leads"
  ON public.lead_assignees FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND has_account_access(l.user_id)
  ));

CREATE POLICY "Users can remove assignees from accessible leads"
  ON public.lead_assignees FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = lead_id 
    AND has_account_access(l.user_id)
  ));