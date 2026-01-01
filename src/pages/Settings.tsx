/**
 * Settings Page
 * 
 * Centralized settings management with tabs for:
 * - General: Organization-wide preferences
 * - Profile: User profile and avatar
 * - Team: Team member management and invitations
 * - Notifications: Email and browser notification preferences
 * - Billing: Subscription and payment management
 * - Usage: Resource usage metrics and limits
 * 
 * @page
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu01 as Menu } from '@untitledui/icons';
import { SettingsLayout, type SettingsTab } from '@/components/settings/SettingsLayout';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SubscriptionSettings } from '@/components/settings/SubscriptionSettings';
import { UsageSettings } from '@/components/settings/UsageSettings';
import { TeamSettings } from '@/components/settings/TeamSettings';
import { SETTINGS_TABS } from '@/config/routes';

/** Props for the Settings page */
interface SettingsProps {
  /** Handler for mobile menu toggle */
  onMenuClick?: () => void;
}

function Settings({ onMenuClick }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchParams, setSearchParams] = useSearchParams();

  // Check for URL parameters
  const tabParam = searchParams.get('tab');
  const openMemberId = searchParams.get('open');

  // Set active tab from URL parameter using centralized config
  useEffect(() => {
    // Handle legacy subscription param
    if (tabParam === 'subscription') {
      setActiveTab('billing');
      return;
    }
    
    // Validate against centralized SETTINGS_TABS config
    const validTabParams = SETTINGS_TABS.map(tab => tab.tabParam);
    if (tabParam && validTabParams.includes(tabParam)) {
      setActiveTab(tabParam as SettingsTab);
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
      case 'team':
        return <TeamSettings />;
      case 'billing':
        return <SubscriptionSettings />;
      case 'usage':
        return <UsageSettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-muted/30 h-full min-h-0 overflow-hidden">
      <header className="flex-1 flex flex-col min-h-0 w-full font-medium pt-4 lg:pt-8 overflow-y-auto pb-12">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden flex items-center gap-2"
              onClick={onMenuClick}
            >
              <Menu size={16} />
            </Button>
          </div>
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