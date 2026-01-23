/**
 * Admin Section Permissions Configuration
 * 
 * Maps admin section IDs to required permissions.
 * null = accessible to all pilot team members.
 * 
 * @module config/admin-permissions
 */

import type { AdminPermission } from '@/types/admin';

/**
 * Permission requirements for each admin section.
 * Used by Sidebar and AdminSidebar to filter navigation.
 */
export const ADMIN_SECTION_PERMISSIONS: Record<string, AdminPermission | null> = {
  'overview': null, // All pilot team members can see overview
  'accounts': 'view_accounts',
  'prompts': 'manage_settings',
  'plans': 'view_revenue',
  'team': 'view_team',
  'knowledge': 'view_content',
  'emails': 'view_content',
  'analytics': 'view_revenue',
  'audit': null, // All pilot team members can see audit log
};
