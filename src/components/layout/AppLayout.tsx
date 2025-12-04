import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from './AppHeader';
import { useSidebar } from '@/hooks/use-sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-app-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Free-floating Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Wrapped Content Container */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
      }`}>
        <div className="flex-1 m-2 ml-0 lg:m-4 lg:ml-0 rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
          {/* Global Header */}
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          
          {/* Page Content - flex-1 fills remaining space, min-h-0 enables children overflow */}
          <main className="flex-1 min-h-0 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
