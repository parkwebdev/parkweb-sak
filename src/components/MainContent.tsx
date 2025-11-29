import React from 'react';

interface MainContentProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onMenuClick?: () => void;
  pageTitle?: string;
  pageDescription?: string;
  showStats?: boolean;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const MainContent: React.FC<MainContentProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      <p>Main content component is being rebuilt for the new multi-tenant architecture.</p>
    </div>
  );
};
