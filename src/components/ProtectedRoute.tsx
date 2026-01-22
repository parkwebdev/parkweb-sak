/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication. Redirects unauthenticated users
 * to the login page and shows a loading animation for fresh sign-ins.
 * 
 * @module components/ProtectedRoute
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLoadingScreen } from '@/components/ui/app-loading-screen';
import { motion } from 'motion/react';
import { supabase } from '@/integrations/supabase/client';

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
  const location = useLocation();
  const navigate = useNavigate();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);
  const [isPilotTeamMember, setIsPilotTeamMember] = useState<boolean | null>(null);

  // Check if user is a Pilot team member (super_admin or pilot_support)
  useEffect(() => {
    async function checkPilotTeamRole() {
      if (!user) {
        setIsPilotTeamMember(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'pilot_support'])
        .maybeSingle();

      setIsPilotTeamMember(!!data);
    }

    checkPilotTeamRole();
  }, [user]);

  // Redirect Pilot team members to /admin if they're on a customer route
  useEffect(() => {
    if (isPilotTeamMember && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/settings')) {
      navigate('/admin', { replace: true });
    }
  }, [isPilotTeamMember, location.pathname, navigate]);

  /**
   * Handle loading screen completion
   * @internal
   */
  const handleLoadingComplete = () => {
    setLoadingComplete(true);
    clearJustSignedIn();
  };

  // Normal loading state (session check) - show nothing
  if (loading || isPilotTeamMember === null) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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