-- Create platform_config_history table for version tracking
CREATE TABLE public.platform_config_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text NOT NULL,
  value jsonb NOT NULL,
  version integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  change_summary text
);

-- Create index for efficient lookups by config_key
CREATE INDEX idx_platform_config_history_key ON public.platform_config_history(config_key);
CREATE INDEX idx_platform_config_history_key_version ON public.platform_config_history(config_key, version DESC);

-- Enable RLS
ALTER TABLE public.platform_config_history ENABLE ROW LEVEL SECURITY;

-- Pilot team can view history
CREATE POLICY "Pilot team can view config history"
ON public.platform_config_history
FOR SELECT
USING (is_pilot_team_member(auth.uid()));

-- Pilot team can insert history
CREATE POLICY "Pilot team can insert config history"
ON public.platform_config_history
FOR INSERT
WITH CHECK (is_pilot_team_member(auth.uid()));

-- Create trigger function to auto-save history on platform_config changes
CREATE OR REPLACE FUNCTION public.save_platform_config_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.platform_config_history (
    config_key,
    value,
    version,
    created_by,
    change_summary
  ) VALUES (
    NEW.key,
    NEW.value,
    COALESCE(NEW.version, 1),
    NEW.updated_by,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on platform_config
CREATE TRIGGER tr_platform_config_history
AFTER INSERT OR UPDATE ON public.platform_config
FOR EACH ROW
EXECUTE FUNCTION public.save_platform_config_history();