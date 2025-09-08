-- Create pending invitations table
CREATE TABLE public.pending_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by_name TEXT NOT NULL,
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for pending invitations
CREATE POLICY "Users can view pending invitations" 
ON public.pending_invitations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create invitations" 
ON public.pending_invitations 
FOR INSERT 
WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Users can update their own invitations" 
ON public.pending_invitations 
FOR UPDATE 
USING (auth.uid() = invited_by);

CREATE POLICY "Users can delete their own invitations" 
ON public.pending_invitations 
FOR DELETE 
USING (auth.uid() = invited_by);

-- Update trigger for timestamp
CREATE TRIGGER update_pending_invitations_updated_at
BEFORE UPDATE ON public.pending_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix avatars storage policy for better access
CREATE POLICY "Users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars');

CREATE POLICY "Everyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');