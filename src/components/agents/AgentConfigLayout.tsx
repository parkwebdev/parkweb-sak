import React from 'react';
import { Settings01 as Settings, Database01, Tool01, Rocket01 } from '@untitledui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type AgentConfigTab = 'settings' | 'knowledge' | 'tools' | 'deployment';

interface AgentConfigLayoutProps {
  activeTab: AgentConfigTab;
  onTabChange: (tab: AgentConfigTab) => void;
  children: React.ReactNode;
}

export const AgentConfigLayout: React.FC<AgentConfigLayoutProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as AgentConfigTab)}>
      {/* Horizontal Tab Navigation */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="px-4 lg:px-8">
          <TabsList className="h-12 bg-transparent border-0 p-0 gap-6">
            <TabsTrigger
              value="settings"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Settings size={16} className="mr-2" />
              <span className="hidden sm:inline">Configure</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
            
            <TabsTrigger
              value="knowledge"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Database01 size={16} className="mr-2" />
              Knowledge
            </TabsTrigger>
            
            <TabsTrigger
              value="tools"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Tool01 size={16} className="mr-2" />
              Tools
            </TabsTrigger>
            
            <TabsTrigger
              value="deployment"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Rocket01 size={16} className="mr-2" />
              Deploy
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 lg:px-8 py-6">
        {children}
      </div>
    </Tabs>
  );
};
