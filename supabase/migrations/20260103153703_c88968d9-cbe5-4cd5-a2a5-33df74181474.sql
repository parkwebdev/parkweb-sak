-- Add leads table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

-- Add lead_assignees table to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_assignees;

-- Add lead_stages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_stages;

-- Add lead_comments table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_comments;

-- Add user_roles table to realtime publication (for team role changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;