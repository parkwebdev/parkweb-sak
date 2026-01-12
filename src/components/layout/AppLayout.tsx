/**
 * @fileoverview Main application layout wrapper.
 * Provides sidebar navigation, global top bar, and responsive content area.
 * 
 * The TopBar is a thin (h-12) static header that displays dynamic content
 * based on the current page using the TopBarContext.
 */

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TopBar, TopBarProvider, useTopBarContext } from '@/components/layout/TopBar';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { config } = useTopBarContext();
  
  // Initialize keyboard shortcuts at app level
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-background">
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
      
      {/* Main Content Container - Full height, edge-to-edge */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 w-full lg:ml-[240px]">
        {/* Global Top Bar - always visible */}
        <TopBar 
          left={config.left}
          center={config.center}
          right={config.right}
          onMobileMenuClick={() => setSidebarOpen(true)}
        />
        
        {/* Impersonation Banner - shows when admin is impersonating a user */}
        <ImpersonationBanner />
          
        {/* Page Content - flex column container so children can use flex-1 properly */}
        <main id="main-content" className="flex-1 min-h-0 overflow-hidden flex flex-col" tabIndex={-1}>
          <div className="flex-1 min-h-0 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TopBarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </TopBarProvider>
  );
}
