import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Request {
  id: string;
  title: string;
  description: string;
  status: 'to_do' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_name: string;
  client_email: string;
  company_name: string;
  website_name?: string;
  website_url?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_to_avatar?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const useRequests = () => {
  return {
    requests: [],
    loading: false,
    updateRequestStatus: async () => {},
    updateRequestPriority: async () => {},
    deleteRequest: async () => {},
    refetch: async () => {},
  };
};
