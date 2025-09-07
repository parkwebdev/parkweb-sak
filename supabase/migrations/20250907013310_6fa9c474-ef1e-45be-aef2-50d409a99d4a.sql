-- Create public storage bucket for email assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email-assets', 'email-assets', true);

-- Create policy to allow public read access to email assets
CREATE POLICY "Email assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'email-assets');

-- Create policy to allow authenticated users to upload email assets
CREATE POLICY "Authenticated users can upload email assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'email-assets' AND auth.role() = 'authenticated');