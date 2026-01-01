/**
 * @fileoverview Settings page layout with sidebar navigation.
 * Provides responsive tabs for mobile and sidebar for desktop.
 * Filters tabs based on user permissions using centralized SETTINGS_TABS config.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Menu01 as Menu } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useCanManageChecker } from '@/hooks/useCanManage';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { springs } from '@/lib/motion-variants';
import { SETTINGS_TABS, type SettingsTabParam } from '@/config/routes';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

/** Settings tab type derived from centralized config */
export type SettingsTab = SettingsTabParam;

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

/**
 * Settings layout component with responsive sidebar/tabs.
 * Uses centralized SETTINGS_TABS from routes.ts for configuration.
 */
export function SettingsLayout({
  activeTab,
  onTabChange,
  children,
  onMenuClick,
}: SettingsLayoutContentProps) {
  const { loading } = useRoleAuthorization();
  const canManage = useCanManageChecker();
  
  // Filter menu items based on permissions using centralized config
  const menuItems = useMemo(() => {
    if (loading) return SETTINGS_TABS; // Show all while loading to prevent flash
    
    return SETTINGS_TABS.filter(tab => {
      if (!tab.requiredPermission) return true;
      return canManage(tab.requiredPermission);
    });
  }, [canManage, loading]);

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
          {menuItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.tabParam as SettingsTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                activeTab === tab.tabParam
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab.label}
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
            {menuItems.map((tab, index) => (
              <SettingsMenuItemButton
                key={tab.id}
                id={tab.tabParam as SettingsTab}
                label={tab.label}
                active={activeTab === tab.tabParam}
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