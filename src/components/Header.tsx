import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SearchInput } from './SearchInput';
import { NotificationCenter } from './notifications/NotificationCenter';
import { ThemeToggle } from './ThemeToggle';
import { UserAccountCard } from './UserAccountCard';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Sidebar Toggle */}
        <SidebarTrigger className="-ml-1" />
        
        {/* Search Bar - Center */}
        <div className="flex-1 max-w-2xl mx-auto">
          <SearchInput placeholder="Search..." />
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ThemeToggle isCollapsed={false} />
          <UserAccountCard isCollapsed={false} />
        </div>
      </div>
    </header>
  );
};
