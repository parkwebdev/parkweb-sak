/**
 * Dashboard Page Component
 * 
 * Main dashboard displaying header and overview.
 * Detailed metrics moved to Analytics page.
 * 
 * @module pages/Dashboard
 */

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Cube01 as Bot } from '@untitledui/icons';
import { LoadingState } from '@/components/ui/loading-state';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <LoadingState size="xl" fullPage />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-base font-bold mb-2">Not Authenticated</h2>
          <p className="text-sm text-muted-foreground">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 min-h-0 h-full overflow-y-auto bg-muted/30">
      <div className="flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-8">
        {/* Header */}
        <div className="px-4 lg:px-8">
          <DashboardHeader title="Dashboard" />
        </div>
      </div>
    </main>
  );
};
