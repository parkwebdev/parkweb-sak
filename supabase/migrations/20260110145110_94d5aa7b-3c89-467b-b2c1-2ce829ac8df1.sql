-- Fix the log_assignee_activity function to handle cascade deletes
CREATE OR REPLACE FUNCTION public.log_assignee_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.lead_id, NEW.assigned_by, 'assignee_added', jsonb_build_object(
      'user_id', NEW.user_id
    ));
  ELSIF TG_OP = 'DELETE' THEN
    -- Only log if the lead still exists (skip during cascade deletes)
    IF EXISTS (SELECT 1 FROM public.leads WHERE id = OLD.lead_id) THEN
      INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
      VALUES (OLD.lead_id, auth.uid(), 'assignee_removed', jsonb_build_object(
        'user_id', OLD.user_id
      ));
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add DELETE policy for lead_activities so explicit cleanup works
CREATE POLICY "Users can delete activities on accessible leads"
  ON public.lead_activities
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = lead_activities.lead_id
    AND has_account_access(l.user_id)
  ));