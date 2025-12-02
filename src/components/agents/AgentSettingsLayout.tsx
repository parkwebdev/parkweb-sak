import React from 'react';
import { Menu01 as Menu } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface AgentSettingsLayoutProps {
  children: React.ReactNode;
}

export type AgentSettingsTab = 'knowledge-sources' | 'help-articles' | 'api-access' | 'custom-tools';

interface AgentSettingsMenuItemProps {
  id: AgentSettingsTab;
  label: string;
  active: boolean;
  onClick: (id: AgentSettingsTab) => void;
}

const AgentSettingsMenuItem: React.FC<AgentSettingsMenuItemProps> = ({
  id,
  label,
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
      {label}
    </button>
  );
};

interface AgentSettingsLayoutContentProps {
  activeTab: AgentSettingsTab;
  onTabChange: (tab: AgentSettingsTab) => void;
  children: React.ReactNode;
  onMenuClick?: () => void;
  menuItems: Array<{ id: AgentSettingsTab; label: string }>;
  title: string;
  description: string;
}

export const AgentSettingsLayout: React.FC<AgentSettingsLayoutContentProps> = ({
  activeTab,
  onTabChange,
  children,
  onMenuClick,
  menuItems,
  title,
  description,
}) => {
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
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
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
      <div className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-8">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-foreground mb-1">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <AgentSettingsMenuItem
                key={item.id}
                id={item.id}
                label={item.label}
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