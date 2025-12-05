import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoadingScreen } from '@/components/ui/app-loading-screen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, justSignedIn, clearJustSignedIn } = useAuth();
  const location = useLocation();

  // Show animated loading screen only for fresh sign-ins
  if (justSignedIn) {
    return (
      <AppLoadingScreen 
        isLoading={true} 
        onLoadingComplete={clearJustSignedIn}
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

  return <>{children}</>;
};
