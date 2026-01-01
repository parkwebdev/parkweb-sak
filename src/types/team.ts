/**
 * Team Type Definitions
 * 
 * Type-safe interfaces for team member management,
 * roles, and permissions.
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
 * Available user roles in the system.
 * Ordered from highest to lowest privilege.
 */
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'member' | 'client';

/** App permissions matching the database enum */
export type AppPermission = 
  | 'manage_team'
  | 'view_team'
  | 'manage_projects'
  | 'view_projects'
  | 'manage_onboarding'
  | 'view_onboarding'
  | 'manage_scope_works'
  | 'view_scope_works'
  | 'manage_settings'
  | 'view_settings';

export interface RolePermissions {
  [key: string]: string[];
}

export const PERMISSION_GROUPS = {
  'Team Management': ['manage_team', 'view_team'],
  'Projects': ['manage_projects', 'view_projects'],
  'Onboarding': ['manage_onboarding', 'view_onboarding'],
  'Scope of Works': ['manage_scope_works', 'view_scope_works'],
  'Settings': ['manage_settings', 'view_settings'],
} as const;

export const PERMISSION_LABELS = {
  'manage_team': 'Manage Team Members',
  'view_team': 'View Team Members',
  'manage_projects': 'Manage Projects',
  'view_projects': 'View Projects',
  'manage_onboarding': 'Manage Client Onboarding',
  'view_onboarding': 'View Client Onboarding',
  'manage_scope_works': 'Manage Scope of Works',
  'view_scope_works': 'View Scope of Works',
  'manage_settings': 'Manage Settings',
  'view_settings': 'View Settings',
} as const;