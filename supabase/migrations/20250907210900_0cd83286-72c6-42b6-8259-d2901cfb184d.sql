-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own client files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own client files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all client files" ON storage.objects;

-- Create policies that allow public uploads for client onboarding
CREATE POLICY "Allow public client file uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'client-uploads');

CREATE POLICY "Allow public client file access" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'client-uploads');

CREATE POLICY "Allow authenticated users full access to client files" 
ON storage.objects 
FOR ALL
USING (bucket_id = 'client-uploads' AND auth.uid() IS NOT NULL);