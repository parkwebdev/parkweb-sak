/**
 * Platform Help Center Types
 * 
 * Types for the admin-editable platform HC articles and categories.
 * 
 * @module types/platform-hc
 */

/**
 * Platform HC Category (editable by super admins)
 */
export interface PlatformHCCategory {
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
 * Platform HC Article (editable by super admins)
 */
export interface PlatformHCArticle {
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
 * Data for creating/updating a platform HC article
 */
export interface PlatformHCArticleInput {
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
 * Data for creating/updating a platform HC category
 */
export interface PlatformHCCategoryInput {
  id: string;
  label: string;
  color: string;
  icon_name: string;
  order_index?: number;
}
