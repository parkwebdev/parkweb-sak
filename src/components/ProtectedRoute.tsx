/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication. Redirects unauthenticated users
 * to the login page and shows a loading animation for fresh sign-ins.
 * 
 * @module components/ProtectedRoute
 */

import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { useImpersonationTarget } from '@/hooks/admin/useImpersonation';
import { AppLoadingScreen } from '@/components/ui/app-loading-screen';
import { motion } from 'motion/react';

/**
 * Props for the ProtectedRoute component
 */
interface ProtectedRouteProps {
  /** Child components to render when authenticated */
  children: React.ReactNode;
}

/**
 * Route wrapper that enforces authentication.
 * Shows loading animation on fresh sign-in, redirects to login if unauthenticated.
 * 
 * @example
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, justSignedIn, clearJustSignedIn } = useAuth();
  const { isPilotTeamMember, loading: roleLoading } = useRoleAuthorization();
  const impersonatingUserId = useImpersonationTarget();
  const location = useLocation();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  /**
   * Handle loading screen completion
   * @internal
   */
  const handleLoadingComplete = () => {
    setLoadingComplete(true);
    clearJustSignedIn();
  };

  // Normal loading state (session check or role check) - show nothing
  if (loading || roleLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect Pilot team members to /admin if they're on a customer route
  // UNLESS they are actively impersonating a user account
  const isImpersonating = !!impersonatingUserId;
  
  if (isPilotTeamMember && !isImpersonating && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/settings')) {
    return <Navigate to="/admin" replace />;
  }

  // Determine if we're in the loading/blur phase
  const showLoadingOverlay = justSignedIn && !loadingComplete;
  const showBlur = justSignedIn && !loadingComplete;

  // Always wrap children in the same container to prevent remounting
  return (
    <>
      <motion.div
        initial={showBlur ? { filter: "blur(8px)", opacity: 0.7 } : false}
        animate={showBlur 
          ? { filter: "blur(8px)", opacity: 0.7 } 
          : { filter: "blur(0px)", opacity: 1 }
        }
        transition={{ duration: 0.5, ease: "easeOut" }}
        onAnimationComplete={() => {
          // Mark animation complete when transitioning from blurred to clear
          if (!showBlur && loadingComplete && !hasShownToast) {
            setHasShownToast(true);
          }
        }}
        className="h-full"
      >
        {children}
      </motion.div>

      {/* Loading screen overlay */}
      {showLoadingOverlay && (
        <AppLoadingScreen 
          isLoading={false}
          onLoadingComplete={handleLoadingComplete}
        />
      )}
    </>
  );
};