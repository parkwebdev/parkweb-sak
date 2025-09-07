-- Create storage bucket for client uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('client-uploads', 'client-uploads', false);

-- Create storage policies for client uploads
CREATE POLICY "Users can upload their own client files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own client files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all client files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-uploads' AND is_admin(auth.uid()));

-- Add file columns to onboarding_submissions table
ALTER TABLE public.onboarding_submissions 
ADD COLUMN branding_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN content_files jsonb DEFAULT '[]'::jsonb;