-- Trigger function for logging assignee changes
CREATE OR REPLACE FUNCTION public.log_assignee_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.lead_id, NEW.assigned_by, 'assignee_added', jsonb_build_object(
      'user_id', NEW.user_id
    ));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (OLD.lead_id, auth.uid(), 'assignee_removed', jsonb_build_object(
      'user_id', OLD.user_id
    ));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for assignee changes
CREATE TRIGGER on_assignee_added
  AFTER INSERT ON public.lead_assignees
  FOR EACH ROW EXECUTE FUNCTION public.log_assignee_activity();

CREATE TRIGGER on_assignee_removed
  AFTER DELETE ON public.lead_assignees
  FOR EACH ROW EXECUTE FUNCTION public.log_assignee_activity();

-- Backfill created activities for existing leads that don't have them
INSERT INTO lead_activities (lead_id, user_id, action_type, action_data, created_at)
SELECT id, user_id, 'created', '{}'::jsonb, created_at
FROM leads
WHERE id NOT IN (
  SELECT lead_id FROM lead_activities WHERE action_type = 'created'
);