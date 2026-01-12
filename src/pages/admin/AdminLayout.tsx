/**
 * Admin Layout Component
 * 
 * Security wrapper for all Super Admin Dashboard pages.
 * Validates super admin access before rendering content.
 * 
 * @module pages/admin/AdminLayout
 */

import { Outlet, Navigate } from 'react-router-dom';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Admin layout with security guards for Super Admin Dashboard.
 * The actual sidebar and topbar are handled by the regular AppLayout.
 */
export function AdminLayout() {
  const { isSuperAdmin, loading } = useRoleAuthorization();

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="w-64 h-8" />
      </div>
    );
  }

  // Redirect non-super-admins to dashboard
  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex-1 min-h-0 h-full overflow-y-auto">
      <Outlet />
    </div>
  );
}
