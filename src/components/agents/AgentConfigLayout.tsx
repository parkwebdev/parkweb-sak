import React from 'react';
import { Settings01 as Settings, Database01, Tool01, Rocket01, Menu01 as Menu, ChevronLeft } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type AgentConfigTab = 'settings' | 'knowledge' | 'tools' | 'deployment';

interface AgentConfigMenuItemProps {
  id: AgentConfigTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: (id: AgentConfigTab) => void;
}

const AgentConfigMenuItem: React.FC<AgentConfigMenuItemProps> = ({
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

interface AgentConfigLayoutProps {
  activeTab: AgentConfigTab;
  onTabChange: (tab: AgentConfigTab) => void;
  children: React.ReactNode;
  onMenuClick?: () => void;
  agentName: string;
}

export const AgentConfigLayout: React.FC<AgentConfigLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
  onMenuClick,
  agentName,
}) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { id: 'settings' as AgentConfigTab, label: 'Settings', icon: Settings },
    { id: 'knowledge' as AgentConfigTab, label: 'Knowledge', icon: Database01 },
    { id: 'tools' as AgentConfigTab, label: 'Tools', icon: Tool01 },
    { id: 'deployment' as AgentConfigTab, label: 'Deployment', icon: Rocket01 },
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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agents')}
                className="h-6 px-2"
              >
                <ChevronLeft size={14} />
                Back
              </Button>
            </div>
            <h2 className="text-sm font-semibold text-foreground">Configure Agent</h2>
            <p className="text-xs text-muted-foreground">{agentName}</p>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agents')}
              className="mb-4 h-8"
            >
              <ChevronLeft size={16} />
              Back to Agents
            </Button>
            <h2 className="text-sm font-semibold text-foreground mb-1">Configure Agent</h2>
            <p className="text-xs text-muted-foreground">{agentName}</p>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <AgentConfigMenuItem
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
