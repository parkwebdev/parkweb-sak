import React, { useState } from 'react';
import { MainContent } from '@/components/MainContent';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';

const Index = () => {
  const [activeTab, setActiveTab] = useState('onboarding');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isCollapsed } = useSidebar();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  // Initialize keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts([
    {
      key: '.',
      ctrlKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsModal(true)
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open command palette',
      action: () => {} // Let SearchInput handle this
    }
  ]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex h-screen bg-muted/30">
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
          onShowShortcuts={() => setShowShortcutsModal(true)}
        />
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <MainContent 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onMenuClick={() => setSidebarOpen(true)}
        />
      </div>
      
      <KeyboardShortcutsModal
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
        shortcuts={shortcuts}
      />
    </div>
  );
};

export default Index;
