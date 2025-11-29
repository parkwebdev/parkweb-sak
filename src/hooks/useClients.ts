export interface ClientFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  email: string;
  name: string;
  company: string;
  industry: string;
  status: 'active' | 'onboarding' | 'completed' | 'inactive';
  onboarding_status: string;
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  scope_of_works: number;
  active_tasks: number;
  last_activity: string;
  created_at: string;
  updated_at?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  notes?: string;
  onboarding_url?: string;
  personal_note?: string;
  folder_id?: string;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useClients = () => {
  return {
    clients: [],
    folders: [],
    loading: false,
    refetch: async () => {},
  };
};
