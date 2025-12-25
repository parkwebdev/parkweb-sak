-- Create lead_stages table for custom pipeline stages
CREATE TABLE public.lead_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  order_index integer NOT NULL DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view accessible lead stages"
  ON public.lead_stages FOR SELECT
  USING (has_account_access(user_id));

CREATE POLICY "Users can create their own lead stages"
  ON public.lead_stages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update accessible lead stages"
  ON public.lead_stages FOR UPDATE
  USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible lead stages"
  ON public.lead_stages FOR DELETE
  USING (has_account_access(user_id));

-- Add updated_at trigger
CREATE TRIGGER update_lead_stages_updated_at
  BEFORE UPDATE ON public.lead_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add stage_id column to leads table
ALTER TABLE public.leads 
  ADD COLUMN stage_id uuid REFERENCES public.lead_stages(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX idx_lead_stages_user_order ON public.lead_stages(user_id, order_index);

-- Function to seed default stages for a user
CREATE OR REPLACE FUNCTION public.seed_default_lead_stages(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only seed if user has no stages
  IF NOT EXISTS (SELECT 1 FROM lead_stages WHERE user_id = p_user_id) THEN
    INSERT INTO lead_stages (user_id, name, color, order_index, is_default) VALUES
      (p_user_id, 'New', '#3b82f6', 0, true),
      (p_user_id, 'Contacted', '#a855f7', 1, false),
      (p_user_id, 'Qualified', '#10b981', 2, false),
      (p_user_id, 'Converted', '#16a34a', 3, false),
      (p_user_id, 'Lost', '#6b7280', 4, false);
  END IF;
END;
$$;