-- Create account_settings table for account-wide configuration
CREATE TABLE public.account_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE,
  
  -- Leads page settings
  leads_view_mode TEXT NOT NULL DEFAULT 'kanban',
  leads_kanban_visible_fields TEXT[] NOT NULL DEFAULT ARRAY['firstName', 'lastName', 'email', 'phone', 'priority', 'tags', 'assignee', 'createdAt'],
  leads_table_column_visibility JSONB NOT NULL DEFAULT '{"name": true, "email": true, "phone": true, "stage_id": true, "assignees": true, "location": false, "source": false, "created_at": true, "updated_at": false}',
  leads_table_column_order TEXT[] NOT NULL DEFAULT ARRAY['name', 'email', 'phone', 'stage_id', 'assignees', 'location', 'source', 'created_at', 'updated_at'],
  leads_default_sort JSONB DEFAULT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_settings ENABLE ROW LEVEL SECURITY;

-- Team members can read their account owner's settings
CREATE POLICY "Users can view their account settings"
ON public.account_settings FOR SELECT
TO authenticated
USING (has_account_access(owner_id));

-- Only account owner can insert their settings
CREATE POLICY "Account owners can insert their settings"
ON public.account_settings FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Only account owner can update settings
CREATE POLICY "Account owners can update their settings"
ON public.account_settings FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- Only account owner can delete settings
CREATE POLICY "Account owners can delete their settings"
ON public.account_settings FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Auto-update timestamp trigger
CREATE TRIGGER update_account_settings_updated_at
  BEFORE UPDATE ON public.account_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();