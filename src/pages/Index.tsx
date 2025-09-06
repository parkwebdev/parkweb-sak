import React, { useState } from 'react';
import { MainContent } from '@/components/MainContent';
import { Sidebar } from '@/components/Sidebar';

const Index = () => {
  const [activeTab, setActiveTab] = useState('onboarding');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[280px] overflow-auto bg-background">
        <MainContent activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
};

export default Index;
