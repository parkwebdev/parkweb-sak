-- Create lead_comments table
CREATE TABLE public.lead_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- Policies for lead_comments
CREATE POLICY "Users can view comments on accessible leads"
  ON public.lead_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM leads l WHERE l.id = lead_comments.lead_id AND has_account_access(l.user_id)
  ));

CREATE POLICY "Users can create comments on accessible leads"
  ON public.lead_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_comments.lead_id AND has_account_access(l.user_id))
  );

CREATE POLICY "Users can update their own comments"
  ON public.lead_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.lead_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for lead_comments
ALTER TABLE public.lead_comments REPLICA IDENTITY FULL;

-- Create lead_activities table
CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- Policies for lead_activities
CREATE POLICY "Users can view activities on accessible leads"
  ON public.lead_activities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM leads l WHERE l.id = lead_activities.lead_id AND has_account_access(l.user_id)
  ));

CREATE POLICY "Service can insert activities"
  ON public.lead_activities FOR INSERT
  WITH CHECK (true);

-- Enable realtime for lead_activities
ALTER TABLE public.lead_activities REPLICA IDENTITY FULL;

-- Trigger function for logging lead updates
CREATE OR REPLACE FUNCTION public.log_lead_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log stage changes
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
    VALUES (NEW.id, auth.uid(), 'stage_changed', jsonb_build_object(
      'from_stage_id', OLD.stage_id,
      'to_stage_id', NEW.stage_id
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for lead updates
CREATE TRIGGER on_lead_update
  AFTER UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_activity();

-- Trigger function for logging lead creation
CREATE OR REPLACE FUNCTION public.log_lead_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
  VALUES (NEW.id, auth.uid(), 'created', '{}'::jsonb);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for lead creation
CREATE TRIGGER on_lead_created
  AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_lead_created();

-- Trigger function for logging comments
CREATE OR REPLACE FUNCTION public.log_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lead_activities (lead_id, user_id, action_type, action_data)
  VALUES (NEW.lead_id, NEW.user_id, 'comment_added', jsonb_build_object('comment_id', NEW.id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for comment creation
CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.lead_comments
  FOR EACH ROW EXECUTE FUNCTION public.log_comment_activity();

-- Updated at trigger for comments
CREATE TRIGGER update_lead_comments_updated_at
  BEFORE UPDATE ON public.lead_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();