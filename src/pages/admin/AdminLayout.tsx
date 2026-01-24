/**
 * Admin Layout Component
 * 
 * Security wrapper for all Super Admin Dashboard pages.
 * Validates super admin access before rendering content.
 * Provides admin-specific global search and keyboard shortcuts.
 * 
 * Hoists permission checking to layout level to eliminate
 * redundant loading states on page navigation.
 * 
 * @module pages/admin/AdminLayout
 */

import { useMemo } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminGlobalSearchProvider } from '@/contexts/AdminGlobalSearchContext';
import { AdminRoleProvider } from '@/contexts/AdminRoleContext';
import { AdminGlobalSearch } from '@/components/admin/AdminGlobalSearch';
import { useAdminKeyboardShortcuts } from '@/hooks/admin/useAdminKeyboardShortcuts';

/**
 * Inner layout component that uses admin keyboard shortcuts.
 */
function AdminLayoutInner() {
  // Register admin keyboard shortcuts
  useAdminKeyboardShortcuts();

  return (
    <div className="flex-1 min-h-0 h-full overflow-y-auto">
      <Outlet />
    </div>
  );
}

/**
 * Admin layout with security guards for Super Admin Dashboard.
 * The actual sidebar and topbar are handled by the regular AppLayout.
 * 
 * Permission checking is hoisted here so child pages don't need
 * to show loading states - they can use useAdminRole() for instant access.
 */
export function AdminLayout() {
  const { isPilotTeamMember, isSuperAdmin, hasAdminPermission, loading } = useRoleAuthorization();

  // Memoize context value to prevent unnecessary re-renders
  const roleContextValue = useMemo(() => ({
    isSuperAdmin,
    hasAdminPermission,
  }), [isSuperAdmin, hasAdminPermission]);

  // Show loading state while checking permissions (only on first load)
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="w-64 h-8" />
      </div>
    );
  }

  // Redirect non-pilot-team members to dashboard
  if (!isPilotTeamMember) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminRoleProvider value={roleContextValue}>
      <AdminGlobalSearchProvider>
        <AdminGlobalSearch />
        <AdminLayoutInner />
      </AdminGlobalSearchProvider>
    </AdminRoleProvider>
  );
}
