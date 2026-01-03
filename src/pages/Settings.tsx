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
 * Matches Ari Configurator layout pattern with fixed sidebar.
 * 
 * @page
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Menu01 as Menu } from '@untitledui/icons';
import { SettingsSectionMenu, type SettingsTab } from '@/components/settings/SettingsSectionMenu';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SubscriptionSettings } from '@/components/settings/SubscriptionSettings';
import { UsageSettings } from '@/components/settings/UsageSettings';
import { TeamSettings } from '@/components/settings/TeamSettings';
import { SessionsSection } from '@/components/settings/SessionsSection';
import { SETTINGS_TABS } from '@/config/routes';
import { cn } from '@/lib/utils';
import { useCanManageChecker } from '@/hooks/useCanManage';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import { springs } from '@/lib/motion-variants';

/** Props for the Settings page */
interface SettingsProps {
  /** Handler for mobile menu toggle */
  onMenuClick?: () => void;
}

function Settings({ onMenuClick }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading } = useRoleAuthorization();
  const canManage = useCanManageChecker();

  // Filter tabs for mobile view
  const visibleTabs = useMemo(() => {
    if (loading) return SETTINGS_TABS;
    return SETTINGS_TABS.filter(tab => {
      if (!tab.requiredPermission) return true;
      return canManage(tab.requiredPermission);
    });
  }, [canManage, loading]);

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
      case 'sessions':
        return <SessionsSection />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="flex-1 h-full bg-muted/30 flex min-h-0">
      {/* Left: Section Menu (Desktop) */}
      <SettingsSectionMenu
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Center: Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {/* Mobile header */}
        <div className="lg:hidden px-4 pt-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
            >
              <Menu size={16} />
            </Button>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Settings</h2>
              <p className="text-2xs text-muted-foreground">
                Manage your account and preferences
              </p>
            </div>
          </div>
          
          {/* Mobile tab navigation */}
          <div className="flex overflow-x-auto gap-1 mb-4 pb-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.tabParam as SettingsTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  activeTab === tab.tabParam
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content with animation */}
        <div className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springs.smooth}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default Settings;