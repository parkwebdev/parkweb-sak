-- Drop the trigger that creates comment_added activities (we filter these out in frontend anyway)
DROP TRIGGER IF EXISTS on_comment_created ON public.lead_comments;

-- Drop the function since it's no longer needed
DROP FUNCTION IF EXISTS public.log_comment_activity();