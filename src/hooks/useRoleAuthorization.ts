import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type { DatabaseRole, AppPermission } from '@/types/team';
import type { AdminPermission } from '@/types/admin';

interface RoleAuthData {
  role: DatabaseRole | null;
  permissions: AppPermission[];
  adminPermissions: AdminPermission[];
  loading: boolean;
  
  // Role-based checks
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPilotTeamMember: boolean;
  
  // Permission checks - Core
  canViewDashboard: boolean;
  canManageAri: boolean;
  
  // Permission checks - Conversations
  canViewConversations: boolean;
  canManageConversations: boolean;
  
  // Permission checks - Leads
  canViewLeads: boolean;
  canManageLeads: boolean;
  
  // Permission checks - Bookings
  canViewBookings: boolean;
  canManageBookings: boolean;
  
  // Permission checks - Knowledge
  canViewKnowledge: boolean;
  canManageKnowledge: boolean;
  
  // Permission checks - Help Articles
  canViewHelpArticles: boolean;
  canManageHelpArticles: boolean;
  
  // Permission checks - Team
  canViewTeam: boolean;
  canManageTeam: boolean;
  
  // Permission checks - Settings
  canViewSettings: boolean;
  canManageSettings: boolean;
  
  // Permission checks - Billing
  canViewBilling: boolean;
  canManageBilling: boolean;
  
  // Permission checks - Integrations
  canViewIntegrations: boolean;
  canManageIntegrations: boolean;
  
  // Permission checks - Webhooks
  canViewWebhooks: boolean;
  canManageWebhooks: boolean;
  
  // Permission checks - API Keys
  canViewApiKeys: boolean;
  canManageApiKeys: boolean;
  
  // Generic permission checkers
  hasPermission: (permission: AppPermission) => boolean;
  hasAdminPermission: (permission: AdminPermission) => boolean;
}

/**
 * Hook for role-based authorization checks.
 * Fetches current user's role and permissions from database.
 * 
 * @returns {RoleAuthData} Role authorization data and permission helpers
 */
export const useRoleAuthorization = (): RoleAuthData => {
  const { user } = useAuth();
  const [role, setRole] = useState<DatabaseRole | null>(null);
  const [permissions, setPermissions] = useState<AppPermission[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setPermissions([]);
      setAdminPermissions([]);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, permissions, admin_permissions')
          .eq('user_id', user.id)
          .single();

        if (error) {
          logger.error('Error fetching user role', error);
          setRole('member');
          setPermissions([]);
          setAdminPermissions([]);
        } else {
          setRole(data.role as DatabaseRole);
          setPermissions((data.permissions as AppPermission[]) || []);
          setAdminPermissions((data.admin_permissions as AdminPermission[]) || []);
        }
      } catch (error: unknown) {
        logger.error('Error in fetchUserRole', error);
        setRole('member');
        setPermissions([]);
        setAdminPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Role-based checks
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'super_admin' || role === 'admin';
  const isPilotTeamMember = role === 'super_admin' || role === 'pilot_support';

  // Generic permission checker for customer app permissions
  const hasPermission = useCallback((permission: AppPermission): boolean => {
    if (isAdmin) return true; // Admins have all permissions
    return permissions.includes(permission);
  }, [isAdmin, permissions]);

  // Permission checker for admin dashboard permissions
  const hasAdminPermission = useCallback((permission: AdminPermission): boolean => {
    if (isSuperAdmin) return true; // Super admins have all admin permissions
    return adminPermissions.includes(permission);
  }, [isSuperAdmin, adminPermissions]);

  // Core permissions
  const canViewDashboard = hasPermission('view_dashboard');
  const canManageAri = hasPermission('manage_ari');

  // Conversations
  const canViewConversations = hasPermission('view_conversations');
  const canManageConversations = hasPermission('manage_conversations');

  // Leads
  const canViewLeads = hasPermission('view_leads');
  const canManageLeads = hasPermission('manage_leads');

  // Bookings
  const canViewBookings = hasPermission('view_bookings');
  const canManageBookings = hasPermission('manage_bookings');

  // Knowledge
  const canViewKnowledge = hasPermission('view_knowledge');
  const canManageKnowledge = hasPermission('manage_knowledge');

  // Help Articles
  const canViewHelpArticles = hasPermission('view_help_articles');
  const canManageHelpArticles = hasPermission('manage_help_articles');

  // Team
  const canViewTeam = hasPermission('view_team');
  const canManageTeam = hasPermission('manage_team');

  // Settings
  const canViewSettings = hasPermission('view_settings');
  const canManageSettings = hasPermission('manage_settings');

  // Billing
  const canViewBilling = hasPermission('view_billing');
  const canManageBilling = hasPermission('manage_billing');

  // Integrations
  const canViewIntegrations = hasPermission('view_integrations');
  const canManageIntegrations = hasPermission('manage_integrations');

  // Webhooks
  const canViewWebhooks = hasPermission('view_webhooks');
  const canManageWebhooks = hasPermission('manage_webhooks');

  // API Keys
  const canViewApiKeys = hasPermission('view_api_keys');
  const canManageApiKeys = hasPermission('manage_api_keys');

  return {
    role,
    permissions,
    adminPermissions,
    loading,
    
    // Role checks
    isAdmin,
    isSuperAdmin,
    isPilotTeamMember,
    
    // Permission checks
    canViewDashboard,
    canManageAri,
    canViewConversations,
    canManageConversations,
    canViewLeads,
    canManageLeads,
    canViewBookings,
    canManageBookings,
    canViewKnowledge,
    canManageKnowledge,
    canViewHelpArticles,
    canManageHelpArticles,
    canViewTeam,
    canManageTeam,
    canViewSettings,
    canManageSettings,
    canViewBilling,
    canManageBilling,
    canViewIntegrations,
    canManageIntegrations,
    canViewWebhooks,
    canManageWebhooks,
    canViewApiKeys,
    canManageApiKeys,
    
    // Generic checkers
    hasPermission,
    hasAdminPermission,
  };
};
