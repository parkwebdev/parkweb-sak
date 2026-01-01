/**
 * @fileoverview Settings page layout with sidebar navigation.
 * Provides responsive tabs for mobile and sidebar for desktop.
 * Filters tabs based on user permissions.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Menu01 as Menu } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { springs } from '@/lib/motion-variants';
import type { AppPermission } from '@/types/team';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export type SettingsTab = 'general' | 'profile' | 'team' | 'notifications' | 'billing' | 'usage';

interface SettingsMenuItem {
  id: SettingsTab;
  label: string;
  requiredPermission?: AppPermission;
}

interface SettingsMenuItemProps {
  id: SettingsTab;
  label: string;
  active: boolean;
  onClick: (id: SettingsTab) => void;
  index: number;
}

function SettingsMenuItemButton({
  id,
  label,
  active,
  onClick,
  index,
}: SettingsMenuItemProps) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.button
      onClick={() => onClick(id)}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, ...springs.smooth }}
    >
      {label}
    </motion.button>
  );
};

interface SettingsLayoutContentProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  children: React.ReactNode;
  onMenuClick?: () => void;
}

// Menu items with their required permissions
const ALL_MENU_ITEMS: SettingsMenuItem[] = [
  { id: 'general', label: 'General' },
  { id: 'profile', label: 'Profile' },
  { id: 'team', label: 'Team', requiredPermission: 'view_team' },
  { id: 'billing', label: 'Billing', requiredPermission: 'view_billing' },
  { id: 'usage', label: 'Usage', requiredPermission: 'view_billing' },
  { id: 'notifications', label: 'Notifications' },
];

export function SettingsLayout({
  activeTab,
  onTabChange,
  children,
  onMenuClick,
}: SettingsLayoutContentProps) {
  const { hasPermission, isAdmin, loading } = useRoleAuthorization();
  
  // Filter menu items based on permissions
  const menuItems = useMemo(() => {
    if (loading) return ALL_MENU_ITEMS; // Show all while loading to prevent flash
    
    return ALL_MENU_ITEMS.filter(item => {
      if (!item.requiredPermission) return true;
      return isAdmin || hasPermission(item.requiredPermission);
    });
  }, [hasPermission, isAdmin, loading]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full">
      {/* Mobile header with menu button and tabs */}
      <div className="lg:hidden">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Settings</h2>
            <p className="text-xs text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>
        
        {/* Mobile tab navigation */}
        <div className="flex overflow-x-auto gap-1 mb-6 pb-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                activeTab === item.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Desktop Left Sidebar Menu */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-8">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-1">Settings</h2>
            <p className="text-xs text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item, index) => (
              <SettingsMenuItemButton
                key={item.id}
                id={item.id}
                label={item.label}
                active={activeTab === item.id}
                onClick={onTabChange}
                index={index}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};