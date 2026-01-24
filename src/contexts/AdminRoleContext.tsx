/**
 * Admin Role Context
 * 
 * Provides admin role state to all admin pages, hoisted from AdminLayout.
 * This eliminates redundant permission checks and loading states on navigation.
 * 
 * @module contexts/AdminRoleContext
 */

import { createContext, useContext } from 'react';
import type { AdminPermission } from '@/types/admin';

interface AdminRoleContextValue {
  /** Whether the current user is a super admin */
  isSuperAdmin: boolean;
  /** Check if user has a specific admin permission */
  hasAdminPermission: (permission: AdminPermission) => boolean;
}

const AdminRoleContext = createContext<AdminRoleContextValue | null>(null);

export const AdminRoleProvider = AdminRoleContext.Provider;

/**
 * Hook to access admin role context.
 * Must be used within AdminRoleProvider (i.e., inside admin routes).
 * 
 * @throws Error if used outside of AdminRoleProvider
 */
export function useAdminRole(): AdminRoleContextValue {
  const context = useContext(AdminRoleContext);
  if (!context) {
    throw new Error('useAdminRole must be used within AdminRoleProvider (inside admin routes)');
  }
  return context;
}
