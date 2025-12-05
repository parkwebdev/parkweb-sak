import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoadingScreen } from '@/components/ui/app-loading-screen';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, justSignedIn, clearJustSignedIn } = useAuth();
  const location = useLocation();
  const [showBlurTransition, setShowBlurTransition] = useState(false);
  const [blurComplete, setBlurComplete] = useState(false);

  // Handle loading complete - trigger blur-to-clear transition
  const handleLoadingComplete = () => {
    setShowBlurTransition(true);
    clearJustSignedIn();
  };

  // Show animated loading screen only for fresh sign-ins
  if (justSignedIn) {
    return (
      <AppLoadingScreen 
        isLoading={false}
        onLoadingComplete={handleLoadingComplete}
      />
    );
  }

  // Normal loading state (session check) - show nothing
  if (loading) {
    return null;
  }

  if (!user) {
    // Redirect to auth page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // After loading animation completes, show app immediately
  if (showBlurTransition) {
    if (!blurComplete) {
      setBlurComplete(true);
      toast.success("Welcome back!", {
        description: "You have been signed in successfully.",
      });
    }
    return <>{children}</>;
  }

  return <>{children}</>;
};
