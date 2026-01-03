-- Add assigned_to column to leads table for team member assignment
ALTER TABLE public.leads 
ADD COLUMN assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster filtering by assignee
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);