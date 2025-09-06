-- Create scope_of_works table to replace static data
CREATE TABLE public.scope_of_works (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  client TEXT NOT NULL,
  client_contact TEXT NOT NULL,
  email TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  date_created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  pages INTEGER NOT NULL DEFAULT 1,
  integrations TEXT[] DEFAULT '{}',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scope_of_works ENABLE ROW LEVEL SECURITY;

-- Create policies for scope_of_works
CREATE POLICY "Users can view their own scope of works" 
ON public.scope_of_works 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scope of works" 
ON public.scope_of_works 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scope of works" 
ON public.scope_of_works 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scope of works" 
ON public.scope_of_works 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create client_onboarding_links table to replace static data
CREATE TABLE public.client_onboarding_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Sent',
  date_sent TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  onboarding_url TEXT NOT NULL,
  sow_status TEXT,
  personal_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_onboarding_links ENABLE ROW LEVEL SECURITY;

-- Create policies for client_onboarding_links
CREATE POLICY "Users can view their own client links" 
ON public.client_onboarding_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own client links" 
ON public.client_onboarding_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client links" 
ON public.client_onboarding_links 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client links" 
ON public.client_onboarding_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on scope_of_works
CREATE TRIGGER update_scope_of_works_updated_at
BEFORE UPDATE ON public.scope_of_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on client_onboarding_links
CREATE TRIGGER update_client_onboarding_links_updated_at
BEFORE UPDATE ON public.client_onboarding_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();