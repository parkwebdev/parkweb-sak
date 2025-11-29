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

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useProjects = (clientId?: string) => {
  return {
    projects: [],
    loading: false,
    createProject: async () => {},
    updateProject: async () => {},
    deleteProject: async () => {},
    refetch: async () => {},
  };
};
