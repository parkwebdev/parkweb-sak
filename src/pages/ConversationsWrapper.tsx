import React, { useState } from 'react';
import Conversations from './Conversations';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';
import { PageTransition } from '@/components/ui/page-transition';

const ConversationsWrapper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-muted/30" style={{ isolation: 'isolate' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar 
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <PageTransition>
          <Conversations onMenuClick={() => setSidebarOpen(true)} />
        </PageTransition>
      </div>
    </div>
  );
};

export default ConversationsWrapper;
