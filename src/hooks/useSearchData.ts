/**
 * Global Search Data Hook
 * 
 * Fetches and aggregates data from various sources for global search.
 * Filters results based on user permissions using centralized route config
 * and DATA_PERMISSION_MAP for type-safe permission checks.
 * 
 * @module hooks/useSearchData
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { ROUTE_CONFIG, SETTINGS_TABS } from '@/config/routes';
import type { 
  SearchDataMap, 
  ConversationWithAgent, 
  LeadRecord,
  HelpArticleWithRelations,
  NewsItemWithAgent,
  WebhookWithAgent,
  AgentToolWithAgent,
  KnowledgeSourceWithAgent,
  ProfileRecord,
} from '@/types/search';
import { DATA_PERMISSION_MAP } from '@/types/search';
import type { ConversationMetadata } from '@/types/metadata';
import type { AppPermission } from '@/types/team';
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

/**
 * Hook for global search across agents, conversations, leads, articles, and more.
 * Uses DATA_PERMISSION_MAP for type-safe permission filtering.
 */
export const useSearchData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    isAdmin, 
    hasPermission,
    loading: permissionsLoading
  } = useRoleAuthorization();
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Check if user has permission for a specific data type using DATA_PERMISSION_MAP.
   * Admins always have access.
   */
  const hasDataPermission = useCallback((dataKey: keyof SearchDataMap): boolean => {
    if (isAdmin) return true;
    const permission = DATA_PERMISSION_MAP[dataKey];
    return hasPermission(permission);
  }, [isAdmin, hasPermission]);

  const fetchAllData = useCallback(async () => {
    if (!user || permissionsLoading) return;

    setLoading(true);
    try {
      const dataMap: SearchDataMap = {};
      const fetchPromises: Promise<void>[] = [];

      // Conversations - using DATA_PERMISSION_MAP
      if (hasDataPermission('conversations')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('conversations')
            .select('*, agents!fk_conversations_agent(name)')
            .order('updated_at', { ascending: false })
            .limit(50);
          dataMap.conversations = (res.data ?? []) as ConversationWithAgent[];
        })());
      }

      // Leads - using DATA_PERMISSION_MAP
      if (hasDataPermission('leads')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          dataMap.leads = (res.data ?? []) as LeadRecord[];
        })());
      }

      // Help Articles - using DATA_PERMISSION_MAP
      if (hasDataPermission('helpArticles')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('help_articles')
            .select('*, help_categories!fk_articles_category(name), agents!fk_articles_agent(name)')
            .order('title')
            .limit(50);
          dataMap.helpArticles = (res.data ?? []) as HelpArticleWithRelations[];
        })());

        // News Items share permission with Help Articles
        fetchPromises.push((async () => {
          const res = await supabase
            .from('news_items')
            .select('*, agents!fk_news_agent(name)')
            .order('created_at', { ascending: false })
            .limit(50);
          dataMap.newsItems = (res.data ?? []) as NewsItemWithAgent[];
        })());
      }

      // Webhooks - using DATA_PERMISSION_MAP
      if (hasDataPermission('webhooks')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('webhooks')
            .select('*, agents(name)')
            .order('name')
            .limit(50);
          dataMap.webhooks = (res.data ?? []) as WebhookWithAgent[];
        })());
      }

      // Tools - using DATA_PERMISSION_MAP
      if (hasDataPermission('tools')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('agent_tools')
            .select('*, agents!fk_tools_agent(name)')
            .order('name')
            .limit(50);
          dataMap.tools = (res.data ?? []) as AgentToolWithAgent[];
        })());
      }

      // Knowledge Sources - using DATA_PERMISSION_MAP
      if (hasDataPermission('knowledgeSources')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('knowledge_sources')
            .select('*, agents!fk_sources_agent(name)')
            .is('metadata->parent_source_id', null)
            .order('created_at', { ascending: false })
            .limit(50);
          dataMap.knowledgeSources = (res.data ?? []) as KnowledgeSourceWithAgent[];
        })());
      }

      // Team Members - using DATA_PERMISSION_MAP
      if (hasDataPermission('teamMembers')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('profiles')
            .select('*')
            .order('display_name')
            .limit(50);
          dataMap.teamMembers = (res.data ?? []) as ProfileRecord[];
        })());
      }

      // Execute all permitted queries
      await Promise.all(fetchPromises);

      const results: SearchResult[] = [];

      // Navigation items from centralized route config
      ROUTE_CONFIG.forEach(route => {
        // Filter by permissions
        if (route.adminOnly && !isAdmin) return;
        if (route.requiredPermission && !isAdmin && !hasPermission(route.requiredPermission)) return;
        // Skip routes not intended for search (no nav or bottom nav)
        if (!route.showInNav && !route.showInBottomNav && route.id !== 'report-builder') return;

        results.push({
          id: `nav-${route.id}`,
          title: route.label,
          description: route.description,
          category: 'Navigation',
          iconName: route.iconName,
          shortcut: route.shortcut,
          action: () => navigate(route.path),
        });
      });

      // Conversations
      if (dataMap.conversations) {
        dataMap.conversations.forEach((conv) => {
          const metadata = (conv.metadata || {}) as ConversationMetadata;
          results.push({
            id: `conversation-${conv.id}`,
            title: metadata.lead_name || metadata.lead_email || 'Anonymous',
            description: `via ${conv.agents?.name || 'Unknown Agent'} • ${conv.status}`,
            category: 'Conversations',
            iconName: 'MessageChatSquare',
            action: () => navigate('/conversations'),
          });
        });
      }

      // Leads
      if (dataMap.leads) {
        dataMap.leads.forEach((lead) => {
          results.push({
            id: `lead-${lead.id}`,
            title: lead.name || lead.email || 'Unnamed Lead',
            description: `${lead.company || ''} • ${lead.status}`,
            category: 'Leads',
            iconName: 'User01',
            action: () => navigate('/leads'),
          });
        });
      }

      // Help Articles
      if (dataMap.helpArticles) {
        dataMap.helpArticles.forEach((article) => {
          results.push({
            id: `article-${article.id}`,
            title: article.title,
            description: `${article.help_categories?.name || 'Uncategorized'}`,
            category: 'Help Articles',
            iconName: 'BookOpen01',
            action: () => navigate('/ari/help-articles'),
          });
        });
      }

      // News Items
      if (dataMap.newsItems) {
        dataMap.newsItems.forEach((news) => {
          results.push({
            id: `news-${news.id}`,
            title: news.title,
            description: news.is_published ? 'Published' : 'Draft',
            category: 'News',
            iconName: 'Announcement01',
            action: () => navigate('/ari/news'),
          });
        });
      }

      // Webhooks
      if (dataMap.webhooks) {
        dataMap.webhooks.forEach((webhook) => {
          results.push({
            id: `webhook-${webhook.id}`,
            title: webhook.name,
            description: webhook.active ? 'Active' : 'Inactive',
            category: 'Webhooks',
            iconName: 'Link01',
            action: () => navigate('/ari/webhooks'),
          });
        });
      }

      // Custom Tools
      if (dataMap.tools) {
        dataMap.tools.forEach((tool) => {
          results.push({
            id: `tool-${tool.id}`,
            title: tool.name,
            description: tool.enabled ? 'Enabled' : 'Disabled',
            category: 'Tools',
            iconName: 'Tool02',
            action: () => navigate('/ari/custom-tools'),
          });
        });
      }

      // Knowledge Sources
      if (dataMap.knowledgeSources) {
        dataMap.knowledgeSources.forEach((source) => {
          results.push({
            id: `knowledge-${source.id}`,
            title: source.source,
            description: `${source.type.toUpperCase()} • ${source.status}`,
            category: 'Knowledge',
            iconName: 'Database01',
            action: () => navigate('/ari/knowledge'),
          });
        });
      }

      // Team Members
      if (dataMap.teamMembers) {
        dataMap.teamMembers.forEach((profile) => {
          results.push({
            id: `team-${profile.id}`,
            title: profile.display_name || profile.email || 'Team Member',
            description: profile.email || '',
            category: 'Team',
            iconName: 'User01',
            action: () => navigate('/settings?tab=team'),
          });
        });
      }

      // Settings sections from centralized config
      SETTINGS_TABS.forEach(tab => {
        if (tab.requiredPermission && !isAdmin && !hasPermission(tab.requiredPermission)) return;
        
        results.push({
          id: tab.id,
          title: tab.label,
          description: tab.description,
          category: 'Settings',
          iconName: tab.iconName,
          action: () => navigate(`/settings?tab=${tab.tabParam}`),
        });
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
    hasDataPermission,
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
