export interface TeamMember {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at?: string;
  role?: string;
  permissions?: string[];
}

export interface InviteMemberData {
  email: string;
  role?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'member' | 'client';

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