-- Create logos bucket for storing logo images
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Create storage policies for logos bucket
CREATE POLICY "Logo images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Admins can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'logos' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'logos' AND is_admin(auth.uid()));