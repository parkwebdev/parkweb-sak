/**
 * @fileoverview TopBar Tabs Component
 * Horizontal tab navigation for the center section of the TopBar.
 * Uses semantic styling tokens and supports icons.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface TopBarTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: React.ComponentType<{ size: number }>;
  /** Optional badge count */
  count?: number;
}

interface TopBarTabsProps {
  /** Array of tab configurations */
  tabs: TopBarTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Additional className for the container */
  className?: string;
}

/**
 * Horizontal tab navigation component for the TopBar center section.
 * Supports icons, counts/badges, and keyboard navigation.
 */
export function TopBarTabs({ tabs, activeTab, onTabChange, className }: TopBarTabsProps) {
  return (
    <nav 
      className={cn("flex items-center gap-1", className)} 
      role="tablist"
      aria-label="Page navigation"
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive 
                ? "bg-accent text-accent-foreground font-medium" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span 
                className={cn(
                  "ml-1 text-2xs tabular-nums px-1.5 py-0.5 rounded-full",
                  isActive 
                    ? "bg-foreground/10 text-foreground" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
