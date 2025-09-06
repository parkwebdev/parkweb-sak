import React from 'react';
import { Home01 as Home, Grid01 as Grid, File02 as FileText, Users01 as Users, Settings01 as Settings, UserCheck01 as Team } from '@untitledui/icons';
import { Link, useLocation } from 'react-router-dom';
import { UserAccountCard } from './UserAccountCard';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Grid,
    path: '/'
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    icon: Users,
    path: '/onboarding'
  },
  {
    id: 'scope-of-works',
    label: 'Scope of Works',
    icon: FileText,
    path: '/scope-of-works'
  },
  {
    id: 'team',
    label: 'Team',
    icon: Team,
    path: '/team'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-lg lg:hidden transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="px-4 py-6 space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-center">
            <div className="text-xl font-bold text-foreground">Agency</div>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground font-medium' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* User Account */}
          <div className="pt-4 border-t border-border">
            <UserAccountCard isCollapsed={false} />
          </div>
        </div>
      </div>
    </>
  );
};