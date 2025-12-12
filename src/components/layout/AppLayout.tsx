/**
 * @fileoverview Main application layout wrapper.
 * Provides sidebar navigation, header, and responsive content area.
 */

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from './AppHeader';
import { useSidebar } from '@/hooks/use-sidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  
  // Initialize keyboard shortcuts at app level
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-app-background">
      {/* Skip Navigation Link - WCAG AAA */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
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
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]'
      }`}>
        <div className="flex-1 min-h-0 m-2 ml-0 lg:m-4 lg:ml-0 rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
          {/* Global Header */}
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          
          {/* Page Content - flex-1 fills remaining space, min-h-0 enables children overflow */}
          <main id="main-content" className="flex-1 min-h-0 overflow-hidden" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
