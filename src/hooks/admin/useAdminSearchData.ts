/**
 * Hook for fetching admin-specific search data.
 * 
 * Provides data for the admin global search command palette.
 * Filters results based on admin permissions.
 * 
 * @module hooks/admin/useAdminSearchData
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { ADMIN_SECTIONS, type AdminSectionConfig } from '@/config/routes';
import type { AdminPermission } from '@/types/admin';

/**
 * Search result item structure for admin search
 */
export interface AdminSearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  url?: string;
  action?: () => void;
  iconName?: string;
  shortcut?: string;
}

/** Permission mapping for admin search categories */
const ADMIN_CATEGORY_PERMISSIONS: Record<string, AdminPermission | undefined> = {
  'Accounts': 'view_accounts',
  'Pilot Team': 'view_team',
  'Plans & Billing': 'view_revenue',
  'Revenue': 'view_revenue',
  'Help Articles': 'view_content',
  'Audit Log': undefined, // Super admins only
};

/**
 * Hook for fetching and managing admin search data.
 * 
 * @returns {Object} Search results and loading state
 */
export function useAdminSearchData() {
  const { user } = useAuth();
  const { isSuperAdmin, hasAdminPermission, loading: authLoading } = useRoleAuthorization();
  const [searchResults, setSearchResults] = useState<AdminSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Check if user has permission to view a category
   */
  const hasDataPermission = useCallback((category: string): boolean => {
    if (isSuperAdmin) return true;
    const permission = ADMIN_CATEGORY_PERMISSIONS[category];
    if (!permission) return isSuperAdmin; // No permission = super admin only
    return hasAdminPermission(permission);
  }, [isSuperAdmin, hasAdminPermission]);

  /**
   * Fetch all admin search data
   */
  const fetchAllData = useCallback(async () => {
    if (!user || authLoading) return;
    
    setLoading(true);
    const results: AdminSearchResult[] = [];

    try {
      // Quick Actions - Admin Sections
      ADMIN_SECTIONS.forEach((section: AdminSectionConfig) => {
        results.push({
          id: `admin-section-${section.id}`,
          title: section.label,
          description: section.description,
          category: 'Quick Actions',
          url: section.path,
          iconName: section.iconName,
        });
      });

      // Fetch pilot team members FIRST to exclude them from Accounts
      let pilotUserIds: string[] = [];
      
      const { data: pilotTeamRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['super_admin', 'pilot_support']);

      if (pilotTeamRoles) {
        pilotUserIds = pilotTeamRoles.map(m => m.user_id);
      }

      // Add Pilot Team results if permitted
      if (hasDataPermission('Pilot Team') && pilotTeamRoles && pilotTeamRoles.length > 0) {
        const { data: teamProfiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', pilotUserIds);

        if (teamProfiles) {
          teamProfiles.forEach((profile) => {
            const member = pilotTeamRoles.find(m => m.user_id === profile.user_id);
            results.push({
              id: `team-${profile.user_id}`,
              title: profile.display_name || profile.email || 'Unknown',
              description: member?.role === 'super_admin' ? 'Super Admin' : 'Pilot Support',
              category: 'Pilot Team',
              url: `/admin/team`,
              iconName: 'UserGroup',
            });
          });
        }
      }

      // Fetch accounts if permitted, EXCLUDING pilot team members
      if (hasDataPermission('Accounts')) {
        let query = supabase
          .from('profiles')
          .select('user_id, display_name, email, company_name');

        // Exclude pilot team members from accounts
        if (pilotUserIds.length > 0) {
          query = query.not('user_id', 'in', `(${pilotUserIds.join(',')})`);
        }

        const { data: accounts } = await query.limit(50);

        if (accounts) {
          accounts.forEach((account) => {
            results.push({
              id: `account-${account.user_id}`,
              title: account.display_name || account.email || 'Unknown',
              description: account.company_name || account.email || undefined,
              category: 'Accounts',
              url: `/admin/accounts/${account.user_id}`,
              iconName: 'User01',
            });
          });
        }
      }

      // Fetch platform help categories if permitted (using existing help_categories table)
      if (hasDataPermission('Help Articles')) {
        const { data: categories } = await supabase
          .from('help_categories')
          .select('id, name, description')
          .limit(20);

        if (categories) {
          categories.forEach((category) => {
            results.push({
              id: `hc-category-${category.id}`,
              title: category.name,
              description: category.description || 'Help Category',
              category: 'Help Articles',
              url: `/admin/knowledge`,
              iconName: 'BookOpen01',
            });
          });
        }
      }

      // Recent audit log entries (super admin only)
      if (isSuperAdmin) {
        const { data: auditLogs } = await supabase
          .from('admin_audit_log')
          .select('id, action, target_email, created_at')
          .order('created_at', { ascending: false })
          .limit(15);

        if (auditLogs) {
          auditLogs.forEach((log) => {
            const actionLabel = log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            results.push({
              id: `audit-${log.id}`,
              title: actionLabel,
              description: log.target_email || undefined,
              category: 'Recent Activity',
              url: `/admin/audit`,
              iconName: 'ClipboardCheck',
            });
          });
        }
      }

      setSearchResults(results);
    } catch (error: unknown) {
      console.error('Error fetching admin search data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, hasDataPermission, isSuperAdmin]);

  // Refetch when user changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    searchResults,
    loading,
    refetch: fetchAllData,
  };
}
