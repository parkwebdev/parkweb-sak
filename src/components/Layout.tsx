import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileMenu } from './MobileMenu';
import { useSidebar } from '@/hooks/use-sidebar';

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/onboarding':
      return 'Onboarding';
    case '/scope-of-works':
      return 'Scope of Works';
    case '/team':
      return 'Team';
    case '/settings':
      return 'Settings';
    case '/profile':
      return 'Profile';
    default:
      return 'Agency';
  }
};

const getPageSubtitle = (pathname: string) => {
  switch (pathname) {
    case '/':
      return 'Overview of client onboarding and project metrics';
    case '/onboarding':
      return 'Manage client onboarding processes';
    case '/scope-of-works':
      return 'Manage and track all project scope documents';
    case '/team':
      return 'Manage your team and permissions';
    case '/settings':
      return 'Configure your account and preferences';
    default:
      return undefined;
  }
};

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  const pageTitle = getPageTitle(location.pathname);
  const pageSubtitle = getPageSubtitle(location.pathname);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={handleMobileMenuClose}
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'lg:ml-0' : 'lg:ml-0'
      } overflow-hidden`}>
        {/* Mobile Header */}
        <MobileHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          isMenuOpen={isMobileMenuOpen}
          onMenuToggle={handleMobileMenuToggle}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};