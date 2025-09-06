import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { TeamSettings } from '@/components/settings/TeamSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { useSidebar } from '@/hooks/use-sidebar';

export type SettingsTab = 'general' | 'profile' | 'team' | 'notifications';

const Settings = () => {
  const { isCollapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'team':
        return <TeamSettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <div className="fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0">
        <Sidebar />
      </div>
      
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <header className="mb-6">
              <h1 className="text-2xl font-semibold leading-tight mb-1">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </header>

            <SettingsLayout 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
            >
              {renderTabContent()}
            </SettingsLayout>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;