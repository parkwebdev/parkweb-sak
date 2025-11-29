import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu01 as Menu } from '@untitledui/icons';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { TeamSettings } from '@/components/settings/TeamSettings';
import { TeamManagement } from '@/components/settings/TeamManagement';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { OrganizationSettings } from '@/components/settings/OrganizationSettings';
import { SubscriptionSettings } from '@/components/settings/SubscriptionSettings';
import { WebhookSettings } from '@/components/settings/WebhookSettings';
import { ApiKeySettings } from '@/components/settings/ApiKeySettings';
import { BrandingSettings } from '@/components/settings/BrandingSettings';

export type SettingsTab = 'general' | 'profile' | 'team' | 'notifications' | 'organization' | 'subscription' | 'webhooks' | 'api-keys' | 'branding';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for URL parameters
  const tabParam = searchParams.get('tab') as SettingsTab;
  const openMemberId = searchParams.get('open');

  // Set active tab from URL parameter
  useEffect(() => {
    if (tabParam && ['general', 'profile', 'team', 'notifications', 'organization', 'subscription', 'webhooks', 'api-keys', 'branding'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Clear URL parameters after processing
  useEffect(() => {
    if (tabParam || openMemberId) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('tab');
      newSearchParams.delete('open');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [tabParam, openMemberId, searchParams, setSearchParams]);

  // Listen for custom events from keyboard shortcuts
  React.useEffect(() => {
    const handleSetActiveTab = (event: CustomEvent<string>) => {
      setActiveTab(event.detail as SettingsTab);
    };

    window.addEventListener('setActiveTab', handleSetActiveTab as EventListener);
    return () => window.removeEventListener('setActiveTab', handleSetActiveTab as EventListener);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'profile':
        return <ProfileSettings />;
      case 'organization':
        return <OrganizationSettings />;
      case 'team':
        return <TeamManagement />;
      case 'subscription':
        return <SubscriptionSettings />;
      case 'branding':
        return <BrandingSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'webhooks':
        return <WebhookSettings />;
      case 'api-keys':
        return <ApiKeySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <SettingsLayout 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
          >
            {renderTabContent()}
          </SettingsLayout>
        </div>
      </header>
    </main>
  );
};

export default Settings;