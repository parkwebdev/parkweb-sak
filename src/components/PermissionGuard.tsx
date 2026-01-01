/**
 * Permission Guard Component
 * 
 * Protects routes based on user permissions.
 * Redirects to dashboard or shows access denied message.
 * 
 * @module components/PermissionGuard
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import type { AppPermission } from '@/types/team';
import { Lock01 } from '@untitledui/icons';

interface PermissionGuardProps {
  /** Required permission(s) to access this route */
  permission: AppPermission | AppPermission[];
  /** Child components to render when authorized */
  children: React.ReactNode;
  /** Redirect path when unauthorized (default: show message) */
  redirectTo?: string;
  /** Whether to show access denied UI instead of redirecting */
  showAccessDenied?: boolean;
}

/**
 * Route wrapper that enforces permission checks.
 * 
 * @example
 * <PermissionGuard permission="manage_billing">
 *   <BillingSettings />
 * </PermissionGuard>
 * 
 * @example
 * // Multiple permissions (any of them grants access)
 * <PermissionGuard permission={['view_leads', 'manage_leads']}>
 *   <LeadsPage />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  children,
  redirectTo,
  showAccessDenied = true,
}: PermissionGuardProps) {
  const { hasPermission, loading, isAdmin } = useRoleAuthorization();

  // Still loading permissions
  if (loading) {
    return null;
  }

  // Admins always have access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check if user has any of the required permissions
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = permissions.some(p => hasPermission(p));

  if (!hasAccess) {
    // Redirect if redirectTo is specified
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // Show access denied UI
    if (showAccessDenied) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Lock01 size={24} className="text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Access Restricted
          </h2>
          <p className="text-muted-foreground max-w-md">
            You don't have permission to access this page. Contact your administrator if you believe this is an error.
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
