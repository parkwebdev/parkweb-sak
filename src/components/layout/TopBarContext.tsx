/**
 * @fileoverview TopBar Context Provider
 * Provides a context for pages to set their top bar content dynamically.
 * 
 * Uses a stable identity system to prevent re-render cascades:
 * - Each page provides a unique pageId
 * - Config updates use a ref-based approach to prevent unnecessary re-renders
 * 
 * @example
 * ```tsx
 * // In a page component - memoize the config and pass a pageId
 * const topBarConfig = useMemo(() => ({
 *   left: <TopBarPageContext title="Leads" icon={Users01} />,
 *   right: <Button size="sm">+ Add Lead</Button>,
 * }), []);
 * 
 * useTopBar(topBarConfig, 'leads');
 * ```
 */

import React, { createContext, useContext, useState, useLayoutEffect, useCallback, useRef, type ReactNode } from 'react';

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
 * 
 * IMPORTANT: The pageId parameter is crucial for stable identity.
 * When a pageId is provided, the config only updates if:
 * 1. The component is mounting
 * 2. The pageId changes (navigation to a new page)
 * 3. The config reference changes (controlled updates via useMemo)
 * 
 * @param config - The top bar configuration for this page (should be memoized)
 * @param pageId - Unique identifier for this page (e.g., 'leads', 'conversations')
 * 
 * @example
 * ```tsx
 * const topBarConfig = useMemo(() => ({
 *   left: <TopBarPageContext title="Analytics" icon={TrendUp01} />,
 *   right: <AnalyticsDatePicker />,
 * }), []);
 * 
 * useTopBar(topBarConfig, 'analytics');
 * ```
 */
export function useTopBar(config: TopBarConfig, pageId?: string) {
  const { setConfig } = useContext(TopBarContext);
  const pageIdRef = useRef(pageId);
  const configRef = useRef(config);
  const hasMountedRef = useRef(false);
  
  // Use layout effect to set config synchronously before paint
  // This prevents flashing of stale content
  useLayoutEffect(() => {
    // Set config on mount
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      pageIdRef.current = pageId;
      configRef.current = config;
      setConfig(config);
      return;
    }
    
    // Update if pageId changed (navigation)
    if (pageIdRef.current !== pageId) {
      pageIdRef.current = pageId;
      configRef.current = config;
      setConfig(config);
      return;
    }
    
    // Only update if config reference actually changed (useMemo recomputed)
    // This prevents updates from child re-renders when config is memoized with stable deps
    if (configRef.current !== config) {
      configRef.current = config;
      setConfig(config);
    }
    // Only depend on config and pageId - setConfig is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, pageId]);
  
  // Separate cleanup effect that only runs on unmount
  // NOTE: We intentionally do NOT call setConfig({}) here.
  // The next page will set its own config on mount, and calling setConfig({})
  // during unmount causes infinite re-render loops when components remount quickly.
  useLayoutEffect(() => {
    return () => {
      hasMountedRef.current = false;
    };
  }, []);
}
