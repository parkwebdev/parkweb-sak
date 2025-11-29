import React, { useState } from 'react';
import AgentConfig from './AgentConfig';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';

const AgentConfigWrapper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-muted/30">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <AgentConfig onMenuClick={() => setSidebarOpen(true)} />
      </div>
    </div>
  );
};

export default AgentConfigWrapper;
