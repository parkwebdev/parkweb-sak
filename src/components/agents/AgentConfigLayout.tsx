import React from 'react';
import { Settings01 as Settings, Database01, Tool01, Code01, MessageCircle02, Announcement01, BookOpen01 } from '@untitledui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type AgentConfigTab = 'configure' | 'behavior' | 'knowledge' | 'help' | 'tools' | 'embed' | 'announcements';

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
      <div className="border-b sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-6">
          <TabsList className="h-11 w-full bg-transparent border-0 p-0 gap-5 justify-start">
            <TabsTrigger
              value="configure"
              className="h-11 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
            >
              <Settings size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Configure</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
            
            <TabsTrigger
              value="behavior"
              className="h-11 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
            >
              <MessageCircle02 size={14} className="mr-1.5" />
              Behavior
            </TabsTrigger>
            
            <TabsTrigger
              value="knowledge"
              className="h-11 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
            >
              <Database01 size={14} className="mr-1.5" />
              Knowledge
            </TabsTrigger>
            
            <TabsTrigger
              value="help"
              className="h-11 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
            >
              <BookOpen01 size={14} className="mr-1.5" />
              Help Articles
            </TabsTrigger>
            
            <TabsTrigger
              value="tools"
              className="h-11 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
            >
              <Tool01 size={14} className="mr-1.5" />
              Tools
            </TabsTrigger>
            
            <TabsTrigger
              value="embed"
              className="h-11 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
            >
              <Code01 size={14} className="mr-1.5" />
              Embed
            </TabsTrigger>
            
            <TabsTrigger
              value="announcements"
              className="h-11 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm"
            >
              <Announcement01 size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Announcements</span>
              <span className="sm:hidden">News</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 py-4 flex-1 min-h-0">
        <div className="h-full">
          {children}
        </div>
      </div>
    </Tabs>
  );
};
