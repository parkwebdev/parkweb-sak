/**
 * Team Type Definitions
 * 
 * Type-safe interfaces for team member management,
 * roles, and granular permissions.
 * 
 * @module types/team
 */

/**
 * Team member profile with role information.
 * Combined from profiles and user_roles tables.
 */
export interface TeamMember {
  /** Profile record ID */
  id: string;
  /** User ID (auth.users reference) */
  user_id: string;
  /** Display name for the team member */
  display_name: string | null;
  /** Email address (only visible to self/owner) */
  email: string | null;
  /** Avatar image URL */
  avatar_url: string | null;
  /** Profile creation timestamp */
  created_at: string;
  /** Profile last update timestamp */
  updated_at?: string;
  /** User's role in the team */
  role?: string;
  /** List of specific permissions */
  permissions?: string[];
}

/**
 * Data required to invite a new team member.
 */
export interface InviteMemberData {
  /** First name of the invitee */
  firstName: string;
  /** Last name of the invitee */
  lastName: string;
  /** Email address to send invitation */
  email: string;
  /** Initial role for the invited member */
  role?: string;
}

/**
 * Available user roles in the system (customer-facing).
 * Ordered from highest to lowest privilege.
 */
export type UserRole = 'admin' | 'manager' | 'member';

/**
 * All possible roles including internal platform role.
 * Used for database compatibility where super_admin may exist.
 */
export type DatabaseRole = UserRole | 'super_admin';

/**
 * Granular app permissions matching the database enum.
 * Organized by feature area with view/manage pairs.
 */
export type AppPermission = 
  // Dashboard & Analytics
  | 'view_dashboard'
  // Ari Agent
  | 'manage_ari'
  // Conversations
  | 'view_conversations'
  | 'manage_conversations'
  // Leads
  | 'view_leads'
  | 'manage_leads'
  // Bookings
  | 'view_bookings'
  | 'manage_bookings'
  // Knowledge Base
  | 'view_knowledge'
  | 'manage_knowledge'
  // Help Center
  | 'view_help_articles'
  | 'manage_help_articles'
  // Team
  | 'view_team'
  | 'manage_team'
  // Settings
  | 'view_settings'
  | 'manage_settings'
  // Billing
  | 'view_billing'
  | 'manage_billing'
  // Integrations
  | 'view_integrations'
  | 'manage_integrations'
  // Webhooks
  | 'view_webhooks'
  | 'manage_webhooks'
  // API Keys
  | 'view_api_keys'
  | 'manage_api_keys';

/**
 * Permission groups for UI organization.
 * Each group contains related permissions.
 */
export const PERMISSION_GROUPS: Record<string, readonly AppPermission[]> = {
  'Dashboard & Analytics': ['view_dashboard'],
  'Ari Agent': ['manage_ari'],
  'Conversations': ['view_conversations', 'manage_conversations'],
  'Leads': ['view_leads', 'manage_leads'],
  'Bookings': ['view_bookings', 'manage_bookings'],
  'Knowledge Base': ['view_knowledge', 'manage_knowledge'],
  'Help Center': ['view_help_articles', 'manage_help_articles'],
  'Team': ['view_team', 'manage_team'],
  'Settings': ['view_settings', 'manage_settings'],
  'Billing': ['view_billing', 'manage_billing'],
  'Integrations': ['view_integrations', 'manage_integrations'],
  'Webhooks': ['view_webhooks', 'manage_webhooks'],
  'API Keys': ['view_api_keys', 'manage_api_keys'],
} as const;

/**
 * Human-readable labels for each permission.
 */
export const PERMISSION_LABELS: Record<AppPermission, string> = {
  'view_dashboard': 'View Dashboard & Analytics',
  'manage_ari': 'Configure Ari Agent',
  'view_conversations': 'View Conversations',
  'manage_conversations': 'Manage Conversations (takeover, close)',
  'view_leads': 'View Leads',
  'manage_leads': 'Manage Leads (edit, delete, move)',
  'view_bookings': 'View Bookings',
  'manage_bookings': 'Manage Bookings (cancel, reschedule)',
  'view_knowledge': 'View Knowledge Sources',
  'manage_knowledge': 'Manage Knowledge Sources',
  'view_help_articles': 'View Help Articles',
  'manage_help_articles': 'Manage Help Articles',
  'view_team': 'View Team Members',
  'manage_team': 'Manage Team (invite, remove, roles)',
  'view_settings': 'View Settings',
  'manage_settings': 'Manage Settings',
  'view_billing': 'View Billing & Usage',
  'manage_billing': 'Manage Billing & Subscription',
  'view_integrations': 'View Integrations',
  'manage_integrations': 'Manage Integrations',
  'view_webhooks': 'View Webhooks',
  'manage_webhooks': 'Manage Webhooks',
  'view_api_keys': 'View API Keys',
  'manage_api_keys': 'Manage API Keys',
};

/**
 * All available permissions as an array.
 */
export const ALL_PERMISSIONS: AppPermission[] = Object.keys(PERMISSION_LABELS) as AppPermission[];

/**
 * Default permissions for each role.
 * Used when assigning a new role to auto-populate permissions.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, AppPermission[]> = {
  admin: ALL_PERMISSIONS,
  manager: [
    'view_dashboard',
    'manage_ari',
    'view_conversations',
    'manage_conversations',
    'view_leads',
    'manage_leads',
    'view_bookings',
    'manage_bookings',
    'view_knowledge',
    'manage_knowledge',
    'view_help_articles',
    'manage_help_articles',
    'view_team',
    'view_settings',
    'view_billing',
    'view_integrations',
    'view_webhooks',
    'view_api_keys',
  ],
  member: [
    'view_dashboard',
    'view_conversations',
    'manage_conversations',
    'view_leads',
    'manage_leads',
    'view_bookings',
    'view_knowledge',
    'view_help_articles',
    'view_team',
    'view_settings',
  ],
};

export interface RolePermissions {
  [key: string]: string[];
}
