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

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useProjectTasks = (projectId?: string) => {
  return {
    tasks: [],
    loading: false,
    createTask: async () => {},
    updateTaskStatus: async () => {},
    updateTask: async () => {},
    deleteTask: async () => {},
    refetch: async () => {},
  };
};
