import React from 'react';
import { Settings01 as Settings, Database01, Tool01, Code01, MessageCircle02, Announcement01 } from '@untitledui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type AgentConfigTab = 'configure' | 'behavior' | 'knowledge' | 'tools' | 'embed' | 'announcements';

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
      {/* Horizontal Tab Navigation - Full Width */}
      <div className="border-b sticky top-0 z-10 bg-card">
        <div className="px-6">
          <TabsList className="h-12 w-full bg-transparent border-0 p-0 gap-6 justify-start">
            <TabsTrigger
              value="configure"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Settings size={16} className="mr-2" />
              <span className="hidden sm:inline">Configure</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
            
            <TabsTrigger
              value="behavior"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <MessageCircle02 size={16} className="mr-2" />
              Behavior
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
              value="embed"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Code01 size={16} className="mr-2" />
              Embed
            </TabsTrigger>
            
            <TabsTrigger
              value="announcements"
              className="h-12 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Announcement01 size={16} className="mr-2" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">News</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-4">
        {children}
      </div>
    </Tabs>
  );
};
