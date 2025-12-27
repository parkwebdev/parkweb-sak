-- Create report_exports table to store export history
CREATE TABLE public.report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('csv', 'pdf')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,
  report_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own exports
CREATE POLICY "Users can view their own exports"
ON public.report_exports
FOR SELECT
USING (has_account_access(user_id));

CREATE POLICY "Users can create their own exports"
ON public.report_exports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
ON public.report_exports
FOR DELETE
USING (has_account_access(user_id));

-- Create index for faster lookups
CREATE INDEX idx_report_exports_user_id ON public.report_exports(user_id);
CREATE INDEX idx_report_exports_created_at ON public.report_exports(created_at DESC);

-- Create storage bucket for report exports (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-exports', 'report-exports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for report-exports bucket
CREATE POLICY "Users can upload their own reports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'report-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'report-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own reports"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'report-exports' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);