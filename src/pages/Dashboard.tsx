import React from 'react';

interface DashboardProps {
  onMenuClick?: () => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const Dashboard: React.FC<DashboardProps> = () => {
  return (
    <div className="flex items-center justify-center min-h-screen p-8 text-muted-foreground">
      <p>Dashboard is being rebuilt for the new multi-tenant architecture.</p>
    </div>
  );
};
