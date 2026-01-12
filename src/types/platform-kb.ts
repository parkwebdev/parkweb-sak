/**
 * Platform Knowledge Base Types
 * 
 * Types for the admin-editable platform KB articles and categories.
 * 
 * @module types/platform-kb
 */

/**
 * Platform KB Category (editable by super admins)
 */
export interface PlatformKBCategory {
  id: string;
  label: string;
  color: string;
  icon_name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  article_count?: number;
}

/**
 * Platform KB Article (editable by super admins)
 */
export interface PlatformKBArticle {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  icon_name: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  /** Joined category label */
  category_label?: string;
}

/**
 * Data for creating/updating a platform KB article
 */
export interface PlatformKBArticleInput {
  category_id: string;
  slug: string;
  title: string;
  description?: string | null;
  content: string;
  icon_name?: string | null;
  order_index?: number;
  is_published?: boolean;
}

/**
 * Data for creating/updating a platform KB category
 */
export interface PlatformKBCategoryInput {
  id: string;
  label: string;
  color: string;
  icon_name: string;
  order_index?: number;
}
