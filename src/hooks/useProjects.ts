import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  client_id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  task_count?: number;
}

export const useProjects = (clientId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data: projectsData, error: projectsError } = await query;

      if (projectsError) throw projectsError;

      // Get task counts for each project
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id);
        const { data: tasksData, error: tasksError } = await supabase
          .from('project_tasks')
          .select('project_id')
          .in('project_id', projectIds);

        if (tasksError) throw tasksError;

        // Count tasks per project
        const taskCounts = (tasksData || []).reduce((acc, task) => {
          acc[task.project_id] = (acc[task.project_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const projectsWithCounts = projectsData.map(project => ({
          ...project,
          status: project.status as Project['status'],
          priority: project.priority as Project['priority'],
          task_count: taskCounts[project.id] || 0
        }));

        setProjects(projectsWithCounts);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: {
    client_id: string;
    name: string;
    description?: string;
    status?: Project['status'];
    priority?: Project['priority'];
    start_date?: string;
    due_date?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [{ 
        ...data, 
        status: data.status as Project['status'],
        priority: data.priority as Project['priority'],
        task_count: 0 
      }, ...prev]);
      
      toast({
        title: "Project Created",
        description: "Project has been successfully created",
      });

      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => 
        prev.map(project => 
          project.id === id 
            ? { ...project, ...updates, updated_at: new Date().toISOString() }
            : project
        )
      );

      toast({
        title: "Project Updated",
        description: "Project has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== id));
      
      toast({
        title: "Project Deleted",
        description: "Project has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  };
};