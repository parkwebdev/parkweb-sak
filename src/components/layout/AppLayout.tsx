/**
 * @fileoverview Main application layout wrapper.
 * Provides sidebar navigation and responsive content area.
 */

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Menu01 as Menu } from '@untitledui/icons';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  
  // Initialize keyboard shortcuts at app level
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-app-background">
      {/* Skip Navigation Link - WCAG AAA */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-primary-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
      <div className={`flex-1 flex flex-col min-h-0 min-w-0 w-full transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]'
      }`}>
        <div className="flex-1 min-h-0 min-w-0 m-2 ml-0 lg:m-4 lg:ml-0 rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center px-4 py-3 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} aria-hidden="true" />
            </Button>
          </div>
          
          {/* Page Content - flex column container so children can use flex-1 properly */}
          <main id="main-content" className="flex-1 min-h-0 overflow-hidden flex flex-col" tabIndex={-1}>
            <div className="flex-1 min-h-0 flex flex-col">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
