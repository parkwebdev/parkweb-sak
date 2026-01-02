/**
 * SettingsSectionMenu Component
 * 
 * Vertical section menu for the Settings page.
 * Matches the AriSectionMenu pattern with fixed sidebar.
 * Uses centralized SETTINGS_TABS config from routes.ts.
 * 
 * @module components/settings/SettingsSectionMenu
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useCanManageChecker } from '@/hooks/useCanManage';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { springs } from '@/lib/motion-variants';
import { SETTINGS_TABS, type SettingsTabParam } from '@/config/routes';
import {
  Settings01,
  User01,
  Users01,
  CreditCard01,
  BarChart01,
  Bell01,
} from '@untitledui/icons';

// Re-export the tab type from routes.ts
export type SettingsTab = SettingsTabParam;

// Icon mapping from string names to components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Settings01,
  User01,
  Users01,
  CreditCard01,
  BarChart01,
  Bell01,
};

function getIcon(iconName: string): React.ComponentType<{ size?: number; className?: string }> {
  return ICON_MAP[iconName] || Settings01;
}

interface SettingsSectionMenuProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export function SettingsSectionMenu({
  activeTab,
  onTabChange,
}: SettingsSectionMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  const { loading } = useRoleAuthorization();
  const canManage = useCanManageChecker();
  
  // Filter tabs based on permissions using centralized config
  const visibleTabs = useMemo(() => {
    if (loading) return SETTINGS_TABS; // Show all while loading to prevent flash
    
    return SETTINGS_TABS.filter(tab => {
      if (!tab.requiredPermission) return true;
      return canManage(tab.requiredPermission);
    });
  }, [canManage, loading]);

  return (
    <nav className="w-[240px] flex-shrink-0 border-r h-full overflow-y-auto py-4 px-3 hidden lg:block">
      <div className="mb-4 px-2.5">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-xs text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>
      <div className="space-y-0.5">
        {visibleTabs.map((tab, index) => {
          const isActive = activeTab === tab.tabParam;
          const Icon = getIcon(tab.iconName || 'Settings01');
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.tabParam as SettingsTab)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
              initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02, ...springs.smooth }}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className="truncate">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
