import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectTask {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'to_do' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_avatar?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useProjectTasks = (projectId?: string) => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('project_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: tasksData, error: tasksError } = await query;

      if (tasksError) throw tasksError;

      // Get unique assigned_to IDs to fetch profiles
      const assignedToIds = [...new Set(tasksData?.map(t => t.assigned_to).filter(Boolean) || [])];
      
      let profilesData: any[] = [];
      if (assignedToIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', assignedToIds);
          
        if (profilesError) throw profilesError;
        profilesData = profiles || [];
      }

      // Map the data to include assigned_to_name and avatar
      const tasksWithNames = (tasksData || []).map(task => {
        const profile = profilesData.find(p => p.user_id === task.assigned_to);
        return {
          ...task,
          status: task.status as ProjectTask['status'],
          priority: task.priority as ProjectTask['priority'],
          assigned_to_name: profile?.display_name || null,
          assigned_to_avatar: profile?.avatar_url || null
        };
      });
      
      setTasks(tasksWithNames);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: {
    project_id: string;
    title: string;
    description?: string;
    status?: ProjectTask['status'];
    priority?: ProjectTask['priority'];
    assigned_to?: string;
    due_date?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .insert({
          ...taskData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new task with empty profile data
      setTasks(prev => [{
        ...data,
        status: data.status as ProjectTask['status'],
        priority: data.priority as ProjectTask['priority'],
        assigned_to_name: null,
        assigned_to_avatar: null
      }, ...prev]);
      
      toast({
        title: "Task Created",
        description: "Task has been successfully created",
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTaskStatus = async (id: string, status: ProjectTask['status']) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : { completed_at: null })
        })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => 
        prev.map(task => 
          task.id === id 
            ? { 
                ...task, 
                status, 
                updated_at: new Date().toISOString(),
                ...(status === 'completed' ? { completed_at: new Date().toISOString() } : { completed_at: null })
              }
            : task
        )
      );

      toast({
        title: "Status Updated",
        description: `Task status changed to ${status.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (id: string, updates: Partial<ProjectTask>) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => 
        prev.map(task => 
          task.id === id 
            ? { ...task, ...updates, updated_at: new Date().toISOString() }
            : task
        )
      );

      toast({
        title: "Task Updated",
        description: "Task has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      
      toast({
        title: "Task Deleted",
        description: "Task has been successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('project-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks'
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    tasks,
    loading,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    refetch: fetchTasks
  };
};