-- Add last_login_at and status columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Create index for admin queries filtering by status
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Create index for last_login_at for sorting
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login_at DESC NULLS LAST);