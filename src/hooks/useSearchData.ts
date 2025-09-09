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

      // Add main navigation actions first
      const navigationActions: SearchResult[] = [
        {
          id: 'nav-dashboard',
          title: 'Dashboard',
          description: 'Go to main dashboard',
          category: 'Navigation',
          action: () => navigate('/dashboard')
        },
        {
          id: 'nav-requests',
          title: 'Requests',
          description: 'View and manage client requests',
          category: 'Navigation', 
          action: () => navigate('/requests')
        },
        {
          id: 'nav-onboarding',
          title: 'Onboarding',
          description: 'Client onboarding management',
          category: 'Navigation',
          action: () => navigate('/onboarding')
        },
        {
          id: 'nav-sow',
          title: 'Scope of Works',
          description: 'View all scope of work documents',
          category: 'Navigation',
          action: () => navigate('/scope-of-works')
        },
        {
          id: 'nav-settings',
          title: 'Settings',
          description: 'Configure your account settings',
          category: 'Navigation',
          action: () => navigate('/settings')
        }
      ];

      // Fetch requests data  
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select('id, title, description, status, priority, client_name, company_name, client_email, assigned_to')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!requestsError && requestsData) {
        // Get assigned user names if there are any
        const assignedToIds = [...new Set(requestsData.map(r => r.assigned_to).filter(Boolean))];
        let assignedProfiles: any[] = [];
        
        if (assignedToIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', assignedToIds);
          assignedProfiles = profiles || [];
        }

        requestsData.forEach(item => {
          const assignedProfile = assignedProfiles.find(p => p.user_id === item.assigned_to);
          results.push({
            id: `request-${item.id}`,
            title: `${item.title} - ${item.client_name}`,
            description: `${item.company_name} • ${item.status.replace('_', ' ')} • ${item.priority} priority${assignedProfile ? ` • Assigned to ${assignedProfile.display_name}` : ''}`,
            category: 'Requests',
            action: () => navigate(`/requests?open=${item.id}`)
          });
        });
      }

      // Fetch team members
      const { data: teamData, error: teamError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .order('display_name', { ascending: true });

      if (!teamError && teamData) {
        teamData.forEach(member => {
          results.push({
            id: `team-${member.user_id}`,
            title: member.display_name || 'Team Member',
            description: member.email,  
            category: 'Team',
            action: () => navigate(`/settings?tab=team&open=${member.user_id}`)
          });
        });
      }

      // Fetch client onboarding data
      const { data: onboardingData, error: onboardingError } = await supabase
        .from('client_onboarding_links')
        .select('id, client_name, company_name, email, status, industry')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!onboardingError && onboardingData) {
        onboardingData.forEach(item => {
          results.push({
            id: `onboarding-${item.id}`,
            title: `${item.client_name} - ${item.company_name}`,
            description: `${item.email} • ${item.status} • ${item.industry}`,
            category: 'Onboarding',
            action: () => navigate(`/onboarding?open=${item.id}`)
          });
        });
      }

      // Fetch scope of works data
      const { data: sowData, error: sowError } = await supabase
        .from('scope_of_works')
        .select('id, title, client, client_contact, status, industry')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!sowError && sowData) {
        sowData.forEach(item => {
          results.push({
            id: `sow-${item.id}`,
            title: `${item.title} - ${item.client}`,
            description: `${item.client_contact} • ${item.status} • ${item.industry}`,
            category: 'Scope of Work',
            action: () => navigate(`/scope-of-works?open=${item.id}`)
          });
        });
      }

      // Fetch request links
      const { data: requestLinksData, error: requestLinksError } = await supabase
        .from('request_links')
        .select('id, client_name, company_name, website_name, active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!requestLinksError && requestLinksData) {
        requestLinksData.forEach(item => {
          results.push({
            id: `request-link-${item.id}`,
            title: `Request Link - ${item.client_name}`,
            description: `${item.company_name} • ${item.active ? 'Active' : 'Inactive'}`,
            category: 'Request Links',
            action: () => navigate('/requests')
          });
        });
      }

      // Fetch recent notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('id, title, message, type, read')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!notificationsError && notificationsData) {
        notificationsData.forEach(item => {
          results.push({
            id: `notification-${item.id}`,
            title: item.title,
            description: item.message,
            category: 'Notifications',
            action: () => {
              // Mark as read and navigate to dashboard
              supabase.from('notifications').update({ read: true }).eq('id', item.id);
              navigate('/dashboard');
            }
          });
        });
      }

      // Add quick actions
      const quickActions: SearchResult[] = [
        {
          id: 'action-create-onboarding',
          title: 'Create New Onboarding Link',
          description: 'Generate a new client onboarding link',
          category: 'Quick Actions',
          action: () => navigate('/onboarding')
        },
        {
          id: 'action-create-request-link',
          title: 'Create Request Link',
          description: 'Generate a new client request link',
          category: 'Quick Actions',
          action: () => navigate('/requests')
        },
        {
          id: 'action-invite-member',
          title: 'Invite Team Member',
          description: 'Send invitation to new team member',
          category: 'Quick Actions',
          action: () => navigate('/settings?tab=team')
        }
      ];

      setSearchResults([...navigationActions, ...quickActions, ...results]);
    } catch (error) {
      console.error('Error fetching search data:', error);
    } finally {
      setLoading(false);
    }
  };

  return { searchResults, loading, refetch: fetchSearchData };
};