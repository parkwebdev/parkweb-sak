import React, { useState } from 'react';
import { Settings01 as Settings, User01 as User, Users01 as Users, Menu01 as Menu, Bell02 as Bell, Building02, CreditCard01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export type SettingsTab = 'general' | 'profile' | 'team' | 'notifications' | 'organization' | 'subscription' | 'webhooks';

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
  onMenuClick?: () => void;
}

export const SettingsLayout: React.FC<SettingsLayoutContentProps> = ({
  activeTab,
  onTabChange,
  children,
  onMenuClick,
}) => {
  const menuItems = [
    { id: 'general' as SettingsTab, label: 'General', icon: Settings },
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'organization' as SettingsTab, label: 'Organization', icon: Building02 },
    { id: 'team' as SettingsTab, label: 'Team', icon: Users },
    { id: 'subscription' as SettingsTab, label: 'Subscription', icon: CreditCard01 },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'webhooks' as SettingsTab, label: 'Webhooks', icon: Settings },
  ];

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
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">
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
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Desktop Left Sidebar Menu */}
      <div className="hidden lg:block w-64 flex-shrink-0">
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

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};