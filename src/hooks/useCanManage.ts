/**
 * useCanManage Hook
 * 
 * Simplified permission check for "can manage X" pattern.
 * Combines isAdmin check with specific permission check.
 * Replaces boilerplate: `const canManageX = isAdmin || hasPermission('manage_x')`
 * 
 * @module hooks/useCanManage
 */

import { useMemo, useCallback } from 'react';
import { useRoleAuthorization } from './useRoleAuthorization';
import type { AppPermission } from '@/types/team';

/**
 * Check if current user can manage a specific feature.
 * Returns true if user is admin OR has the specified permission.
 * 
 * @param permission - The permission to check
 * @returns boolean - Whether user can manage
 * 
 * @example
 * const canManageLeads = useCanManage('manage_leads');
 * const canManageAri = useCanManage('manage_ari');
 */
export function useCanManage(permission: AppPermission): boolean {
  const { hasPermission, isAdmin, loading } = useRoleAuthorization();
  
  return useMemo(() => {
    if (loading) return false;
    return isAdmin || hasPermission(permission);
  }, [isAdmin, hasPermission, permission, loading]);
}

/**
 * Check multiple permissions at once.
 * Returns an object with each permission as a key.
 * 
 * @param permissions - Array of permissions to check
 * @returns Record of permission -> boolean mappings
 * 
 * @example
 * const perms = useCanManageMultiple(['manage_leads', 'manage_ari']);
 * if (perms.manage_leads) { ... }
 */
export function useCanManageMultiple<T extends AppPermission>(
  permissions: readonly T[]
): Record<T, boolean> {
  const { hasPermission, isAdmin, loading } = useRoleAuthorization();
  
  return useMemo(() => {
    const result = {} as Record<T, boolean>;
    for (const perm of permissions) {
      result[perm] = loading ? false : (isAdmin || hasPermission(perm));
    }
    return result;
  }, [permissions, isAdmin, hasPermission, loading]);
}

/**
 * Hook that provides a permission checker function.
 * Useful when you need to check permissions dynamically.
 * 
 * @returns Function to check any permission
 * 
 * @example
 * const canManage = useCanManageChecker();
 * const canEdit = canManage('manage_ari');
 */
export function useCanManageChecker(): (permission: AppPermission) => boolean {
  const { hasPermission, isAdmin, loading } = useRoleAuthorization();
  
  return useCallback((permission: AppPermission) => {
    if (loading) return false;
    return isAdmin || hasPermission(permission);
  }, [isAdmin, hasPermission, loading]);
}
