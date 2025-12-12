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
import { AppLoadingScreen } from '@/components/ui/app-loading-screen';
import { motion } from 'motion/react';
import { toast } from 'sonner';

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
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, justSignedIn, clearJustSignedIn } = useAuth();
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

  // Normal loading state (session check) - show nothing
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // For fresh sign-ins: render BOTH loading screen AND children (blurred underneath)
  if (justSignedIn || (loadingComplete && !hasShownToast)) {
    return (
      <>
        {/* Children underneath - start blurred, animate to clear when loading completes */}
        <motion.div
          initial={{ filter: "blur(8px)", opacity: 0.7 }}
          animate={loadingComplete 
            ? { filter: "blur(0px)", opacity: 1 } 
            : { filter: "blur(8px)", opacity: 0.7 }
          }
          transition={{ duration: 0.5, ease: "easeOut" }}
          onAnimationComplete={() => {
            if (loadingComplete && !hasShownToast) {
              setHasShownToast(true);
              toast.success("Welcome back!", {
                description: "You have been signed in successfully.",
              });
            }
          }}
          className="h-full"
        >
          {children}
        </motion.div>

        {/* Loading screen on top - exits instantly when complete */}
        {justSignedIn && (
          <AppLoadingScreen 
            isLoading={false}
            onLoadingComplete={handleLoadingComplete}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
};