/**
 * @fileoverview TopBar Context Provider (Split Architecture)
 * 
 * Uses TWO separate contexts to prevent re-render cascades:
 * - TopBarConfigContext: For components that RENDER the top bar (read-only)
 * - TopBarSetConfigContext: For pages that SET the top bar content (write-only)
 * 
 * This separation ensures that pages calling setConfig do NOT re-render
 * when the config value changes, eliminating infinite loop possibilities.
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

// Context for READING config (used by TopBar component)
const TopBarConfigContext = createContext<TopBarConfig>({});

// Context for SETTING config (used by pages via useTopBar) - stable setter
const TopBarSetConfigContext = createContext<(config: TopBarConfig) => void>(() => {});

interface TopBarProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app to enable top bar configuration.
 * Uses split contexts to prevent re-render cascades.
 * 
 * - TopBarSetConfigContext provides a stable setConfig function
 * - TopBarConfigContext provides the current config value
 * 
 * Pages that call useTopBar() only subscribe to the setter context,
 * so they don't re-render when config changes.
 */
export function TopBarProvider({ children }: TopBarProviderProps) {
  const [config, setConfigState] = useState<TopBarConfig>({});
  
  // Stable setConfig that never changes identity
  const setConfig = useCallback((newConfig: TopBarConfig) => {
    setConfigState(newConfig);
  }, []);

  return (
    <TopBarSetConfigContext.Provider value={setConfig}>
      <TopBarConfigContext.Provider value={config}>
        {children}
      </TopBarConfigContext.Provider>
    </TopBarSetConfigContext.Provider>
  );
}

/**
 * Hook to access the current top bar configuration.
 * Used by the TopBar component to render the configured content.
 * 
 * Components using this hook WILL re-render when config changes.
 * This is intentional - the TopBar needs to re-render to show new content.
 */
export function useTopBarContext() {
  const config = useContext(TopBarConfigContext);
  return { config };
}

/**
 * Hook for pages to set their top bar content.
 * 
 * IMPORTANT: This hook subscribes ONLY to the setter context, not the config context.
 * This means pages will NOT re-render when the config changes, eliminating
 * the possibility of infinite re-render loops from config updates.
 * 
 * The pageId parameter provides stable identity for the page:
 * - When provided, config only updates if pageId changes or config reference changes
 * - Helps prevent unnecessary updates during navigation
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
  const setConfig = useContext(TopBarSetConfigContext);
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
    // Only depend on config and pageId - setConfig is stable from context
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
