/**
 * Admin Permission Guard Component
 * 
 * Protects admin pages by checking if the current user has
 * the required admin permission. Super admins bypass all checks.
 * 
 * Uses AdminRoleContext (provided by AdminLayout) for instant
 * permission checks without loading states or redundant DB calls.
 * 
 * @module components/admin/AdminPermissionGuard
 */

import { Link } from 'react-router-dom';
import { Lock01 } from '@untitledui/icons';
import { useAdminRole } from '@/contexts/AdminRoleContext';
import { Button } from '@/components/ui/button';
import { ADMIN_PERMISSION_LABELS, type AdminPermission } from '@/types/admin';

interface AdminPermissionGuardProps {
  children: React.ReactNode;
  /** Required admin permission to access this page */
  permission: AdminPermission;
}

/**
 * Guards admin pages based on granular admin permissions.
 * Super admins automatically have access to all pages.
 * 
 * No loading state needed - permissions are already loaded
 * and cached by AdminLayout via AdminRoleContext.
 */
export function AdminPermissionGuard({ children, permission }: AdminPermissionGuardProps) {
  const { isSuperAdmin, hasAdminPermission } = useAdminRole();

  // Super admins have unrestricted access
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check if user has the required permission
  if (hasAdminPermission(permission)) {
    return <>{children}</>;
  }

  // Access denied - show restricted UI
  const permissionLabel = ADMIN_PERMISSION_LABELS[permission] || permission;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Lock01 size={24} className="text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-base font-semibold text-foreground">Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          You don't have permission to access this page. 
          The <span className="font-medium">{permissionLabel}</span> permission is required.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">Return to Overview</Link>
        </Button>
      </div>
    </div>
  );
}
