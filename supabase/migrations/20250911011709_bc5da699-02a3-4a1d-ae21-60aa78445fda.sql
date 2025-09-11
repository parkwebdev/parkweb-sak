-- Create client folders table for organizing clients
CREATE TABLE public.client_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    parent_id UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (parent_id) REFERENCES public.client_folders(id) ON DELETE CASCADE
);

-- Create client folder assignments table
CREATE TABLE public.client_folder_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_email TEXT NOT NULL,
    folder_id UUID NOT NULL,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    FOREIGN KEY (folder_id) REFERENCES public.client_folders(id) ON DELETE CASCADE
);

-- Enable RLS on client folders
ALTER TABLE public.client_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client folders
CREATE POLICY "Users can view their own folders" 
ON public.client_folders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
ON public.client_folders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.client_folders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.client_folders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on client folder assignments
ALTER TABLE public.client_folder_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client folder assignments
CREATE POLICY "Users can view their folder assignments" 
ON public.client_folder_assignments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.client_folders 
        WHERE client_folders.id = folder_id 
        AND client_folders.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create folder assignments" 
ON public.client_folder_assignments 
FOR INSERT 
WITH CHECK (
    auth.uid() = assigned_by AND
    EXISTS (
        SELECT 1 FROM public.client_folders 
        WHERE client_folders.id = folder_id 
        AND client_folders.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their folder assignments" 
ON public.client_folder_assignments 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.client_folders 
        WHERE client_folders.id = folder_id 
        AND client_folders.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their folder assignments" 
ON public.client_folder_assignments 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.client_folders 
        WHERE client_folders.id = folder_id 
        AND client_folders.user_id = auth.uid()
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_client_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_folders_updated_at
    BEFORE UPDATE ON public.client_folders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_folders_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_client_folders_user_id ON public.client_folders(user_id);
CREATE INDEX idx_client_folders_parent_id ON public.client_folders(parent_id);
CREATE INDEX idx_client_folder_assignments_folder_id ON public.client_folder_assignments(folder_id);
CREATE INDEX idx_client_folder_assignments_client_email ON public.client_folder_assignments(client_email);