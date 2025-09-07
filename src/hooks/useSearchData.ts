import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  action?: () => void;
}

export const useSearchData = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSearchData();
    }
  }, [user]);

  const fetchSearchData = async () => {
    setLoading(true);
    try {
      const results: SearchResult[] = [];

      // Fetch client onboarding data
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('client_onboarding_links')
        .select('id, client_name, company_name, email, status, industry')
        .order('created_at', { ascending: false });

      if (!onboardingError && onboardingData) {
        onboardingData.forEach(item => {
          results.push({
            id: `onboarding-${item.id}`,
            title: `${item.client_name} - ${item.company_name}`,
            description: `${item.email} • ${item.status} • ${item.industry}`,
            category: 'Onboarding',
            action: () => navigate('/onboarding')
          });
        });
      }

      // Fetch scope of works data
      const { data: sowData, error: sowError } = await supabase
        .from('scope_of_works')
        .select('id, title, client, client_contact, status, industry')
        .order('created_at', { ascending: false });

      if (!sowError && sowData) {
        sowData.forEach(item => {
          results.push({
            id: `sow-${item.id}`,
            title: `${item.title} - ${item.client}`,
            description: `${item.client_contact} • ${item.status} • ${item.industry}`,
            category: 'Scope of Work',
            action: () => navigate('/scope-of-works')
          });
        });
      }

      // Add quick navigation actions
      const quickActions: SearchResult[] = [
        {
          id: 'nav-onboarding',
          title: 'Create New Onboarding Link',
          description: 'Generate a new client onboarding link',
          category: 'Quick Actions',
          action: () => navigate('/onboarding')
        },
        {
          id: 'nav-sow',
          title: 'Go to Scope of Works',
          description: 'View all scope of work documents',
          category: 'Quick Actions',
          action: () => navigate('/scope-of-works')
        },
        {
          id: 'nav-team',
          title: 'Team Management',
          description: 'Manage team members and roles',
          category: 'Quick Actions',
          action: () => navigate('/team')
        },
        {
          id: 'nav-settings',
          title: 'Settings',
          description: 'Configure your account settings',
          category: 'Quick Actions',
          action: () => navigate('/settings')
        }
      ];

      setSearchResults([...quickActions, ...results]);
    } catch (error) {
      console.error('Error fetching search data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { searchResults, loading, refetch: fetchSearchData };
};