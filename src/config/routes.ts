/**
 * Centralized Route Configuration
 * 
 * Single source of truth for route-permission mappings.
 * Used by Sidebar, PermissionGuard, and useSearchData.
 * 
 * @module config/routes
 */

import type { AppPermission } from '@/types/team';

/**
 * Route configuration with permission requirements.
 */
export interface RouteConfig {
  /** Unique route identifier */
  id: string;
  /** Display label for navigation/search */
  label: string;
  /** URL path */
  path: string;
  /** Required permission (undefined = no permission needed) */
  requiredPermission?: AppPermission;
  /** If true, only admins can access */
  adminOnly?: boolean;
  /** Icon name for UntitledUI icons */
  iconName?: string;
  /** Keyboard shortcut (e.g., '⌥A') */
  shortcut?: string;
  /** Description for search results */
  description?: string;
  /** Whether this appears in main navigation */
  showInNav?: boolean;
  /** Whether this appears in bottom navigation */
  showInBottomNav?: boolean;
}

/** All application routes with permission requirements */
export const ROUTE_CONFIG: readonly RouteConfig[] = [
  // Main navigation routes
  {
    id: 'ari',
    label: 'Ari',
    path: '/ari',
    requiredPermission: 'manage_ari',
    iconName: 'AriLogo',
    shortcut: '⌥A',
    description: 'Configure your AI agent',
    showInNav: true,
  },
  {
    id: 'conversations',
    label: 'Inbox',
    path: '/conversations',
    requiredPermission: 'view_conversations',
    iconName: 'MessageChatSquare',
    shortcut: '⌥C',
    description: 'View all conversations',
    showInNav: true,
  },
  {
    id: 'planner',
    label: 'Planner',
    path: '/planner',
    requiredPermission: 'view_bookings',
    iconName: 'Calendar',
    shortcut: '⌥P',
    description: 'Manage calendar and events',
    showInNav: true,
  },
  {
    id: 'leads',
    label: 'Leads',
    path: '/leads',
    requiredPermission: 'view_leads',
    iconName: 'Users01',
    shortcut: '⌥L',
    description: 'Manage captured leads',
    showInNav: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    requiredPermission: 'view_dashboard',
    iconName: 'TrendUp01',
    shortcut: '⌥Y',
    description: 'View insights and metrics',
    showInNav: true,
  },
  // Bottom navigation routes
  {
    id: 'get-set-up',
    label: 'Get set up',
    path: '/',
    adminOnly: true,
    iconName: 'Circle',
    description: 'View overview and statistics',
    showInBottomNav: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    requiredPermission: 'view_settings',
    iconName: 'Settings01',
    shortcut: '⌥S',
    description: 'Manage organization settings',
    showInBottomNav: true,
  },
  {
    id: 'report-builder',
    label: 'Report Builder',
    path: '/report-builder',
    requiredPermission: 'view_dashboard',
    iconName: 'BarChart01',
    description: 'Build custom reports',
    showInNav: false,
    showInBottomNav: false,
  },
] as const;

/** Settings tab configuration */
export interface SettingsTabConfig {
  id: string;
  label: string;
  tabParam: string;
  requiredPermission?: AppPermission;
  iconName?: string;
  description?: string;
}

/**
 * Centralized settings tab configuration.
 * Used by SettingsLayout for sidebar/tabs and useSearchData for global search.
 * Order determines display order in the UI.
 */
export const SETTINGS_TABS: readonly SettingsTabConfig[] = [
  {
    id: 'settings-general',
    label: 'General',
    tabParam: 'general',
    iconName: 'Settings01',
    description: 'Organization settings',
    // No permission - always visible
  },
  {
    id: 'settings-profile',
    label: 'Profile',
    tabParam: 'profile',
    iconName: 'User01',
    description: 'Manage your profile',
    // No permission - always visible
  },
  {
    id: 'settings-team',
    label: 'Team',
    tabParam: 'team',
    requiredPermission: 'view_team',
    iconName: 'Users01',
    description: 'Manage team members',
  },
  {
    id: 'settings-billing',
    label: 'Billing',
    tabParam: 'billing',
    requiredPermission: 'view_billing',
    iconName: 'CreditCard01',
    description: 'Manage subscription and invoices',
  },
  {
    id: 'settings-usage',
    label: 'Usage',
    tabParam: 'usage',
    requiredPermission: 'view_billing',
    iconName: 'BarChart01',
    description: 'View usage metrics',
  },
  {
    id: 'settings-notifications',
    label: 'Notifications',
    tabParam: 'notifications',
    iconName: 'Bell01',
    description: 'Manage notification preferences',
    // No permission - always visible
  },
] as const;

/** Type for settings tab param values */
export type SettingsTabParam = typeof SETTINGS_TABS[number]['tabParam'];

/** Helper to get route by ID */
export function getRouteById(id: string): RouteConfig | undefined {
  return ROUTE_CONFIG.find(r => r.id === id);
}

/** Helper to get route by path */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return ROUTE_CONFIG.find(r => r.path === path);
}

/** Get all main navigation routes */
export function getMainNavRoutes(): readonly RouteConfig[] {
  return ROUTE_CONFIG.filter(r => r.showInNav);
}

/** Get all bottom navigation routes */
export function getBottomNavRoutes(): readonly RouteConfig[] {
  return ROUTE_CONFIG.filter(r => r.showInBottomNav);
}
