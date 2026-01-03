-- Update log_lead_activity function to also track status changes
CREATE OR REPLACE FUNCTION public.log_lead_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log stage changes
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.id, auth.uid(), 'stage_changed', jsonb_build_object(
      'from_stage_id', OLD.stage_id,
      'to_stage_id', NEW.stage_id
    ));
  END IF;

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.id, auth.uid(), 'status_changed', jsonb_build_object(
      'from', OLD.status::text,
      'to', NEW.status::text
    ));
  END IF;
  
  -- Log name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.id, auth.uid(), 'field_updated', jsonb_build_object(
      'field', 'name',
      'from', OLD.name,
      'to', NEW.name
    ));
  END IF;
  
  -- Log email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.id, auth.uid(), 'field_updated', jsonb_build_object(
      'field', 'email',
      'from', OLD.email,
      'to', NEW.email
    ));
  END IF;

  -- Log phone changes
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.id, auth.uid(), 'field_updated', jsonb_build_object(
      'field', 'phone',
      'from', OLD.phone,
      'to', NEW.phone
    ));
  END IF;

  -- Log company changes
  IF OLD.company IS DISTINCT FROM NEW.company THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.id, auth.uid(), 'field_updated', jsonb_build_object(
      'field', 'company',
      'from', OLD.company,
      'to', NEW.company
    ));
  END IF;
  
  RETURN NEW;
END;
$function$;