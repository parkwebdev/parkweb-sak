import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SettingsLayout, SettingsTab } from '@/components/settings/SettingsLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { TeamSettings } from '@/components/settings/TeamSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

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
      <div className="fixed left-0 top-0 h-full z-10">
        <Sidebar />
      </div>
      <div className="flex-1 ml-[280px] overflow-auto min-h-screen">
        <main className="flex-1 bg-muted/30 pt-8 pb-12">
          <div className="px-8">
            <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
              {renderContent()}
            </SettingsLayout>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;