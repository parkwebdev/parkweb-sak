import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  iconName?: string;
  url?: string;
  action?: () => void;
}

type Agent = Tables<'agents'>;
type Conversation = Tables<'conversations'>;
type Lead = Tables<'leads'>;

export const useSearchData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all data in parallel
      const [agentsRes, conversationsRes, leadsRes] = await Promise.all([
        supabase
          .from('agents')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('conversations')
          .select('*, agents(name)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(50),
        supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const results: SearchResult[] = [];

      // Navigation items
      const navItems: SearchResult[] = [
        {
          id: 'nav-dashboard',
          title: 'Dashboard',
          description: 'View overview and statistics',
          category: 'Navigation',
          iconName: 'LayoutGrid01',
          url: '/',
        },
        {
          id: 'nav-agents',
          title: 'Agents',
          description: 'Manage AI agents',
          category: 'Navigation',
          iconName: 'Cube01',
          url: '/agents',
        },
        {
          id: 'nav-conversations',
          title: 'Conversations',
          description: 'View all conversations',
          category: 'Navigation',
          iconName: 'MessageChatSquare',
          url: '/conversations',
        },
        {
          id: 'nav-leads',
          title: 'Leads',
          description: 'Manage captured leads',
          category: 'Navigation',
          iconName: 'Users01',
          url: '/leads',
        },
        {
          id: 'nav-analytics',
          title: 'Analytics',
          description: 'View insights and metrics',
          category: 'Navigation',
          iconName: 'TrendUp01',
          url: '/analytics',
        },
        {
          id: 'nav-settings',
          title: 'Settings',
          description: 'Manage organization settings',
          category: 'Navigation',
          iconName: 'Settings01',
          url: '/settings',
        },
      ];

      results.push(...navItems);

      // Agents
      if (agentsRes.data) {
        const agentResults: SearchResult[] = agentsRes.data.map((agent: Agent) => ({
          id: `agent-${agent.id}`,
          title: agent.name,
          description: agent.description || `${agent.status} • ${agent.model}`,
          category: 'Agents',
          iconName: 'Cube01',
          url: `/agents/${agent.id}`,
        }));
        results.push(...agentResults);
      }

      // Conversations
      if (conversationsRes.data) {
        const conversationResults: SearchResult[] = conversationsRes.data.map((conv: any) => {
          const metadata = (conv.metadata as any) || {};
          return {
            id: `conversation-${conv.id}`,
            title: metadata.lead_name || metadata.lead_email || 'Anonymous',
            description: `via ${conv.agents?.name || 'Unknown Agent'} • ${conv.status}`,
            category: 'Conversations',
            iconName: 'MessageChatSquare',
            url: '/conversations',
            action: () => navigate('/conversations'),
          };
        });
        results.push(...conversationResults);
      }

      // Leads
      if (leadsRes.data) {
        const leadResults: SearchResult[] = leadsRes.data.map((lead: Lead) => ({
          id: `lead-${lead.id}`,
          title: lead.name || lead.email || 'Unnamed Lead',
          description: `${lead.company || ''} • ${lead.status}`,
          category: 'Leads',
          iconName: 'User01',
          url: '/leads',
          action: () => navigate('/leads'),
        }));
        results.push(...leadResults);
      }

      // Settings sections
      const settingsItems: SearchResult[] = [
        {
          id: 'settings-profile',
          title: 'Profile Settings',
          description: 'Manage your profile',
          category: 'Settings',
          iconName: 'User01',
          url: '/settings?tab=profile',
        },
        {
          id: 'settings-team',
          title: 'Team Settings',
          description: 'Manage team members',
          category: 'Settings',
          iconName: 'Users01',
          url: '/settings?tab=team',
        },
        {
          id: 'settings-organization',
          title: 'Organization Settings',
          description: 'Manage organization',
          category: 'Settings',
          iconName: 'Building07',
          url: '/settings?tab=organization',
        },
        {
          id: 'settings-subscription',
          title: 'Subscription & Billing',
          description: 'Manage subscription and invoices',
          category: 'Settings',
          iconName: 'CreditCard01',
          url: '/settings?tab=subscription',
        },
        {
          id: 'settings-api-keys',
          title: 'API Keys',
          description: 'Manage API keys',
          category: 'Settings',
          iconName: 'Key01',
          url: '/settings?tab=api-keys',
        },
        {
          id: 'settings-webhooks',
          title: 'Webhooks',
          description: 'Configure webhooks',
          category: 'Settings',
          iconName: 'Link01',
          url: '/settings?tab=webhooks',
        },
        {
          id: 'settings-branding',
          title: 'Branding',
          description: 'Customize branding',
          category: 'Settings',
          iconName: 'Palette',
          url: '/settings?tab=branding',
        },
      ];

      results.push(...settingsItems);

      setSearchResults(results);
    } catch (error) {
      logger.error('Error fetching search data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    searchResults,
    loading,
    refetch: fetchAllData,
  };
};
