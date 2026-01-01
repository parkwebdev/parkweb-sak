import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
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
  shortcut?: string;
}

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
 * Filters results based on user permissions.
 */
export const useSearchData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    isAdmin, 
    hasPermission,
    canViewConversations,
    canViewLeads,
    canViewHelpArticles,
    canViewWebhooks,
    canManageAri,
    canViewKnowledge,
    canViewTeam,
    canViewBookings,
    canViewSettings,
    canViewBilling,
    canViewDashboard,
    loading: permissionsLoading
  } = useRoleAuthorization();
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (!user || permissionsLoading) return;

    setLoading(true);
    try {
      const dataMap: Record<string, unknown[]> = {};

      // Fetch data in parallel based on permissions using async arrow functions
      const fetchPromises: Promise<void>[] = [];

      // Conversations - only if user has permission
      if (canViewConversations) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('conversations')
            .select('*, agents!fk_conversations_agent(name)')
            .order('updated_at', { ascending: false })
            .limit(50);
          dataMap.conversations = res.data || [];
        })());
      }

      // Leads - only if user has permission
      if (canViewLeads) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          dataMap.leads = res.data || [];
        })());
      }

      // Help Articles - only if user has permission
      if (canViewHelpArticles) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('help_articles')
            .select('*, help_categories!fk_articles_category(name), agents!fk_articles_agent(name)')
            .order('title')
            .limit(50);
          dataMap.helpArticles = res.data || [];
        })());

        fetchPromises.push((async () => {
          const res = await supabase
            .from('news_items')
            .select('*, agents!fk_news_agent(name)')
            .order('created_at', { ascending: false })
            .limit(50);
          dataMap.newsItems = res.data || [];
        })());
      }

      // Webhooks - only if user has permission
      if (canViewWebhooks) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('webhooks')
            .select('*, agents(name)')
            .order('name')
            .limit(50);
          dataMap.webhooks = res.data || [];
        })());
      }

      // Tools - only if user can manage Ari
      if (canManageAri) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('agent_tools')
            .select('*, agents!fk_tools_agent(name)')
            .order('name')
            .limit(50);
          dataMap.tools = res.data || [];
        })());
      }

      // Knowledge Sources - only if user has permission
      if (canViewKnowledge) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('knowledge_sources')
            .select('*, agents!fk_sources_agent(name)')
            .is('metadata->parent_source_id', null)
            .order('created_at', { ascending: false })
            .limit(50);
          dataMap.knowledgeSources = res.data || [];
        })());
      }

      // Team Members - only if user has permission
      if (canViewTeam) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('profiles')
            .select('*')
            .order('display_name')
            .limit(50);
          dataMap.teamMembers = res.data || [];
        })());
      }

      // Execute all permitted queries
      await Promise.all(fetchPromises);

      const results: SearchResult[] = [];

      // Navigation items - filtered by permission
      const navItems: { item: SearchResult; requiredPermission?: string; adminOnly?: boolean }[] = [
        {
          item: {
            id: 'nav-dashboard',
            title: 'Dashboard',
            description: 'View overview and statistics',
            category: 'Navigation',
            iconName: 'LayoutGrid01',
            action: () => navigate('/'),
          },
          adminOnly: true,
        },
        {
          item: {
            id: 'nav-ari',
            title: 'Ari',
            description: 'Configure your AI agent',
            category: 'Navigation',
            iconName: 'AriLogo',
            shortcut: '⌥A',
            action: () => navigate('/ari'),
          },
          requiredPermission: 'manage_ari',
        },
        {
          item: {
            id: 'nav-inbox',
            title: 'Inbox',
            description: 'View all conversations',
            category: 'Navigation',
            iconName: 'MessageChatSquare',
            shortcut: '⌥C',
            action: () => navigate('/conversations'),
          },
          requiredPermission: 'view_conversations',
        },
        {
          item: {
            id: 'nav-leads',
            title: 'Leads',
            description: 'Manage captured leads',
            category: 'Navigation',
            iconName: 'Users01',
            shortcut: '⌥L',
            action: () => navigate('/leads'),
          },
          requiredPermission: 'view_leads',
        },
        {
          item: {
            id: 'nav-analytics',
            title: 'Analytics',
            description: 'View insights and metrics',
            category: 'Navigation',
            iconName: 'TrendUp01',
            shortcut: '⌥Y',
            action: () => navigate('/analytics'),
          },
          requiredPermission: 'view_dashboard',
        },
        {
          item: {
            id: 'nav-planner',
            title: 'Planner',
            description: 'Manage calendar and events',
            category: 'Navigation',
            iconName: 'Calendar',
            shortcut: '⌥P',
            action: () => navigate('/planner'),
          },
          requiredPermission: 'view_bookings',
        },
        {
          item: {
            id: 'nav-settings',
            title: 'Settings',
            description: 'Manage organization settings',
            category: 'Navigation',
            iconName: 'Settings01',
            shortcut: '⌥S',
            action: () => navigate('/settings'),
          },
          requiredPermission: 'view_settings',
        },
      ];

      // Filter nav items by permission
      navItems.forEach(({ item, requiredPermission, adminOnly }) => {
        if (adminOnly && !isAdmin) return;
        if (requiredPermission && !isAdmin && !hasPermission(requiredPermission as Parameters<typeof hasPermission>[0])) return;
        results.push(item);
      });

      // Conversations
      if (dataMap.conversations) {
        const conversationResults: SearchResult[] = (dataMap.conversations as (Conversation & { agents?: { name: string } })[]).map((conv) => {
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
      if (dataMap.leads) {
        const leadResults: SearchResult[] = (dataMap.leads as Lead[]).map((lead) => ({
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
      if (dataMap.helpArticles) {
        const articleResults: SearchResult[] = (dataMap.helpArticles as (HelpArticle & { help_categories?: { name: string }, agents?: { name: string } })[]).map((article) => ({
          id: `article-${article.id}`,
          title: article.title,
          description: `${article.help_categories?.name || 'Uncategorized'}`,
          category: 'Help Articles',
          iconName: 'BookOpen01',
          action: () => navigate('/ari/help-articles'),
        }));
        results.push(...articleResults);
      }

      // News Items
      if (dataMap.newsItems) {
        const newsResults: SearchResult[] = (dataMap.newsItems as (NewsItem & { agents?: { name: string } })[]).map((news) => ({
          id: `news-${news.id}`,
          title: news.title,
          description: news.is_published ? 'Published' : 'Draft',
          category: 'News',
          iconName: 'Announcement01',
          action: () => navigate('/ari/news'),
        }));
        results.push(...newsResults);
      }

      // Webhooks
      if (dataMap.webhooks) {
        const webhookResults: SearchResult[] = (dataMap.webhooks as (Webhook & { agents?: { name: string } })[]).map((webhook) => ({
          id: `webhook-${webhook.id}`,
          title: webhook.name,
          description: webhook.active ? 'Active' : 'Inactive',
          category: 'Webhooks',
          iconName: 'Link01',
          action: () => navigate('/ari/webhooks'),
        }));
        results.push(...webhookResults);
      }

      // Custom Tools
      if (dataMap.tools) {
        const toolResults: SearchResult[] = (dataMap.tools as (AgentTool & { agents?: { name: string } })[]).map((tool) => ({
          id: `tool-${tool.id}`,
          title: tool.name,
          description: tool.enabled ? 'Enabled' : 'Disabled',
          category: 'Tools',
          iconName: 'Tool02',
          action: () => navigate('/ari/custom-tools'),
        }));
        results.push(...toolResults);
      }

      // Knowledge Sources
      if (dataMap.knowledgeSources) {
        const knowledgeResults: SearchResult[] = (dataMap.knowledgeSources as (KnowledgeSource & { agents?: { name: string } })[]).map((source) => ({
          id: `knowledge-${source.id}`,
          title: source.source,
          description: `${source.type.toUpperCase()} • ${source.status}`,
          category: 'Knowledge',
          iconName: 'Database01',
          action: () => navigate('/ari/knowledge'),
        }));
        results.push(...knowledgeResults);
      }

      // Team Members
      if (dataMap.teamMembers) {
        const teamResults: SearchResult[] = (dataMap.teamMembers as Profile[]).map((profile) => ({
          id: `team-${profile.id}`,
          title: profile.display_name || profile.email || 'Team Member',
          description: profile.email || '',
          category: 'Team',
          iconName: 'User01',
          action: () => navigate('/settings?tab=team'),
        }));
        results.push(...teamResults);
      }

      // Settings sections - filtered by permission
      const settingsItems: { item: SearchResult; requiredPermission?: string }[] = [
        {
          item: {
            id: 'settings-profile',
            title: 'Profile Settings',
            description: 'Manage your profile',
            category: 'Settings',
            iconName: 'User01',
            action: () => navigate('/settings?tab=profile'),
          },
          // Always visible
        },
        {
          item: {
            id: 'settings-team',
            title: 'Team Settings',
            description: 'Manage team members',
            category: 'Settings',
            iconName: 'Users01',
            action: () => navigate('/settings?tab=team'),
          },
          requiredPermission: 'view_team',
        },
        {
          item: {
            id: 'settings-notifications',
            title: 'Notification Settings',
            description: 'Manage notification preferences',
            category: 'Settings',
            iconName: 'Bell01',
            action: () => navigate('/settings?tab=notifications'),
          },
          // Always visible
        },
        {
          item: {
            id: 'settings-subscription',
            title: 'Subscription & Billing',
            description: 'Manage subscription and invoices',
            category: 'Settings',
            iconName: 'CreditCard01',
            action: () => navigate('/settings?tab=subscription'),
          },
          requiredPermission: 'view_billing',
        },
        {
          item: {
            id: 'settings-usage',
            title: 'Usage',
            description: 'View usage metrics',
            category: 'Settings',
            iconName: 'BarChart01',
            action: () => navigate('/settings?tab=usage'),
          },
          requiredPermission: 'view_billing',
        },
      ];

      settingsItems.forEach(({ item, requiredPermission }) => {
        if (requiredPermission && !isAdmin && !hasPermission(requiredPermission as Parameters<typeof hasPermission>[0])) return;
        results.push(item);
      });

      setSearchResults(results);
    } catch (error: unknown) {
      logger.error('Error fetching search data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    permissionsLoading,
    isAdmin,
    hasPermission,
    canViewConversations,
    canViewLeads,
    canViewHelpArticles,
    canViewWebhooks,
    canManageAri,
    canViewKnowledge,
    canViewTeam,
    navigate,
  ]);

  useEffect(() => {
    if (user && !permissionsLoading) {
      fetchAllData();
    }
  }, [user, permissionsLoading, fetchAllData]);

  return {
    searchResults,
    loading,
    refetch: fetchAllData,
  };
};
