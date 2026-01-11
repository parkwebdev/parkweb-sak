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
import { 
  LEAD_SEARCH_COLUMNS, 
  PROFILE_LIST_COLUMNS,
  CALENDAR_EVENT_SEARCH_COLUMNS,
  LOCATION_SEARCH_COLUMNS,
  ANNOUNCEMENT_SEARCH_COLUMNS,
  HELP_CATEGORY_SEARCH_COLUMNS,
} from '@/lib/db-selects';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { ROUTE_CONFIG, SETTINGS_TABS, ARI_SECTIONS } from '@/config/routes';
import { KB_CATEGORIES } from '@/config/knowledge-base-config';
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
  CalendarEventRecord,
  LocationRecord,
  AnnouncementRecord,
  HelpCategoryRecord,
} from '@/types/search';
import { DATA_PERMISSION_MAP } from '@/types/search';
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
            .select(LEAD_SEARCH_COLUMNS)
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
            .select(PROFILE_LIST_COLUMNS)
            .order('display_name')
            .limit(50);
          dataMap.teamMembers = (res.data ?? []) as ProfileRecord[];
        })());
      }

      // Calendar Events - using DATA_PERMISSION_MAP
      if (hasDataPermission('calendarEvents')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('calendar_events')
            .select(CALENDAR_EVENT_SEARCH_COLUMNS)
            .order('start_time', { ascending: false })
            .limit(50);
          dataMap.calendarEvents = (res.data ?? []) as CalendarEventRecord[];
        })());
      }

      // Locations - using DATA_PERMISSION_MAP
      if (hasDataPermission('locations')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('locations')
            .select(LOCATION_SEARCH_COLUMNS)
            .order('name')
            .limit(50);
          dataMap.locations = (res.data ?? []) as LocationRecord[];
        })());
      }

      // Announcements - using DATA_PERMISSION_MAP
      if (hasDataPermission('announcements')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('announcements')
            .select(ANNOUNCEMENT_SEARCH_COLUMNS)
            .order('order_index')
            .limit(50);
          dataMap.announcements = (res.data ?? []) as AnnouncementRecord[];
        })());
      }

      // Help Categories - using DATA_PERMISSION_MAP
      if (hasDataPermission('helpCategories')) {
        fetchPromises.push((async () => {
          const res = await supabase
            .from('help_categories')
            .select(HELP_CATEGORY_SEARCH_COLUMNS)
            .order('order_index')
            .limit(50);
          dataMap.helpCategories = (res.data ?? []) as HelpCategoryRecord[];
        })());
      }

      // Execute all permitted queries
      await Promise.all(fetchPromises);

      const results: SearchResult[] = [];

      // ============ 1. QUICK ACTIONS (Navigation) ============
      ROUTE_CONFIG.forEach(route => {
        if (route.adminOnly && !isAdmin) return;
        if (route.requiredPermission && !isAdmin && !hasPermission(route.requiredPermission)) return;
        if (!route.showInNav && !route.showInBottomNav && route.id !== 'report-builder') return;

        results.push({
          id: `nav-${route.id}`,
          title: route.label,
          description: route.description,
          category: 'Quick Actions',
          iconName: route.iconName,
          shortcut: route.shortcut,
          action: () => navigate(route.path),
        });
      });

      // ============ 2. ARI CONFIGURATION ============
      ARI_SECTIONS.forEach(section => {
        if (section.requiredPermission && !isAdmin && !hasPermission(section.requiredPermission)) return;
        
        results.push({
          id: `ari-section-${section.id}`,
          title: section.label,
          description: `${section.group} • Ari Configuration`,
          category: 'Ari Configuration',
          iconName: section.iconName,
          action: () => navigate(`/ari?section=${section.id}`),
        });
      });

      // ============ 3. SETTINGS ============
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

      // ============ 4. DOCS (Knowledge Base) ============
      KB_CATEGORIES.forEach(category => {
        category.articles.forEach(article => {
          results.push({
            id: `kb-${category.id}-${article.id}`,
            title: article.title,
            description: `${category.label} • Documentation`,
            category: 'Docs',
            iconName: 'BookOpen01',
            action: () => navigate(`/knowledge-base?category=${category.id}&article=${article.slug}`),
          });
        });
      });

      // ============ 5. CRM DATA ============
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
            iconName: 'Users01',
            action: () => navigate('/leads'),
          });
        });
      }

      // Calendar Events
      if (dataMap.calendarEvents) {
        dataMap.calendarEvents.forEach((event) => {
          const eventDate = new Date(event.start_time).toLocaleDateString();
          results.push({
            id: `event-${event.id}`,
            title: event.title || event.visitor_name || 'Untitled Event',
            description: `${event.event_type || 'Event'} • ${eventDate} • ${event.status}`,
            category: 'Calendar',
            iconName: 'Calendar',
            action: () => navigate('/planner'),
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
            iconName: 'Users01',
            action: () => navigate('/settings?tab=team'),
          });
        });
      }

      // ============ 6. ARI CONTENT ============
      // Locations
      if (dataMap.locations) {
        dataMap.locations.forEach((location) => {
          const locationParts = [location.city, location.state].filter(Boolean).join(', ');
          results.push({
            id: `location-${location.id}`,
            title: location.name,
            description: `${locationParts} • ${location.is_active ? 'Active' : 'Inactive'}`,
            category: 'Ari Content',
            iconName: 'MarkerPin01',
            action: () => navigate('/ari?section=locations'),
          });
        });
      }

      // Announcements
      if (dataMap.announcements) {
        dataMap.announcements.forEach((announcement) => {
          results.push({
            id: `announcement-${announcement.id}`,
            title: announcement.title,
            description: announcement.is_active ? 'Active' : 'Inactive',
            category: 'Ari Content',
            iconName: 'Announcement01',
            action: () => navigate('/ari?section=announcements'),
          });
        });
      }

      // Help Categories
      if (dataMap.helpCategories) {
        dataMap.helpCategories.forEach((category) => {
          results.push({
            id: `help-category-${category.id}`,
            title: category.name,
            description: category.description || 'Help category',
            category: 'Ari Content',
            iconName: 'FolderClosed',
            action: () => navigate('/ari?section=help-articles'),
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
            category: 'Ari Content',
            iconName: 'BookOpen01',
            action: () => navigate('/ari?section=help-articles'),
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
            category: 'Ari Content',
            iconName: 'Announcement01',
            action: () => navigate('/ari?section=news'),
          });
        });
      }

      // ============ 7. ARI TOOLS ============
      // Webhooks
      if (dataMap.webhooks) {
        dataMap.webhooks.forEach((webhook) => {
          results.push({
            id: `webhook-${webhook.id}`,
            title: webhook.name,
            description: webhook.active ? 'Active' : 'Inactive',
            category: 'Ari Tools',
            iconName: 'Webhook',
            action: () => navigate('/ari?section=webhooks'),
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
            category: 'Ari Tools',
            iconName: 'CodeBrowser',
            action: () => navigate('/ari?section=custom-tools'),
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
            category: 'Ari Tools',
            iconName: 'Database01',
            action: () => navigate('/ari?section=knowledge'),
          });
        });
      }

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
