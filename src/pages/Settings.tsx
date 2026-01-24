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

import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getNavigationIcon } from '@/lib/navigation-icons';
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
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';

function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading } = useRoleAuthorization();
  const canManage = useCanManageChecker();
  
  // Derive active tab directly from URL (source of truth)
  const activeTab = useMemo((): SettingsTab => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'subscription') return 'billing';
    const validTab = SETTINGS_TABS.find(t => t.tabParam === tabParam);
    return (validTab?.tabParam as SettingsTab) || 'general';
  }, [searchParams]);

  // Handle tab changes by updating URL
  const handleTabChange = (newTab: SettingsTab) => {
    setSearchParams({ tab: newTab }, { replace: true });
  };
  
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={getNavigationIcon('Settings01')} title="Settings" />,
  }), []);
  useTopBar(topBarConfig);

  // Filter tabs for mobile view
  const visibleTabs = useMemo(() => {
    if (loading) return SETTINGS_TABS;
    return SETTINGS_TABS.filter(tab => {
      if (!tab.requiredPermission) return true;
      return canManage(tab.requiredPermission);
    });
  }, [canManage, loading]);

  // Listen for custom events from keyboard shortcuts
  React.useEffect(() => {
    const handleSetActiveTab = (event: CustomEvent<string>) => {
      handleTabChange(event.detail as SettingsTab);
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
        onTabChange={handleTabChange}
      />

      {/* Center: Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {/* Mobile tab navigation */}
        <div className="lg:hidden px-4 pt-4">
          <div className="flex overflow-x-auto gap-1 mb-4 pb-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.tabParam as SettingsTab)}
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