import React, { useState } from 'react';
import { Settings01 as Settings, User01 as User, Users01 as Users } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export type SettingsTab = 'general' | 'profile' | 'team';

interface SettingsMenuItemProps {
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: (id: SettingsTab) => void;
}

const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
};

interface SettingsLayoutContentProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  children: React.ReactNode;
}

export const SettingsLayout: React.FC<SettingsLayoutContentProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const menuItems = [
    { id: 'general' as SettingsTab, label: 'General', icon: Settings },
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'team' as SettingsTab, label: 'Team', icon: Users },
  ];

  return (
    <div className="flex gap-8 max-w-7xl mx-auto">
      {/* Left Sidebar Menu */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <SettingsMenuItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                active={activeTab === item.id}
                onClick={onTabChange}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};