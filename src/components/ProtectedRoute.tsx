import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLoadingScreen } from '@/components/ui/app-loading-screen';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, justSignedIn, clearJustSignedIn } = useAuth();
  const location = useLocation();
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);

  const handleLoadingComplete = () => {
    setLoadingComplete(true);
    clearJustSignedIn();
  };

  // Normal loading state (session check) - show nothing
  if (loading) {
    return null;
  }

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
