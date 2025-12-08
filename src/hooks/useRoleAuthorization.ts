import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import type { UserRole } from '@/types/team';

interface RoleAuthData {
  role: UserRole | null;
  permissions: string[];
  loading: boolean;
  isAdmin: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  hasPermission: (permission: string) => boolean;
}

export const useRoleAuthorization = (): RoleAuthData => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, permissions')
          .eq('user_id', user.id)
          .single();

        if (error) {
          logger.error('Error fetching user role', error);
          // Set default role if no role exists
          setRole('member');
          setPermissions([]);
        } else {
          setRole(data.role);
          setPermissions(data.permissions || []);
        }
      } catch (error) {
        logger.error('Error in fetchUserRole', error);
        setRole('member');
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'super_admin' || role === 'admin';
  const canManageTeam = isAdmin || permissions.includes('manage_team');
  const canManageSettings = isAdmin || permissions.includes('manage_settings');

  const hasPermission = (permission: string): boolean => {
    if (isAdmin) return true; // Admins have all permissions
    return permissions.includes(permission);
  };

  return {
    role,
    permissions,
    loading,
    isAdmin,
    canManageTeam,
    canManageSettings,
    hasPermission,
  };
};