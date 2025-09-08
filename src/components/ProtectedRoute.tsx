import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen bg-muted/30">
        <div className="w-[280px] border-r bg-card">
          <div className="p-6">
            <div className="h-8 bg-muted rounded animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <main className="flex-1 bg-muted/30 pt-8 pb-12">
            <div className="max-w-7xl mx-auto px-8">
              <div className="space-y-6">
                <div className="h-8 bg-muted rounded animate-pulse w-64"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-96"></div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="h-24 bg-muted rounded animate-pulse"></div>
                  <div className="h-24 bg-muted rounded animate-pulse"></div>
                  <div className="h-24 bg-muted rounded animate-pulse"></div>
                  <div className="h-24 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-96 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};