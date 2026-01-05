/**
 * Knowledge Base Configuration
 * 
 * Centralized configuration for all Knowledge Base categories and articles.
 * This is user-facing documentation to help users understand the app.
 * 
 * @module config/knowledge-base-config
 */

import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

/**
 * Knowledge Base Article
 */
export interface KBArticle {
  /** Unique article identifier */
  id: string;
  /** URL-friendly slug */
  slug: string;
  /** Display title */
  title: string;
  /** Brief description for previews */
  description?: string;
  /** Lazy-loaded article component */
  component: LazyExoticComponent<ComponentType>;
}

/**
 * Knowledge Base Category
 */
export interface KBCategory {
  /** Unique category identifier */
  id: string;
  /** Display label */
  label: string;
  /** Color token for category indicator (e.g., 'bg-info') */
  color: string;
  /** UntitledUI icon name */
  iconName: string;
  /** Articles in this category */
  articles: KBArticle[];
}

/**
 * All Knowledge Base categories and articles
 */
export const KB_CATEGORIES: readonly KBCategory[] = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    color: 'bg-info',
    iconName: 'Flag01',
    articles: [
      {
        id: 'welcome',
        slug: 'welcome',
        title: 'Welcome to Pilot',
        description: 'An introduction to the Pilot platform and what you can do with it.',
        component: lazy(() => import('@/data/knowledge-base/getting-started/WelcomeArticle')),
      },
      {
        id: 'quick-start',
        slug: 'quick-start',
        title: 'Quick Start Guide',
        description: 'Get up and running with Pilot in just a few minutes.',
        component: lazy(() => import('@/data/knowledge-base/getting-started/QuickStartArticle')),
      },
      {
        id: 'navigation',
        slug: 'navigation',
        title: 'Navigating the App',
        description: 'Learn how to navigate around Pilot efficiently.',
        component: lazy(() => import('@/data/knowledge-base/getting-started/NavigationArticle')),
      },
    ],
  },
  {
    id: 'ari',
    label: 'Ari (Your AI Agent)',
    color: 'bg-accent-purple',
    iconName: 'Bot',
    articles: [
      {
        id: 'ari-overview',
        slug: 'overview',
        title: 'Understanding Ari',
        description: 'Learn what Ari is and how it can help your business.',
        component: lazy(() => import('@/data/knowledge-base/ari/AriOverviewArticle')),
      },
      {
        id: 'model-behavior',
        slug: 'model-behavior',
        title: 'Model & Behavior Settings',
        description: 'Configure how Ari responds and behaves.',
        component: lazy(() => import('@/data/knowledge-base/ari/ModelBehaviorArticle')),
      },
      {
        id: 'knowledge-sources',
        slug: 'knowledge-sources',
        title: 'Adding Knowledge Sources',
        description: 'Teach Ari about your business with knowledge sources.',
        component: lazy(() => import('@/data/knowledge-base/ari/KnowledgeSourcesArticle')),
      },
      {
        id: 'appearance',
        slug: 'appearance',
        title: 'Customizing Appearance',
        description: 'Make the chat widget match your brand.',
        component: lazy(() => import('@/data/knowledge-base/ari/AppearanceArticle')),
      },
      {
        id: 'installation',
        slug: 'installation',
        title: 'Installing the Widget',
        description: 'Add Ari to your website in minutes.',
        component: lazy(() => import('@/data/knowledge-base/ari/InstallationArticle')),
      },
    ],
  },
  {
    id: 'inbox',
    label: 'Inbox',
    color: 'bg-success',
    iconName: 'MessageSquare01',
    articles: [
      {
        id: 'inbox-overview',
        slug: 'overview',
        title: 'Managing Conversations',
        description: 'View and manage all conversations with your visitors.',
        component: lazy(() => import('@/data/knowledge-base/inbox/InboxOverviewArticle')),
      },
      {
        id: 'takeover',
        slug: 'takeover',
        title: 'Human Takeover',
        description: 'Take over conversations from Ari when needed.',
        component: lazy(() => import('@/data/knowledge-base/inbox/TakeoverArticle')),
      },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    color: 'bg-warning',
    iconName: 'Users01',
    articles: [
      {
        id: 'leads-overview',
        slug: 'overview',
        title: 'Lead Management',
        description: 'Capture and manage leads from conversations.',
        component: lazy(() => import('@/data/knowledge-base/leads/LeadsOverviewArticle')),
      },
      {
        id: 'lead-stages',
        slug: 'stages',
        title: 'Lead Stages',
        description: 'Organize leads with customizable stages.',
        component: lazy(() => import('@/data/knowledge-base/leads/LeadStagesArticle')),
      },
    ],
  },
  {
    id: 'planner',
    label: 'Planner',
    color: 'bg-status-active',
    iconName: 'Calendar',
    articles: [
      {
        id: 'planner-overview',
        slug: 'overview',
        title: 'Using the Calendar',
        description: 'Schedule and manage bookings with the Planner.',
        component: lazy(() => import('@/data/knowledge-base/planner/PlannerOverviewArticle')),
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    color: 'bg-destructive',
    iconName: 'BarChart01',
    articles: [
      {
        id: 'analytics-overview',
        slug: 'overview',
        title: 'Understanding Your Data',
        description: 'Gain insights from your conversation analytics.',
        component: lazy(() => import('@/data/knowledge-base/analytics/AnalyticsOverviewArticle')),
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings & Team',
    color: 'bg-muted-foreground',
    iconName: 'Settings01',
    articles: [
      {
        id: 'team-management',
        slug: 'team',
        title: 'Managing Your Team',
        description: 'Invite team members and manage roles.',
        component: lazy(() => import('@/data/knowledge-base/settings/TeamManagementArticle')),
      },
      {
        id: 'billing',
        slug: 'billing',
        title: 'Billing & Subscription',
        description: 'Manage your subscription and billing.',
        component: lazy(() => import('@/data/knowledge-base/settings/BillingArticle')),
      },
    ],
  },
] as const;

/** Type for valid category IDs */
export type KBCategoryId = typeof KB_CATEGORIES[number]['id'];

/** Get category by ID */
export function getKBCategoryById(id: string): KBCategory | undefined {
  return KB_CATEGORIES.find(c => c.id === id);
}

/** Get article by category and article ID */
export function getKBArticle(categoryId: string, articleId: string): KBArticle | undefined {
  const category = getKBCategoryById(categoryId);
  return category?.articles.find(a => a.id === articleId);
}

/** Get article by slug (searches all categories) */
export function getKBArticleBySlug(categoryId: string, slug: string): KBArticle | undefined {
  const category = getKBCategoryById(categoryId);
  return category?.articles.find(a => a.slug === slug);
}

/** Get first article (for default view) */
export function getFirstKBArticle(): { category: KBCategory; article: KBArticle } | undefined {
  const firstCategory = KB_CATEGORIES[0];
  const firstArticle = firstCategory?.articles[0];
  if (firstCategory && firstArticle) {
    return { category: firstCategory, article: firstArticle };
  }
  return undefined;
}

/** Get previous and next articles for navigation */
export function getAdjacentArticles(categoryId: string, articleId: string): {
  prev?: { category: KBCategory; article: KBArticle };
  next?: { category: KBCategory; article: KBArticle };
} {
  // Flatten all articles with their categories
  const allArticles: { category: KBCategory; article: KBArticle }[] = [];
  for (const category of KB_CATEGORIES) {
    for (const article of category.articles) {
      allArticles.push({ category, article });
    }
  }

  const currentIndex = allArticles.findIndex(
    item => item.category.id === categoryId && item.article.id === articleId
  );

  return {
    prev: currentIndex > 0 ? allArticles[currentIndex - 1] : undefined,
    next: currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : undefined,
  };
}
