/**
 * @fileoverview TopBar Context Provider
 * Provides a context for pages to set their top bar content dynamically.
 * 
 * @example
 * ```tsx
 * // In a page component
 * useTopBar({
 *   left: <TopBarPageContext title="Leads" icon={Users01} />,
 *   center: <TopBarTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />,
 *   right: <Button size="sm">+ Add Lead</Button>,
 * });
 * ```
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface TopBarConfig {
  /** Left section - page context/entity indicator */
  left?: ReactNode;
  /** Center section - tabs/navigation */
  center?: ReactNode;
  /** Right section - action buttons */
  right?: ReactNode;
}

interface TopBarContextValue {
  config: TopBarConfig;
  setConfig: (config: TopBarConfig) => void;
}

const TopBarContext = createContext<TopBarContextValue>({
  config: {},
  setConfig: () => {},
});

interface TopBarProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app to enable top bar configuration.
 * Should be placed inside AppLayout but outside the main content area.
 */
export function TopBarProvider({ children }: TopBarProviderProps) {
  const [config, setConfigState] = useState<TopBarConfig>({});
  
  const setConfig = useCallback((newConfig: TopBarConfig) => {
    setConfigState(newConfig);
  }, []);

  return (
    <TopBarContext.Provider value={{ config, setConfig }}>
      {children}
    </TopBarContext.Provider>
  );
}

/**
 * Hook to access the current top bar configuration.
 * Used by the TopBar component to render the configured content.
 */
export function useTopBarContext() {
  return useContext(TopBarContext);
}

/**
 * Hook for pages to set their top bar content.
 * Automatically clears the config when the component unmounts.
 * 
 * @param config - The top bar configuration for this page
 * 
 * @example
 * ```tsx
 * useTopBar({
 *   left: <TopBarPageContext title="Analytics" icon={TrendUp01} />,
 *   center: <TopBarTabs tabs={analyticsTabsConfig} activeTab={activeTab} onTabChange={setActiveTab} />,
 *   right: <AnalyticsDatePicker />,
 * });
 * ```
 */
export function useTopBar(config: TopBarConfig) {
  const { setConfig } = useContext(TopBarContext);
  
  useEffect(() => {
    setConfig(config);
    return () => setConfig({});
  }, [config, setConfig]);
}
