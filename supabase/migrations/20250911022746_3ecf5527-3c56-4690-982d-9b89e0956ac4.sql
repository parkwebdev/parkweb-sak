-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_tasks table
CREATE TABLE public.project_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'to_do' CHECK (status IN ('to_do', 'in_progress', 'review', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add project and task references to requests table
ALTER TABLE public.requests 
ADD COLUMN project_id UUID,
ADD COLUMN task_id UUID;

-- Enable RLS on new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for project_tasks
CREATE POLICY "Users can create tasks in their projects" 
ON public.project_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.projects 
  WHERE id = project_tasks.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can view tasks in their projects" 
ON public.project_tasks 
FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.projects 
  WHERE id = project_tasks.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update tasks in their projects" 
ON public.project_tasks 
FOR UPDATE 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.projects 
  WHERE id = project_tasks.project_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete tasks in their projects" 
ON public.project_tasks 
FOR DELETE 
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.projects 
  WHERE id = project_tasks.project_id AND user_id = auth.uid()
));

-- Add foreign key constraints
ALTER TABLE public.projects
ADD CONSTRAINT fk_projects_client_id 
FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;

ALTER TABLE public.project_tasks
ADD CONSTRAINT fk_project_tasks_project_id 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE public.requests
ADD CONSTRAINT fk_requests_project_id 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

ALTER TABLE public.requests
ADD CONSTRAINT fk_requests_task_id 
FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE SET NULL;

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
BEFORE UPDATE ON public.project_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();