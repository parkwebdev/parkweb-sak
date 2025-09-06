import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SettingsLayout, SettingsTab } from '@/components/settings/SettingsLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { TeamSettings } from '@/components/settings/TeamSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'team':
        return <TeamSettings />;
      default:
        return <GeneralSettings />;
    }
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
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <div className="flex-1 lg:ml-[280px] overflow-auto min-h-screen">
        <main className="flex-1 bg-muted/30 pt-4 lg:pt-8 pb-12">
          <div className="px-4 lg:px-8">
            <SettingsLayout 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              onMenuClick={() => setSidebarOpen(true)}
            >
              {renderContent()}
            </SettingsLayout>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;