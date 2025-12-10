import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';
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
type HelpArticle = Tables<'help_articles'>;
type NewsItem = Tables<'news_items'>;
type Webhook = Tables<'webhooks'>;
type AgentTool = Tables<'agent_tools'>;
type KnowledgeSource = Tables<'knowledge_sources'>;
type Profile = Tables<'profiles'>;

/**
 * Hook for global search across agents, conversations, leads, articles, and more.
 * Provides fuzzy search with categorized results and navigation actions.
 */
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
      const [
        agentsRes,
        conversationsRes,
        leadsRes,
        helpArticlesRes,
        newsItemsRes,
        webhooksRes,
        toolsRes,
        knowledgeSourcesRes,
        teamMembersRes,
      ] = await Promise.all([
        supabase
          .from('agents')
          .select('*')
          .order('name'),
        supabase
          .from('conversations')
          .select('*, agents(name)')
          .order('updated_at', { ascending: false })
          .limit(50),
        supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('help_articles')
          .select('*, help_categories(name), agents(name)')
          .order('title')
          .limit(50),
        supabase
          .from('news_items')
          .select('*, agents(name)')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('webhooks')
          .select('*, agents(name)')
          .order('name')
          .limit(50),
        supabase
          .from('agent_tools')
          .select('*, agents(name)')
          .order('name')
          .limit(50),
        supabase
          .from('knowledge_sources')
          .select('*, agents(name)')
          .is('metadata->parent_source_id', null) // Only top-level sources
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('profiles')
          .select('*')
          .order('display_name')
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
          action: () => navigate('/dashboard'),
        },
        {
          id: 'nav-agents',
          title: 'Agents',
          description: 'Manage AI agents',
          category: 'Navigation',
          iconName: 'Cube01',
          action: () => navigate('/agents'),
        },
        {
          id: 'nav-conversations',
          title: 'Conversations',
          description: 'View all conversations',
          category: 'Navigation',
          iconName: 'MessageChatSquare',
          action: () => navigate('/conversations'),
        },
        {
          id: 'nav-leads',
          title: 'Leads',
          description: 'Manage captured leads',
          category: 'Navigation',
          iconName: 'Users01',
          action: () => navigate('/leads'),
        },
        {
          id: 'nav-analytics',
          title: 'Analytics',
          description: 'View insights and metrics',
          category: 'Navigation',
          iconName: 'TrendUp01',
          action: () => navigate('/analytics'),
        },
        {
          id: 'nav-settings',
          title: 'Settings',
          description: 'Manage organization settings',
          category: 'Navigation',
          iconName: 'Settings01',
          action: () => navigate('/settings'),
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
          action: () => navigate(`/agents/${agent.id}`),
        }));
        results.push(...agentResults);
      }

      // Conversations
      if (conversationsRes.data) {
        const conversationResults: SearchResult[] = conversationsRes.data.map((conv: Tables<'conversations'> & { agents?: { name: string } }) => {
          const metadata = (conv.metadata || {}) as ConversationMetadata;
          return {
            id: `conversation-${conv.id}`,
            title: metadata.lead_name || metadata.lead_email || 'Anonymous',
            description: `via ${conv.agents?.name || 'Unknown Agent'} • ${conv.status}`,
            category: 'Conversations',
            iconName: 'MessageChatSquare',
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
          action: () => navigate('/leads'),
        }));
        results.push(...leadResults);
      }

      // Help Articles
      if (helpArticlesRes.data) {
        const articleResults: SearchResult[] = helpArticlesRes.data.map((article: HelpArticle & { help_categories?: { name: string }, agents?: { name: string } }) => ({
          id: `article-${article.id}`,
          title: article.title,
          description: `${article.help_categories?.name || 'Uncategorized'} • ${article.agents?.name || 'Unknown Agent'}`,
          category: 'Help Articles',
          iconName: 'BookOpen01',
          action: () => navigate(`/agents/${article.agent_id}?tab=content`),
        }));
        results.push(...articleResults);
      }

      // News Items
      if (newsItemsRes.data) {
        const newsResults: SearchResult[] = newsItemsRes.data.map((news: NewsItem & { agents?: { name: string } }) => ({
          id: `news-${news.id}`,
          title: news.title,
          description: `${news.is_published ? 'Published' : 'Draft'} • ${news.agents?.name || 'Unknown Agent'}`,
          category: 'News',
          iconName: 'Announcement01',
          action: () => navigate(`/agents/${news.agent_id}?tab=content`),
        }));
        results.push(...newsResults);
      }

      // Webhooks
      if (webhooksRes.data) {
        const webhookResults: SearchResult[] = webhooksRes.data.map((webhook: Webhook & { agents?: { name: string } }) => ({
          id: `webhook-${webhook.id}`,
          title: webhook.name,
          description: `${webhook.active ? 'Active' : 'Inactive'} • ${webhook.agents?.name || 'Global'}`,
          category: 'Webhooks',
          iconName: 'Link01',
          action: () => webhook.agent_id ? navigate(`/agents/${webhook.agent_id}?tab=tools`) : navigate('/settings?tab=webhooks'),
        }));
        results.push(...webhookResults);
      }

      // Custom Tools
      if (toolsRes.data) {
        const toolResults: SearchResult[] = toolsRes.data.map((tool: AgentTool & { agents?: { name: string } }) => ({
          id: `tool-${tool.id}`,
          title: tool.name,
          description: `${tool.enabled ? 'Enabled' : 'Disabled'} • ${tool.agents?.name || 'Unknown Agent'}`,
          category: 'Tools',
          iconName: 'Tool02',
          action: () => navigate(`/agents/${tool.agent_id}?tab=tools`),
        }));
        results.push(...toolResults);
      }

      // Knowledge Sources
      if (knowledgeSourcesRes.data) {
        const knowledgeResults: SearchResult[] = knowledgeSourcesRes.data.map((source: KnowledgeSource & { agents?: { name: string } }) => ({
          id: `knowledge-${source.id}`,
          title: source.source,
          description: `${source.type.toUpperCase()} • ${source.status} • ${source.agents?.name || 'Unknown Agent'}`,
          category: 'Knowledge',
          iconName: 'Database01',
          action: () => navigate(`/agents/${source.agent_id}?tab=knowledge`),
        }));
        results.push(...knowledgeResults);
      }

      // Team Members
      if (teamMembersRes.data) {
        const teamResults: SearchResult[] = teamMembersRes.data.map((profile: Profile) => ({
          id: `team-${profile.id}`,
          title: profile.display_name || profile.email || 'Team Member',
          description: profile.email || '',
          category: 'Team',
          iconName: 'User01',
          action: () => navigate('/settings?tab=team'),
        }));
        results.push(...teamResults);
      }

      // Settings sections
      const settingsItems: SearchResult[] = [
        {
          id: 'settings-profile',
          title: 'Profile Settings',
          description: 'Manage your profile',
          category: 'Settings',
          iconName: 'User01',
          action: () => navigate('/settings?tab=profile'),
        },
        {
          id: 'settings-team',
          title: 'Team Settings',
          description: 'Manage team members',
          category: 'Settings',
          iconName: 'Users01',
          action: () => navigate('/settings?tab=team'),
        },
        {
          id: 'settings-notifications',
          title: 'Notification Settings',
          description: 'Manage notification preferences',
          category: 'Settings',
          iconName: 'Bell01',
          action: () => navigate('/settings?tab=notifications'),
        },
        {
          id: 'settings-subscription',
          title: 'Subscription & Billing',
          description: 'Manage subscription and invoices',
          category: 'Settings',
          iconName: 'CreditCard01',
          action: () => navigate('/settings?tab=subscription'),
        },
        {
          id: 'settings-usage',
          title: 'Usage',
          description: 'View usage metrics',
          category: 'Settings',
          iconName: 'BarChart01',
          action: () => navigate('/settings?tab=usage'),
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
